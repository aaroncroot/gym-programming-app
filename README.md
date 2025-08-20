# 🏋️ Gym Programming App

A comprehensive gym programming application with trainer-client management, workout tracking, and progress analytics.

## 🚀 Features

### For Trainers
- **Client Management**: Approve/reject client requests
- **Program Creation**: Template-based program design
- **Exercise Library**: Video-integrated exercise database
- **Analytics Dashboard**: Client progress tracking
- **Photo Management**: View client progress photos

### For Clients
- **Workout Execution**: Video-guided workout sessions
- **Progress Tracking**: Before/after photos and measurements
- **Goal Setting**: Personal fitness goals with reminders
- **Photo Gallery**: Progress photo management
- **Feedback System**: Workout session feedback

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** Authentication
- **Multer** for file uploads
- **Sharp** for image processing

### Frontend
- **React** with Hooks
- **Axios** for API calls
- **CSS3** with responsive design
- **Mobile-first** approach

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-app-fresh
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Backend (.env)
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_SERVICE=your_email_service_config
   PORT=5000

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Performance tests
npm run test:performance
```

### Coverage report
```bash
npm run test:coverage
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Programs
- `POST /api/programs` - Create program
- `GET /api/programs` - List programs
- `POST /api/programs/:id/assign` - Assign program to client

### Workouts
- `POST /api/workouts` - Create workout
- `POST /api/workouts/log` - Log completed workout
- `GET /api/workouts/progress/:exerciseId` - Get exercise progress

### Analytics
- `GET /api/analytics/trainer` - Trainer analytics
- `GET /api/analytics/client` - Client analytics

### Photos
- `POST /api/photos/upload` - Upload photo
- `GET /api/photos/user/:userId` - Get user photos

## 🔒 Security Features

- **JWT Authentication** with role-based access
- **Input Validation** and sanitization
- **Rate Limiting** for API endpoints
- **File Upload Security** with size and type validation
- **CORS Protection** for cross-origin requests

## 📱 Mobile Optimization

- **Responsive Design** for all screen sizes
- **Touch-Friendly Interface** with proper touch targets
- **Photo Upload** with camera and gallery access
- **Offline Capabilities** for workout tracking
- **Progressive Web App** features

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas cluster
2. Configure environment variables
3. Deploy to Heroku/Vercel/AWS

### Frontend Deployment
1. Build production version: `npm run build`
2. Deploy to Netlify/Vercel/GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@gymapp.com or create an issue in the repository.