import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProgramCard from './ProgramCard';

function ProgramList({ user, onCreateNew }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle the new response structure
      if (response.data.success) {
        setPrograms(response.data.data || []);
      } else {
        setPrograms([]);
      }
    } catch (error) {
      setError('Failed to fetch programs');
      console.error('Error fetching programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/programs/${programId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrograms(programs.filter(program => program._id !== programId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete program');
    }
  };

  if (loading) {
    return <div className="loading">Loading programs...</div>;
  }

  return (
    <div className="program-list">
      <div className="program-header">
        <h2>
          {user?.role === 'trainer' ? 'My Created Programs' : 'My Assigned Programs'}
        </h2>
        {user?.role === 'trainer' && (
          <button 
            className="create-program-btn"
            onClick={onCreateNew}
          >
            + Create New Program
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="programs-grid">
        {programs.length === 0 ? (
          <div className="no-programs">
            <p>
              {user?.role === 'trainer' 
                ? 'No programs created yet. Create your first training program!' 
                : 'No programs assigned yet. Contact your trainer to get started!'
              }
            </p>
          </div>
        ) : (
          programs.map(program => (
            <ProgramCard 
              key={program._id}
              program={program}
              user={user}
              onDelete={handleDeleteProgram}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProgramList; 