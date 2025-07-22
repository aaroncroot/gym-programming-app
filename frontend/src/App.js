import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setError('Failed to connect to backend');
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏋️ Gym Programming App</h1>
        {loading && <p>Loading...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        {message && <p>✅ {message}</p>}
        <p>Frontend and Backend are connected! 🚀</p>
      </header>
    </div>
  );
}

export default App;
