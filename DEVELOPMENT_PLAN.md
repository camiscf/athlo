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

## Frontend Status: FUNCTIONAL MVP
Located in `frontend/`

### Completed:
1. ✅ Expo project with TypeScript
2. ✅ Dependencies (navigation, axios, async-storage)
3. ✅ Project structure:
   - `src/types/index.ts` - TypeScript types
   - `src/services/api.ts` - API service with auth token handling
   - `src/context/AuthContext.tsx` - Authentication context
4. ✅ Navigation:
   - `src/navigation/AuthNavigator.tsx` - Auth Stack
   - `src/navigation/MainNavigator.tsx` - Tab + Stack Navigator
   - `src/navigation/RootNavigator.tsx` - Root with auth state switch
5. ✅ Authentication Screens:
   - `src/screens/auth/LoginScreen.tsx` - Login with email/password
   - `src/screens/auth/RegisterScreen.tsx` - User registration
6. ✅ Main App Screens:
   - `src/screens/main/HomeScreen.tsx` - Dashboard with stats
   - `src/screens/main/ActivitiesScreen.tsx` - List of activities
   - `src/screens/main/AddActivityScreen.tsx` - Form to log activity
   - `src/screens/main/ProfileScreen.tsx` - User profile with logout
   - `src/screens/main/ActivityDetailScreen.tsx` - Activity details with delete

### Features Working:
- ✅ User registration and login
- ✅ Logout functionality
- ✅ Create running activity (distance, time, effort, notes)
- ✅ List all activities
- ✅ View activity details
- ✅ Delete activity
- ✅ Dashboard with weekly and total stats
- ✅ Responsive design for web/mobile

### TODO - Future Enhancements:
- [ ] Edit existing activity
- [ ] Date picker for activity date
- [ ] Cycling activities
- [ ] Swimming activities
- [ ] Strength training activities
- [ ] Activity statistics/charts
- [ ] Export data functionality
- [ ] Dark/Light theme toggle
- [ ] Push notifications
- [ ] GPS tracking integration

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
npx expo start --web --clear
```

### API Docs:
http://localhost:8000/docs

---

## Notes
- Backend has CORS enabled for frontend access
- Password minimum: 8 characters
- API URL auto-switches based on platform (web vs Android emulator)
- Node.js v20+ recommended (current setup works with v18.16+ with polyfills)

---

## Project Structure
```
athlo/
├── src/athlo/           # Backend (FastAPI)
│   ├── api/             # Routes and schemas
│   ├── models/          # Data models
│   ├── repositories/    # Data persistence
│   └── services/        # Business logic
├── frontend/            # Frontend (React Native/Expo)
│   ├── src/
│   │   ├── context/     # React contexts
│   │   ├── navigation/  # Navigation setup
│   │   ├── screens/     # App screens
│   │   ├── services/    # API service
│   │   └── types/       # TypeScript types
│   ├── App.tsx          # App entry point
│   └── package.json
└── data/                # JSON data storage
```
