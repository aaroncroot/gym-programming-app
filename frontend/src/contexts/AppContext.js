import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  currentView: 'dashboard',
  isMobile: false,
  message: '',
  error: null
};

// Action types
const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_MOBILE: 'SET_MOBILE',
  SET_MESSAGE: 'SET_MESSAGE',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ACTIONS.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
    case ACTIONS.SET_MOBILE:
      return {
        ...state,
        isMobile: action.payload
      };
    case ACTIONS.SET_MESSAGE:
      return {
        ...state,
        message: action.payload
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check for existing user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: ACTIONS.SET_USER, payload: user });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }

    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      dispatch({ type: ACTIONS.SET_MOBILE, payload: isMobileDevice || isSmallScreen });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Actions
  const actions = {
    login: (userData) => {
      dispatch({ type: ACTIONS.SET_USER, payload: userData });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: ACTIONS.LOGOUT });
    },
    setCurrentView: (view) => {
      dispatch({ type: ACTIONS.SET_CURRENT_VIEW, payload: view });
    },
    setMessage: (message) => {
      dispatch({ type: ACTIONS.SET_MESSAGE, payload: message });
    },
    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    }
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;