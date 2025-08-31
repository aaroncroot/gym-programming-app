import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ProgramCard from './ProgramCard';

function ProgramList({ user, onCreateNew }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setPrograms(response.data.programs || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    };

    fetchPrograms();
  }, []);

  const handleDelete = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/programs/${programId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setPrograms(programs.filter(program => program._id !== programId));
      } catch (error) {
        console.error('Error deleting program:', error);
      }
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
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProgramList; 