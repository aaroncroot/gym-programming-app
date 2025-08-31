import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Move these functions OUTSIDE of useEffect so they can be called from anywhere
  const fetchMyClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/trainer/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching my clients:', error);
    }
  };

  const fetchAvailableClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/trainer/available-clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailableClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching available clients:', error);
    }
  };

  useEffect(() => {
    fetchMyClients();
    fetchAvailableClients();
  }, []);

  const handleAssignClient = async (clientEmail) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/trainer/clients`,
        { clientEmail: clientEmail },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setSuccess('Client assigned successfully!');
      setNewClientEmail('');
      fetchMyClients();
      fetchAvailableClients();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign client');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to remove this client?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/auth/trainer/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Client removed successfully!');
      fetchMyClients();
      fetchAvailableClients();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-management">
      <h2>👥 Client Management</h2>
      
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

      <div className="management-section">
        <h3>➕ Assign New Client</h3>
        <div className="assign-client-form">
          <input
            type="email"
            placeholder="Enter client email"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
            className="client-email-input"
          />
          <button 
            onClick={() => handleAssignClient(newClientEmail)}
            disabled={loading || !newClientEmail}
            className="assign-btn"
          >
            {loading ? 'Assigning...' : 'Assign Client'}
          </button>
        </div>
      </div>

      <div className="management-section">
        <h3>📋 My Clients ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="no-clients">No clients assigned yet. Assign a client above to get started.</p>
        ) : (
          <div className="clients-grid">
            {clients.map(client => (
              <div key={client._id} className="client-card">
                <div className="client-info">
                  <h4>{client.username}</h4>
                  <p>{client.email}</p>
                  <small>Joined: {new Date(client.createdAt).toLocaleDateString()}</small>
                </div>
                <button 
                  onClick={() => handleRemoveClient(client._id)}
                  className="remove-btn"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="management-section">
        <h3>🔍 Available Clients ({availableClients.length})</h3>
        {availableClients.length === 0 ? (
          <p className="no-available">No available clients. All clients are already assigned to trainers.</p>
        ) : (
          <div className="available-clients-grid">
            {availableClients.map(client => (
              <div key={client._id} className="available-client-card">
                <div className="client-info">
                  <h4>{client.username}</h4>
                  <p>{client.email}</p>
                  <small>Joined: {new Date(client.createdAt).toLocaleDateString()}</small>
                </div>
                <button 
                  onClick={() => handleAssignClient(client.email)}
                  className="assign-btn"
                  disabled={loading}
                >
                  Assign to Me
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManagement; 