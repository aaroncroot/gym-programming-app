import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmailVerification.css';

function EmailVerification() {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      verifyEmail(token);
    } else {
      setError('No verification token found in URL');
      setVerificationStatus('error');
    }
  }, []);

  const verifyEmail = async (token) => {
    try {
      setVerificationStatus('verifying');
      const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
      
      if (response.data.success) {
        setVerificationStatus('success');
        setMessage(response.data.message);
        setUser(response.data.user);
      } else {
        setVerificationStatus('error');
        setError(response.data.message);
      }
    } catch (error) {
      setVerificationStatus('error');
      setError(error.response?.data?.message || 'Verification failed');
    }
  };

  const resendVerification = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/resend-verification', {
        email: user?.email
      });
      
      if (response.data.success) {
        setMessage('Verification email sent successfully. Please check your inbox.');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend verification email');
    }
  };

  const renderVerifying = () => (
    <div className="verification-container">
      <div className="verification-card">
        <div className="loading-spinner"></div>
        <h2>Verifying Your Email</h2>
        <p>Please wait while we verify your email address...</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="verification-container">
      <div className="verification-card success">
        <div className="success-icon">✓</div>
        <h2>Email Verified Successfully!</h2>
        <p>{message}</p>
        
        {user && (
          <div className="user-info">
            <h3>Welcome, {user.firstName}!</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.role === 'client' && user.pendingTrainerApproval && (
              <div className="pending-approval">
                <p>⏳ Your account is pending trainer approval</p>
                <p>You'll be notified once your trainer approves your account.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="next-steps">
          <h3>Next Steps:</h3>
          <ul>
            {user?.role === 'client' && user?.pendingTrainerApproval ? (
              <>
                <li>📧 Check your email for trainer approval notification</li>
                <li>⏳ Wait for your trainer to approve your account</li>
                <li>✅ Once approved, you can log in and start using the app</li>
              </>
            ) : (
              <>
                <li>�� You can now log in to your account</li>
                <li>📋 Explore your personalized dashboard</li>
                <li>�� Start your fitness journey!</li>
              </>
            )}
          </ul>
        </div>
        
        <button 
          className="btn-login"
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="verification-container">
      <div className="verification-card error">
        <div className="error-icon">✗</div>
        <h2>Verification Failed</h2>
        <p className="error-message">{error}</p>
        
        <div className="error-help">
          <h3>What you can do:</h3>
          <ul>
            <li>Check if the verification link is complete and correct</li>
            <li>Make sure the link hasn't expired (valid for 24 hours)</li>
            <li>Try logging in - your account might already be verified</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        
        <div className="button-group">
          <button 
            className="btn-resend"
            onClick={resendVerification}
          >
            Resend Verification Email
          </button>
          <button 
            className="btn-login"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {verificationStatus === 'verifying' && renderVerifying()}
      {verificationStatus === 'success' && renderSuccess()}
      {verificationStatus === 'error' && renderError()}
    </>
  );
}

export default EmailVerification; 