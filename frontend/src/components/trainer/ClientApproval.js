import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientApproval.css';
import { API_BASE_URL } from '../../config';

const ClientApproval = () => {
  const [pendingClients, setPendingClients] = useState([]);
  const [approvedClients, setApprovedClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientFeedback, setClientFeedback] = useState([]);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const fetchPendingClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/trainer/pending-clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching pending clients:', error);
      setError('Failed to load pending clients');
    }
  };

  const fetchApprovedClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/trainer/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setApprovedClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching approved clients:', error);
    }
  };

  const fetchUnreadFeedbackCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback/unread-count`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadFeedbackCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread feedback count:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setClientFeedback(response.data.feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  useEffect(() => {
    fetchPendingClients();
    fetchApprovedClients();
    fetchUnreadFeedbackCount();
    fetchFeedback();
  }, []);

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const allFeedback = response.data.data;
      const clientFeedback = allFeedback.filter(f => f.client._id === client._id);
      setClientFeedback(clientFeedback);
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error fetching client feedback:', error);
    }
  };

  const markFeedbackAsRead = async (feedbackId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/feedback/${feedbackId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchUnreadFeedbackCount();
      await fetchFeedback();
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const handleApproveClient = async (clientId) => {
    try {
      setApproving(clientId);
      setError('');
      setSuccess('');

      const response = await axios.post(`${API_BASE_URL}/api/auth/trainer/approve-client/${clientId}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Client approved successfully!');
      fetchPendingClients();
      fetchApprovedClients();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve client');
    } finally {
      setApproving(null);
    }
  };

  const handleRejectClient = async (clientId) => {
    try {
      setRejecting(clientId);
      setError('');
      setSuccess('');

      const response = await axios.post(`${API_BASE_URL}/api/auth/trainer/reject-client/${clientId}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Client request rejected');
      fetchPendingClients();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject client');
    } finally {
      setRejecting(null);
    }
  };

  const handleRemoveClient = async (clientId) => {
    if (window.confirm('Are you sure you want to remove this client?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/auth/trainer/clients/${clientId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSuccess('Client removed successfully!');
        fetchApprovedClients();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to remove client');
      }
    }
  };

  const renderPendingClient = (client) => (
    <div key={client._id} className="client-card pending">
      <div className="client-header">
        <div className="client-info">
          <h3>{client.firstName} {client.lastName}</h3>
          <p className="client-email">{client.email}</p>
          <p className="client-location">
            �� {client.location?.city}, {client.location?.country}
          </p>
        </div>
        <div className="client-status">
          <span className="status-badge pending">Pending Approval</span>
        </div>
      </div>
      
      <div className="client-details">
        <div className="detail-item">
          <strong>Registration Date:</strong> {new Date(client.createdAt).toLocaleDateString()}
        </div>
        <div className="detail-item">
          <strong>Username:</strong> {client.username}
        </div>
      </div>
      
      <div className="client-actions">
        <button 
          className="btn-approve"
          onClick={() => handleApproveClient(client._id)}
          disabled={loading || approving === client._id}
        >
          {approving === client._id ? 'Approving...' : '✅ Approve Client'}
        </button>
        <button 
          className="btn-reject"
          onClick={() => handleRejectClient(client._id)}
          disabled={loading || rejecting === client._id}
        >
          {rejecting === client._id ? 'Rejecting...' : '❌ Reject Request'}
        </button>
      </div>
    </div>
  );

  const renderApprovedClient = (client) => (
    <div key={client._id} className="client-card approved">
      <div className="client-header">
        <div className="client-info">
          <h3>{client.firstName} {client.lastName}</h3>
          <p className="client-email">{client.email}</p>
          <p className="client-location">
            �� {client.location?.city}, {client.location?.country}
          </p>
        </div>
        <div className="client-status">
          <span className="status-badge approved">Approved</span>
        </div>
      </div>
      
      <div className="client-details">
        <div className="detail-item">
          <strong>Approved Date:</strong> {new Date(client.approvedAt).toLocaleDateString()}
        </div>
        <div className="detail-item">
          <strong>Username:</strong> {client.username}
        </div>
        <div className="detail-item">
          <strong>Account Status:</strong> 
          <span className={`status-indicator ${client.isActive ? 'active' : 'inactive'}`}>
            {client.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <div className="client-actions">
        <button 
          className="btn-view-programs"
          onClick={() => window.location.href = `/trainer/clients/${client._id}/programs`}
        >
          📋 View Programs
        </button>
        <button 
          className="btn-remove"
          onClick={() => handleRemoveClient(client._id)}
          disabled={loading}
        >
          🗑️ Remove Client
        </button>
        {unreadFeedbackCount > 0 && (
          <span className="feedback-bell" title="New feedback available">
            🔔
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="client-approval">
      <div className="approval-header">
        <h2>👥 Client Approval Management</h2>
        <p>Manage client requests and your approved client relationships</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="tab-navigation">
        <button 
          className={`tab-button ${selectedTab === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedTab('pending')}
        >
          ⏳ Pending Requests ({pendingClients.length})
        </button>
        <button 
          className={`tab-button ${selectedTab === 'approved' ? 'active' : ''}`}
          onClick={() => setSelectedTab('approved')}
        >
          ✅ Approved Clients ({approvedClients.length})
        </button>
      </div>

      <div className="tab-content">
        {selectedTab === 'pending' && (
          <div className="pending-clients">
            {pendingClients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Pending Requests</h3>
                <p>You don't have any pending client approval requests at the moment.</p>
              </div>
            ) : (
              <div className="clients-grid">
                {pendingClients.map(renderPendingClient)}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'approved' && (
          <div className="approved-clients">
            {approvedClients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Approved Clients</h3>
                <p>You don't have any approved clients yet. Approve some client requests to get started!</p>
              </div>
            ) : (
              <div className="clients-grid">
                {approvedClients.map(renderApprovedClient)}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedClient && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Feedback from {selectedClient.firstName} {selectedClient.lastName}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {clientFeedback.length > 0 ? (
                <div className="feedback-list">
                  {clientFeedback.map((feedback, index) => (
                    <div key={feedback._id} className={`feedback-item ${!feedback.read ? 'unread' : ''}`}>
                      <div className="feedback-header">
                        <span className="feedback-date">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                        {feedback.rating && (
                          <span className="feedback-rating">
                            {'⭐'.repeat(feedback.rating)}
                          </span>
                        )}
                        {!feedback.read && (
                          <button 
                            className="mark-read-btn"
                            onClick={() => markFeedbackAsRead(feedback._id)}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                      <div className="feedback-content">
                        {feedback.feedback}
                      </div>
                      {feedback.workoutId && (
                        <div className="feedback-workout">
                          Workout: {feedback.workoutId.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-feedback">
                  <p>No feedback from this client yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientApproval; 