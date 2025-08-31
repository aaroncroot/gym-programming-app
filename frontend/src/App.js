import React from 'react';
import axios from 'axios';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './components/Login';
import Register from './components/Register';
import ExerciseLibrary from './components/ExerciseLibrary';
import WorkoutList from './components/WorkoutList';
import ProgramList from './components/ProgramList';
import CreateWorkout from './components/CreateWorkout';
import CreateProgram from './components/CreateProgram';
import ApiTester from './components/ApiTester';
import ClientManagement from './components/ClientManagement';
import EmailVerification from './components/EmailVerification';
import ClientApproval from './components/trainer/ClientApproval';
import ProgramAssignment from './components/trainer/ProgramAssignment';
import ClientDashboard from './components/client/ClientDashboard';
import WorkoutExecution from './components/client/WorkoutExecution';
import TrainerAnalytics from './components/trainer/TrainerAnalytics';
import ClientAnalytics from './components/client/ClientAnalytics';
import Messaging from './components/Messaging';
import MobileOptimizedWorkout from './components/MobileOptimizedWorkout';
import PhotoGallery from './components/client/PhotoGallery';
import './App.css';

// Inner App component that uses context
function AppContent() {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    currentView, 
    isMobile, 
    message,
    login, 
    logout, 
    setCurrentView, 
    setMessage 
  } = useApp();

  // Add back the missing state for login/register tabs
  const [showLogin, setShowLogin] = React.useState(true);

  // Add back the missing useEffect for backend health check
  React.useEffect(() => {
    // Test backend connection
    fetch(`${process.env.REACT_APP_API_URL}/api/health`)
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, []); // Empty dependency array to run only once

  const handleLogin = (userData) => {
    login(userData);
  };

  const handleRegister = (userData) => {
    login(userData);
  };

  const handleLogout = () => {
    logout();
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
                {user.role === 'trainer' && (
                  <>
                    <button 
                      className={currentView === 'api-tester' ? 'active' : ''}
                      onClick={() => setCurrentView('api-tester')}
                    >
                      🔧 API Tester
                    </button>
                    <button 
                      className={currentView === 'client-management' ? 'active' : ''}
                      onClick={() => setCurrentView('client-management')}
                    >
                      👥 Manage Clients
                    </button>
                    <button 
                      className={currentView === 'client-approval' ? 'active' : ''}
                      onClick={() => setCurrentView('client-approval')}
                    >
                      👥 Client Approval
                    </button>
                    <button 
                      className={currentView === 'program-assignment' ? 'active' : ''}
                      onClick={() => setCurrentView('program-assignment')}
                    >
                      📋 Assign Programs
                    </button>
                    <button 
                      className={currentView === 'trainer-analytics' ? 'active' : ''}
                      onClick={() => setCurrentView('trainer-analytics')}
                    >
                      📊 Analytics
                    </button>
                    <button 
                      className={currentView === 'messaging' ? 'active' : ''}
                      onClick={() => setCurrentView('messaging')}
                    >
                      💬 Messages
                    </button>
                  </>
                )}
                {user.role === 'client' && (
                  <>
                    <button 
                      className={currentView === 'client-dashboard' ? 'active' : ''}
                      onClick={() => setCurrentView('client-dashboard')}
                    >
                      📊 My Dashboard
                    </button>
                    <button 
                      className={currentView === 'client-analytics' ? 'active' : ''}
                      onClick={() => setCurrentView('client-analytics')}
                    >
                      📈 My Progress
                    </button>
                    <button 
                      className={currentView === 'messaging' ? 'active' : ''}
                      onClick={() => setCurrentView('messaging')}
                    >
                      💬 Messages
                    </button>
                    <button 
                      onClick={() => setCurrentView('photo-gallery')}
                      className={currentView === 'photo-gallery' ? 'active' : ''}
                    >
                      📸 My Photo Gallery
                    </button>
                  </>
                )}
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
                      <button onClick={() => setCurrentView('client-management')}>Manage Clients</button>
                      <button onClick={() => setCurrentView('program-assignment')}>Assign Programs</button>
                      <button onClick={() => setCurrentView('client-approval')}>Client Approval</button>
                    </div>
                  </div>
                ) : (
                  <div className="client-dashboard">
                    <h3>Client Dashboard</h3>
                    <div className="dashboard-buttons">
                      <button onClick={() => setCurrentView('client-dashboard')}>View My Programs</button>
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
            
            {currentView === 'api-tester' && (
              <ApiTester />
            )}

            {currentView === 'client-management' && (
              <ClientManagement />
            )}

            {currentView === 'client-approval' && (
              <ClientApproval />
            )}

            {currentView === 'program-assignment' && (
              <ProgramAssignment user={user} />
            )}

            {currentView === 'client-dashboard' && (
              <ClientDashboard user={user} />
            )}

            {currentView === 'trainer-analytics' && (
              <TrainerAnalytics user={user} />
            )}

            {currentView === 'client-analytics' && (
              <ClientAnalytics user={user} />
            )}

            {currentView === 'messaging' && (
              <Messaging user={user} />
            )}

            {currentView === 'photo-gallery' && (
              <PhotoGallery user={user} />
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

// Wrap the main App component with AppProvider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
