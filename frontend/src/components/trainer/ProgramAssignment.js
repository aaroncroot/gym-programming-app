import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProgramAssignment.css';
import { API_BASE_URL } from '../../config';

const ProgramAssignment = ({ user }) => {
  const [approvedClients, setApprovedClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsResponse, templatesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/auth/trainer/clients`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_BASE_URL}/api/programs/templates`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setApprovedClients(clientsResponse.data.clients || []);
      setTemplates(templatesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedTemplate || !selectedClient) {
      setError('Please select both a template and a client');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      setSuccess('');

      const response = await axios.post(`${API_BASE_URL}/api/programs/${selectedTemplate}/assign`, {
        clientId: selectedClient
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Program assigned successfully!');
      setSelectedClient('');
      setSelectedTemplate('');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error assigning program:', error);
      setError(error.response?.data?.message || 'Failed to assign program');
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="program-assignment">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="program-assignment">
      <div className="assignment-header">
        <h2>Assign Programs to Clients</h2>
        <p>Select an approved client and assign them a program from your template library</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="assignment-container">
        <div className="assignment-form">
          <h3>Assign New Program</h3>
          
          <form onSubmit={handleAssignProgram}>
            <div className="form-group">
              <label htmlFor="client">Select Approved Client</label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                required
              >
                <option value="">Choose a client...</option>
                {approvedClients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.firstName} {client.lastName} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="template">Select Program Template</label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                required
              >
                <option value="">Choose a program template...</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-assign"
              disabled={assigning || !selectedClient || !selectedTemplate}
            >
              {assigning ? 'Assigning...' : 'Assign Program'}
            </button>
          </form>
        </div>

        <div className="clients-overview">
          <h3>Your Approved Clients</h3>
          
          {approvedClients.length === 0 ? (
            <div className="no-clients">
              <p>No approved clients found. Clients will appear here once you approve them in the Client Approval section.</p>
            </div>
          ) : (
            <div className="clients-list">
              {approvedClients.map(client => (
                <div key={client._id} className="client-card">
                  <div className="client-info">
                    <h4>{client.firstName} {client.lastName}</h4>
                    <p>{client.email}</p>
                    <span className="status approved">Approved</span>
                  </div>
                  
                  <div className="client-details">
                    <div className="detail">
                      <span>Location:</span>
                      <span>{client.location?.city}, {client.location?.country}</span>
                    </div>
                    <div className="detail">
                      <span>Approved:</span>
                      <span>{formatDate(client.approvedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="templates-overview">
        <h3>Available Program Templates</h3>
        
        {templates.length === 0 ? (
          <div className="no-templates">
            <p>No program templates available. Create program templates first to assign them to clients.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template._id} className="template-card">
                <div className="template-header">
                  <h4>{template.name}</h4>
                  <span className={`category ${template.category}`}>
                    {template.category}
                  </span>
                </div>
                
                <p className="template-description">{template.description}</p>
                
                <div className="template-details">
                  <div className="detail">
                    <span>Duration:</span>
                    <span>{template.duration} weeks</span>
                  </div>
                  <div className="detail">
                    <span>Workouts/Week:</span>
                    <span>{template.workoutsPerWeek}</span>
                  </div>
                  <div className="detail">
                    <span>Difficulty:</span>
                    <span className={`difficulty ${template.difficulty}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <div className="detail">
                    <span>Workouts:</span>
                    <span>{template.workouts?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramAssignment; 