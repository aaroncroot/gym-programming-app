import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import ExerciseLibrary from './components/ExerciseLibrary';
import WorkoutList from './components/WorkoutList';
import ProgramList from './components/ProgramList';
import CreateWorkout from './components/CreateWorkout';
import CreateProgram from './components/CreateProgram';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'exercises', 'workouts', 'programs', 'create-workout', 'create-program'

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Test backend connection
    fetch('http://localhost:5000/api/health')
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('dashboard');
  };

  const navigateToCreateWorkout = () => {
    setCurrentView('create-workout');
  };

  const navigateToCreateProgram = () => {
    setCurrentView('create-program');
  };

  const navigateBackToList = () => {
    if (currentView === 'create-workout') {
      setCurrentView('workouts');
    } else if (currentView === 'create-program') {
      setCurrentView('programs');
    }
  };

  if (loading) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏋️ Gym Programming App</h1>
        <p>✅ {message}</p>
        
        {user ? (
          <div className="user-dashboard">
            <div className="dashboard-header">
              <h2>Welcome, {user.username}! 🏋️</h2>
              <p>You are logged in as: {user.email}</p>
              <p>Role: <strong>{user.role === 'trainer' ? '👨‍💼 Trainer' : '👤 Client'}</strong></p>
            </div>
            
            {!currentView.startsWith('create-') && (
              <div className="navigation-tabs">
                <button 
                  className={currentView === 'dashboard' ? 'active' : ''}
                  onClick={() => setCurrentView('dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className={currentView === 'exercises' ? 'active' : ''}
                  onClick={() => setCurrentView('exercises')}
                >
                  Exercise Library
                </button>
                <button 
                  className={currentView === 'workouts' ? 'active' : ''}
                  onClick={() => setCurrentView('workouts')}
                >
                  Workouts
                </button>
                <button 
                  className={currentView === 'programs' ? 'active' : ''}
                  onClick={() => setCurrentView('programs')}
                >
                  Programs
                </button>
              </div>
            )}

            {currentView === 'dashboard' && (
              <>
                {user.role === 'trainer' ? (
                  <div className="trainer-dashboard">
                    <h3>Trainer Dashboard</h3>
                    <div className="dashboard-buttons">
                      <button onClick={() => setCurrentView('exercises')}>Browse Exercise Library</button>
                      <button onClick={() => setCurrentView('workouts')}>Manage Workouts</button>
                      <button onClick={() => setCurrentView('programs')}>Manage Programs</button>
                      <button>Manage Clients</button>
                      <button>View Client Progress</button>
                    </div>
                  </div>
                ) : (
                  <div className="client-dashboard">
                    <h3>Client Dashboard</h3>
                    <div className="dashboard-buttons">
                      <button onClick={() => setCurrentView('programs')}>View My Programs</button>
                      <button>Log Workout Results</button>
                      <button>Message Trainer</button>
                      <button>View Progress</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentView === 'exercises' && (
              <ExerciseLibrary user={user} />
            )}

            {currentView === 'workouts' && (
              <WorkoutList 
                user={user} 
                onCreateNew={navigateToCreateWorkout}
              />
            )}

            {currentView === 'programs' && (
              <ProgramList 
                user={user} 
                onCreateNew={navigateToCreateProgram}
              />
            )}

            {currentView === 'create-workout' && (
              <CreateWorkout 
                user={user}
                onBack={navigateBackToList}
              />
            )}

            {currentView === 'create-program' && (
              <CreateProgram 
                user={user}
                onBack={navigateBackToList}
              />
            )}
            
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <div className="auth-container">
            <div className="auth-tabs">
              <button 
                className={showLogin ? 'active' : ''} 
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>
              <button 
                className={!showLogin ? 'active' : ''} 
                onClick={() => setShowLogin(false)}
              >
                Register
              </button>
            </div>
            
            {showLogin ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Register onRegister={handleRegister} />
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
