import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  useEffect(() => {
    fetchMyClients();
    fetchAvailableClients();
  }, []);

  const fetchMyClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/trainer/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching my clients:', error);
    }
  };

  const fetchAvailableClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/trainer/available-clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching available clients:', error);
    }
  };

  const assignClient = async (clientEmail) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/auth/trainer/clients', 
        { clientEmail },
        { headers: { Authorization: `Bearer ${token}` } }
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

  const removeClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to remove this client?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/auth/trainer/clients/${clientId}`, {
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
            onClick={() => assignClient(newClientEmail)}
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
                  onClick={() => removeClient(client._id)}
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
                  onClick={() => assignClient(client.email)}
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