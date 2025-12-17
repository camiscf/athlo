# Athlo - Development Plan

## Project Overview
Athlo is a personal sports tracking application for running, cycling, swimming, and strength training.

## Architecture
- **Backend**: FastAPI (Python) - Already built
- **Frontend**: React Native with Expo (Mobile app)
- **Data Storage**: JSON files (can migrate to database later)

---

## Backend Status: COMPLETE
Located in `src/athlo/`

### API Endpoints Available:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile
- `PUT /users/me/password` - Change password
- `DELETE /users/me` - Delete account
- `GET /activities/running` - List running activities (with date filters)
- `POST /activities/running` - Create running activity
- `GET /activities/running/{id}` - Get specific activity
- `PUT /activities/running/{id}` - Update activity
- `DELETE /activities/running/{id}` - Delete activity

---

## Frontend Status: IN PROGRESS
Located in `frontend/`

### Completed:
1. Expo project created with TypeScript
2. Dependencies installed:
   - @react-navigation/native, native-stack, bottom-tabs
   - react-native-screens, react-native-safe-area-context
   - axios, @react-native-async-storage/async-storage
3. Project structure created:
   - `src/types/index.ts` - TypeScript types for User, Activity, Auth
   - `src/services/api.ts` - API service with auth token handling
   - `src/context/AuthContext.tsx` - Authentication context provider

### TODO - Frontend Screens:
1. **Authentication Screens**
   - [ ] LoginScreen - Email/password login
   - [ ] RegisterScreen - New user registration

2. **Main App Screens (Tab Navigation)**
   - [ ] HomeScreen - Dashboard with recent activities summary
   - [ ] ActivitiesScreen - List of all running activities
   - [ ] AddActivityScreen - Form to log new running activity
   - [ ] ProfileScreen - User profile and settings

3. **Activity Detail Screens**
   - [ ] ActivityDetailScreen - View single activity details
   - [ ] EditActivityScreen - Edit existing activity

### TODO - Navigation Setup:
- [ ] Auth Stack (Login, Register)
- [ ] Main Tab Navigator (Home, Activities, Add, Profile)
- [ ] Root navigator that switches based on auth state

### TODO - Components:
- [ ] ActivityCard - Display activity in list
- [ ] StatCard - Display stats on dashboard
- [ ] Input components with validation
- [ ] Loading spinner overlay

### TODO - Features to Add Later:
- [ ] Cycling activities
- [ ] Swimming activities
- [ ] Strength training activities
- [ ] Activity statistics/charts
- [ ] Export data functionality
- [ ] Dark/Light theme toggle

---

## Running the Project

### Backend:
```bash
cd src/athlo
uvicorn athlo.api.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm start
# Then press 'a' for Android or 'i' for iOS
```

### API Docs:
http://localhost:8000/docs

---

## Notes
- Node.js version warning: Current v18.16.1, recommended v20+
- npm registry was changed to official: https://registry.npmjs.org/
- For Android emulator, API URL should be: http://10.0.2.2:8000
- For iOS simulator: http://localhost:8000
- For physical device: Use your computer's local IP address
