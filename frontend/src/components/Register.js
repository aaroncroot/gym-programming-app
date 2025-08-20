import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Register.css';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client',
    selectedTrainer: '',
    location: {
      country: '',
      city: ''
    }
  });
  
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Trainer selection, 3: Confirmation

  // Load trainers and countries on component mount
  useEffect(() => {
    fetchTrainers();
    fetchCountries();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/trainers');
      setTrainers(response.data.trainers);
      setFilteredTrainers(response.data.trainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/countries');
      setCountries(response.data.countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country' || name === 'city') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        country,
        city: '' // Reset city when country changes
      }
    }));
    
    // Filter cities based on selected country
    if (country) {
      const countryData = countries.find(c => c.name === country);
      setCities(countryData ? countryData.cities : []);
    } else {
      setCities([]);
    }
    
    // Filter trainers based on country
    filterTrainers(country, formData.location.city);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city
      }
    }));
    
    // Filter trainers based on city
    filterTrainers(formData.location.country, city);
  };

  const filterTrainers = (country, city) => {
    // Add null check to prevent error when trainers haven't loaded yet
    if (!trainers || trainers.length === 0) {
      setFilteredTrainers([]);
      return;
    }
    
    let filtered = trainers;
    
    if (country) {
      filtered = filtered.filter(trainer => 
        trainer.location?.country === country
      );
    }
    
    if (city) {
      filtered = filtered.filter(trainer => 
        trainer.location?.city === city
      );
    }
    
    setFilteredTrainers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.role === 'client' && !formData.selectedTrainer) {
      setError('Please select a trainer');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        location: formData.location,
        selectedTrainer: formData.selectedTrainer
      };

      const response = await axios.post('http://localhost:5000/api/auth/register', registrationData);
      
      if (response.data.success) {
        setStep(3); // Show confirmation step
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="registration-step">
      <h2>Create Your Account</h2>
      <p className="step-description">Let's get started with your basic information</p>
      
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Username *</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>I am a:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="client">Client</option>
          <option value="trainer">Trainer</option>
        </select>
      </div>

      <button 
        type="button" 
        className="btn-next"
        onClick={() => setStep(2)}
        disabled={!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
      >
        Next: Location & Trainer Selection
      </button>
    </div>
  );

  const renderTrainerSelection = () => (
    <div className="registration-step">
      <h2>Location & Trainer Selection</h2>
      <p className="step-description">Choose your location and select a trainer</p>
      
      <div className="form-row">
        <div className="form-group">
          <label>Country *</label>
          <select
            name="country"
            value={formData.location.country}
            onChange={handleCountryChange}
            required
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>City *</label>
          <select
            name="city"
            value={formData.location.city}
            onChange={handleCityChange}
            required
            disabled={!formData.location.country}
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formData.role === 'client' && (
        <div className="form-group">
          <label>Select Your Trainer *</label>
          <select
            name="selectedTrainer"
            value={formData.selectedTrainer}
            onChange={handleChange}
            required
            disabled={!formData.location.country || !formData.location.city}
          >
            <option value="">Select a Trainer</option>
            {filteredTrainers.map(trainer => (
              <option key={trainer._id} value={trainer._id}>
                {trainer.firstName} {trainer.lastName} - {trainer.location?.city}
              </option>
            ))}
          </select>
          {filteredTrainers.length === 0 && formData.location.city && (
            <p className="no-trainers">No trainers available in this location. Please select a different city.</p>
          )}
        </div>
      )}

      <div className="button-group">
        <button 
          type="button" 
          className="btn-back"
          onClick={() => setStep(1)}
        >
          Back
        </button>
        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading || (formData.role === 'client' && !formData.selectedTrainer)}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="registration-step confirmation">
      <div className="success-icon">✓</div>
      <h2>Account Created Successfully!</h2>
      <p>Thank you for registering with us. Here's what happens next:</p>
      
      <div className="next-steps">
        <h3>Next Steps:</h3>
        <ul>
          <li>📧 Check your email for a verification link</li>
          <li>✅ Click the verification link to activate your account</li>
          {formData.role === 'client' && (
            <>
              <li>👨‍💼 Your selected trainer will receive a notification</li>
              <li>⏳ Wait for trainer approval to access your account</li>
            </>
          )}
          <li> Once approved, you can log in and start using the app</li>
        </ul>
      </div>

      <div className="account-details">
        <h3>Your Account Details:</h3>
        <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Role:</strong> {formData.role}</p>
        {formData.role === 'client' && formData.selectedTrainer && (
          <p><strong>Selected Trainer:</strong> {trainers.find(t => t._id === formData.selectedTrainer)?.firstName} {trainers.find(t => t._id === formData.selectedTrainer)?.lastName}</p>
        )}
      </div>

      <button 
        type="button" 
        className="btn-login"
        onClick={() => onRegister(null)} // Go back to login
      >
        Return to Login
      </button>
    </div>
  );

  return (
    <div className="registration-container">
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {step === 1 && renderBasicInfo()}
        {step === 2 && renderTrainerSelection()}
        {step === 3 && renderConfirmation()}
      </form>
    </div>
  );
}

export default Register;
