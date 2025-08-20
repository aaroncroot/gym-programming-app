import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTester = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetchPrograms();
    fetchClients();
  }, []);

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrograms(response.data.data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const testApi = async (endpoint, method = 'GET', data = null, baseUrl = '/api/programs') => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        method,
        url: `http://localhost:5000${baseUrl}${endpoint}`,
        headers: { Authorization: `Bearer ${token}` }
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          success: true,
          data: response.data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          success: false,
          error: error.response?.data?.message || error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoints = [
    {
      name: 'Get All Programs',
      endpoint: '',
      method: 'GET',
      description: 'Fetch all programs for the current trainer'
    },
    {
      name: 'Get Templates',
      endpoint: '/templates',
      method: 'GET',
      description: 'Fetch only template programs'
    },
    {
      name: 'Get Client Programs',
      endpoint: '/client-programs',
      method: 'GET',
      description: 'Fetch only client-specific programs'
    },
    {
      name: 'Search Programs',
      endpoint: '/search?q=strength&type=templates',
      method: 'GET',
      description: 'Search programs with filters'
    },
    {
      name: 'Get Analytics',
      endpoint: '/analytics',
      method: 'GET',
      description: 'Get program analytics for trainer'
    }
  ];

  const testAuthEndpoints = [
    {
      name: 'Get My Clients',
      endpoint: '/trainer/clients',
      method: 'GET',
      description: 'Get all clients assigned to current trainer',
      baseUrl: '/api/auth'
    },
    {
      name: 'Get Available Clients',
      endpoint: '/trainer/available-clients',
      method: 'GET',
      description: 'Get all clients not assigned to any trainer',
      baseUrl: '/api/auth'
    },
    {
      name: 'Add Client',
      endpoint: '/trainer/clients',
      method: 'POST',
      data: { clientEmail: 'client@example.com' },
      description: 'Assign a client to current trainer',
      baseUrl: '/api/auth'
    }
  ];

  const testProgramSpecificEndpoints = [
    {
      name: 'Get Program Details',
      endpoint: `/${selectedProgram}`,
      method: 'GET',
      description: 'Get specific program details',
      requiresProgram: true
    },
    {
      name: 'Get Program Usage',
      endpoint: `/${selectedProgram}/usage`,
      method: 'GET',
      description: 'Get usage statistics for a program',
      requiresProgram: true
    },
    {
      name: 'Duplicate Program',
      endpoint: `/${selectedProgram}/duplicate`,
      method: 'POST',
      description: 'Duplicate a program',
      requiresProgram: true
    },
    {
      name: 'Archive Program',
      endpoint: `/${selectedProgram}/archive`,
      method: 'POST',
      description: 'Archive/unarchive a program',
      requiresProgram: true
    },
    {
      name: 'Assign to Client',
      endpoint: `/${selectedProgram}/assign`,
      method: 'POST',
      data: { clientId: selectedClient },
      description: 'Assign program to a client',
      requiresProgram: true,
      requiresClient: true
    },
    {
      name: 'Share Program',
      endpoint: `/${selectedProgram}/share`,
      method: 'POST',
      data: { trainerEmail: 'test@example.com' },
      description: 'Share program with another trainer',
      requiresProgram: true
    }
  ];

  const testClientManagementEndpoints = [
    {
      name: 'Remove Client',
      endpoint: `/trainer/clients/${selectedClient}`,
      method: 'DELETE',
      description: 'Remove a client from trainer',
      requiresClient: true,
      baseUrl: '/api/auth'
    },
    {
      name: 'Get My Trainer (Client Only)',
      endpoint: '/client/my-trainer',
      method: 'GET',
      description: 'Get the trainer assigned to current client',
      baseUrl: '/api/auth'
    }
  ];

  return (
    <div className="api-tester">
      <h2>🔧 API Testing Interface</h2>
      <p>Test all the new backend features here</p>
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="test-section">
        <h3>📊 General Endpoints</h3>
        <div className="endpoint-grid">
          {testEndpoints.map((test, index) => (
            <div key={index} className="endpoint-card">
              <h4>{test.name}</h4>
              <p>{test.description}</p>
              <button 
                onClick={() => testApi(test.endpoint, test.method, test.data, test.baseUrl)}
                disabled={loading}
                className="test-btn"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
              {results[test.endpoint] && (
                <div className={`result ${results[test.endpoint].success ? 'success' : 'error'}`}>
                  <strong>{results[test.endpoint].success ? '✅ Success' : '❌ Error'}</strong>
                  <small>{results[test.endpoint].timestamp}</small>
                  <pre>{JSON.stringify(results[test.endpoint].data || results[test.endpoint].error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="test-section">
        <h3> Auth Endpoints</h3>
        <div className="endpoint-grid">
          {testAuthEndpoints.map((test, index) => (
            <div key={index} className="endpoint-card">
              <h4>{test.name}</h4>
              <p>{test.description}</p>
              <button 
                onClick={() => testApi(test.endpoint, test.method, test.data, test.baseUrl)}
                disabled={loading}
                className="test-btn"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
              {results[test.endpoint] && (
                <div className={`result ${results[test.endpoint].success ? 'success' : 'error'}`}>
                  <strong>{results[test.endpoint].success ? '✅ Success' : '❌ Error'}</strong>
                  <small>{results[test.endpoint].timestamp}</small>
                  <pre>{JSON.stringify(results[test.endpoint].data || results[test.endpoint].error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="test-section">
        <h3>🎯 Program-Specific Endpoints</h3>
        
        <div className="selectors">
          <div className="selector">
            <label>Select Program:</label>
            <select 
              value={selectedProgram} 
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              <option value="">Choose a program...</option>
              {programs.map(program => (
                <option key={program._id} value={program._id}>
                  {program.name} ({program.isTemplate ? 'Template' : 'Client Program'})
                </option>
              ))}
            </select>
          </div>
          
          <div className="selector">
            <label>Select Client:</label>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.username} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="endpoint-grid">
          {testProgramSpecificEndpoints.map((test, index) => (
            <div key={index} className="endpoint-card">
              <h4>{test.name}</h4>
              <p>{test.description}</p>
              <button 
                onClick={() => testApi(test.endpoint, test.method, test.data, test.baseUrl)}
                disabled={loading || (test.requiresProgram && !selectedProgram) || (test.requiresClient && !selectedClient)}
                className="test-btn"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
              {results[test.endpoint] && (
                <div className={`result ${results[test.endpoint].success ? 'success' : 'error'}`}>
                  <strong>{results[test.endpoint].success ? '✅ Success' : '❌ Error'}</strong>
                  <small>{results[test.endpoint].timestamp}</small>
                  <pre>{JSON.stringify(results[test.endpoint].data || results[test.endpoint].error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="test-section">
        <h3>👥 Client Management Endpoints</h3>
        <div className="endpoint-grid">
          {testClientManagementEndpoints.map((test, index) => (
            <div key={index} className="endpoint-card">
              <h4>{test.name}</h4>
              <p>{test.description}</p>
              <button 
                onClick={() => testApi(test.endpoint, test.method, test.data, test.baseUrl)}
                disabled={loading || (test.requiresClient && !selectedClient)}
                className="test-btn"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
              {results[test.endpoint] && (
                <div className={`result ${results[test.endpoint].success ? 'success' : 'error'}`}>
                  <strong>{results[test.endpoint].success ? '✅ Success' : '❌ Error'}</strong>
                  <small>{results[test.endpoint].timestamp}</small>
                  <pre>{JSON.stringify(results[test.endpoint].data || results[test.endpoint].error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="test-section">
        <h3> Refresh Data</h3>
        <button onClick={() => { fetchPrograms(); fetchClients(); }} className="refresh-btn">
          Refresh Programs & Clients
        </button>
      </div>
    </div>
  );
};

export default ApiTester; 