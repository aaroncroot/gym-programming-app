# 🏋️ Gym Programming App

A comprehensive gym programming application built with React frontend, Node.js/Express backend, and MongoDB Atlas. The app serves trainers and clients with exercise management, workout creation, and program assignment capabilities.

## ✨ Features

### ✅ Completed Features

#### 🔐 Authentication System
- JWT-based authentication with trainer/client roles
- User registration and login functionality
- Protected routes and middleware
- Role-based access control

#### 📚 Exercise Library
- Complete exercise creation and management system
- Exercise categories and muscle group filtering
- Search functionality
- YouTube video URL integration with embedded players
- Video management system for trainers
- Dark mode UI with two-column layout

#### 🏋️ Workout Management System
- Individual workout creation (e.g., "Leg Day", "Push Day")
- Workout templates that can be reused across programs
- Exercise assignment with sets, reps, weight, rest time, and notes
- Workout listing and management interface
- Page-based workout creation (not modal)

#### 📊 Program Management System
- **Week-based program creation** with 1-52 weeks duration
- **Flexible scheduling** with 1-14 workouts per week
- **Inline workout creation** - create workouts directly in programs
- **Copy/paste functionality** for easy week duplication
- **Save workout feature** - save inline workouts to library while keeping them editable
- **Tabbed interface** for intuitive week navigation
- **Independent editing** of duplicated workouts
- Program assignment to clients
- Template programs for reuse

#### 🛠️ Backend Infrastructure
- Complete REST API with authentication middleware
- MongoDB Atlas integration
- User, Exercise, Workout, and Program models
- File upload system ready for private videos
- Client management endpoints

## ️ Architecture

### Frontend Structure
