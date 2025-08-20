/**
 * Gym Programming App API Documentation
 * 
 * Base URL: http://localhost:5000/api
 * Authentication: Bearer Token (JWT)
 */

const apiDocs = {
  authentication: {
    register: {
      method: 'POST',
      endpoint: '/auth/register',
      description: 'Register a new user (client or trainer)',
      body: {
        firstName: 'string (required)',
        lastName: 'string (required)',
        email: 'string (required, unique)',
        password: 'string (required, min 6 chars)',
        role: 'string (required: "client" or "trainer")',
        country: 'string (required)',
        city: 'string (required)'
      },
      response: {
        success: 'boolean',
        data: {
          user: 'User object',
          token: 'JWT token'
        }
      }
    },
    login: {
      method: 'POST',
      endpoint: '/auth/login',
      description: 'Login with email and password',
      body: {
        email: 'string (required)',
        password: 'string (required)'
      },
      response: {
        success: 'boolean',
        data: {
          user: 'User object',
          token: 'JWT token'
        }
      }
    },
    verifyEmail: {
      method: 'POST',
      endpoint: '/auth/verify-email',
      description: 'Verify email with token',
      body: {
        token: 'string (required)'
      },
      response: {
        success: 'boolean',
        message: 'string'
      }
    }
  },

  programs: {
    create: {
      method: 'POST',
      endpoint: '/programs',
      description: 'Create a new program (trainer only)',
      headers: {
        Authorization: 'Bearer <token>'
      },
      body: {
        name: 'string (required)',
        description: 'string',
        client: 'string (client ID)',
        workoutsPerWeek: 'number',
        duration: 'number (weeks)',
        weeks: 'array of workout objects',
        isTemplate: 'boolean'
      }
    },
    assign: {
      method: 'POST',
      endpoint: '/programs/:id/assign',
      description: 'Assign program to client (trainer only)',
      headers: {
        Authorization: 'Bearer <token>'
      },
      body: {
        clientId: 'string (required)'
      }
    }
  },

  workouts: {
    create: {
      method: 'POST',
      endpoint: '/workouts',
      description: 'Create a new workout (trainer only)',
      headers: {
        Authorization: 'Bearer <token>'
      },
      body: {
        name: 'string (required)',
        description: 'string',
        exercises: 'array of exercise objects'
      }
    },
    log: {
      method: 'POST',
      endpoint: '/workouts/log',
      description: 'Log completed workout (client only)',
      headers: {
        Authorization: 'Bearer <token>'
      },
      body: {
        workoutId: 'string (required)',
        exercises: 'array of completed exercises',
        duration: 'number (minutes)',
        rating: 'number (1-5)',
        notes: 'string'
      }
    }
  },

  analytics: {
    trainer: {
      method: 'GET',
      endpoint: '/analytics/trainer',
      description: 'Get trainer analytics overview',
      headers: {
        Authorization: 'Bearer <token>'
      },
      query: {
        days: 'number (default: 30)'
      }
    },
    client: {
      method: 'GET',
      endpoint: '/analytics/client',
      description: 'Get client analytics',
      headers: {
        Authorization: 'Bearer <token>'
      }
    }
  },

  photos: {
    upload: {
      method: 'POST',
      endpoint: '/photos/upload',
      description: 'Upload photo (client only)',
      headers: {
        Authorization: 'Bearer <token>',
        'Content-Type': 'multipart/form-data'
      },
      body: {
        photo: 'file (required)',
        photoType: 'string (required)',
        category: 'string (required)',
        workoutId: 'string',
        workoutTitle: 'string',
        description: 'string',
        tags: 'string (comma-separated)'
      }
    },
    getUserPhotos: {
      method: 'GET',
      endpoint: '/photos/user/:userId',
      description: 'Get user photos',
      headers: {
        Authorization: 'Bearer <token>'
      },
      query: {
        photoType: 'string',
        category: 'string',
        page: 'number',
        limit: 'number'
      }
    }
  }
};

module.exports = apiDocs; 