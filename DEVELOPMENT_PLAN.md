# Athlo - Development Plan

## Project Overview
Athlo is a personal sports tracking application for running, strength training, and body measurements.

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React Native with Expo (Web + Mobile)
- **Data Storage**: JSON files (can migrate to database later)

---

## Backend Status: COMPLETE
Located in `src/athlo/`

### API Endpoints Available:

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

#### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile
- `PUT /users/me/password` - Change password
- `DELETE /users/me` - Delete account

#### Running Activities
- `GET /activities/running` - List activities (with date filters)
- `POST /activities/running` - Create activity
- `GET /activities/running/{id}` - Get specific activity
- `PUT /activities/running/{id}` - Update activity
- `DELETE /activities/running/{id}` - Delete activity

#### Strength Training
- `GET /strength/exercises` - List exercises (with muscle group filter)
- `GET /strength/muscle-groups` - List muscle groups
- `POST /strength/exercises` - Create custom exercise
- `DELETE /strength/exercises/{id}` - Delete custom exercise
- `GET /strength/divisions` - List workout divisions
- `GET /strength/divisions/{id}` - Get specific division
- `POST /strength/divisions` - Create division
- `PUT /strength/divisions/{id}` - Update division
- `DELETE /strength/divisions/{id}` - Delete division
- `GET /strength/activities` - List strength workouts
- `GET /strength/activities/{id}` - Get specific workout
- `POST /strength/activities` - Create workout
- `PUT /strength/activities/{id}` - Update workout
- `DELETE /strength/activities/{id}` - Delete workout
- `GET /strength/history/{exercise_name}` - Get exercise progression

#### Body Measurements
- `GET /body/measurements` - List measurements
- `GET /body/measurements/{id}` - Get specific measurement
- `POST /body/measurements` - Create measurement
- `PUT /body/measurements/{id}` - Update measurement
- `DELETE /body/measurements/{id}` - Delete measurement
- `GET /body/latest` - Get latest measurement
- `GET /body/weight-history` - Get weight history for charts

---

## Frontend Status: FEATURE-COMPLETE MVP
Located in `frontend/`

### Navigation Structure (5 tabs + header profile):
1. **Início** (🏠) - Dashboard with stats
2. **Atividades** (📋) - Combined activity list
3. **Corrida** (🏃) - Log running activities
4. **Força** (💪) - Workout divisions & logging
5. **Corpo** (⚖️) - Body measurements
6. **Perfil** (via header icon) - User profile & settings

### Completed Features:

#### Authentication
- ✅ User registration with validation
- ✅ Login with email/password
- ✅ Logout functionality
- ✅ Token refresh handling
- ✅ Detailed error messages

#### Running Activities
- ✅ Create running activity (distance, time, pace, effort, notes)
- ✅ Edit existing activity
- ✅ Delete activity
- ✅ View activity details
- ✅ Auto-generated titles based on distance/time
- ✅ Visual date/time pickers

#### Strength Training
- ✅ Create workout divisions (e.g., "Push", "Pull", "Legs")
- ✅ Add exercises to divisions with sets, reps, rest time
- ✅ Exercise bank with muscle group filtering
- ✅ Create custom exercises
- ✅ Record strength workouts from division templates
- ✅ Track weight progression per exercise
- ✅ View workout history
- ✅ Edit/delete workouts

#### Body Measurements
- ✅ Record weight
- ✅ Record body fat percentage
- ✅ Record body circumferences (chest, waist, arms, etc.)
- ✅ View measurement history
- ✅ Weight trend visualization

#### Statistics & Charts
- ✅ Statistics dashboard with period selector (7d, 30d, 1y, all)
- ✅ Running stats: distance over time, pace trends, weekly volume
- ✅ Strength stats: volume trends, muscle group distribution
- ✅ Exercise progression charts (weight over time)
- ✅ Weight trend chart
- ✅ Personal records display

#### Dashboard (Home Screen)
- ✅ Weekly stats summary
- ✅ Total stats (runs, workouts, distance)
- ✅ Recent activities (running + strength combined)
- ✅ Quick access to full statistics

### Screens:
```
src/screens/
├── auth/
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── main/
│   ├── HomeScreen.tsx
│   ├── ActivitiesScreen.tsx
│   ├── AddActivityScreen.tsx
│   ├── ActivityDetailScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── DivisionsScreen.tsx
│   ├── EditDivisionScreen.tsx
│   ├── RecordStrengthWorkoutScreen.tsx
│   ├── StrengthActivityDetailScreen.tsx
│   ├── EditStrengthWorkoutScreen.tsx
│   ├── BodyScreen.tsx
│   ├── StatsScreen.tsx
│   ├── RunningStatsScreen.tsx
│   └── StrengthStatsScreen.tsx
```

### Components:
```
src/components/
├── charts/
│   ├── StatCard.tsx
│   ├── PeriodSelector.tsx
│   ├── SimpleLineChart.tsx
│   └── SimpleBarChart.tsx
├── DatePicker.tsx
└── TimePicker.tsx
```

### Utilities:
```
src/utils/
└── statsCalculations.ts    # Stats calculation functions
```

---

## TODO - Future Enhancements:
- [ ] Cycling activities
- [ ] Swimming activities
- [ ] Export data (CSV/JSON)
- [ ] Dark/Light theme toggle
- [ ] Push notifications
- [ ] GPS tracking integration
- [ ] Goal setting and tracking
- [ ] Social features / sharing
- [ ] Progress photos

---

## Running the Project

### Backend:
```bash
cd athlo
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

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- JWT authentication
- JSON file storage

### Frontend
- React Native / Expo SDK 54
- TypeScript
- React Navigation (Bottom Tabs + Native Stack)
- Axios
- AsyncStorage
- react-native-gifted-charts
- expo-linear-gradient

---

## Project Structure
```
athlo/
├── src/athlo/              # Backend (FastAPI)
│   ├── api/
│   │   ├── routes/         # API routes
│   │   │   ├── auth.py
│   │   │   ├── activities.py
│   │   │   ├── strength.py
│   │   │   └── body.py
│   │   ├── deps.py         # Dependencies
│   │   └── main.py         # App entry
│   ├── models/             # Pydantic models
│   │   ├── activity.py
│   │   ├── strength.py
│   │   └── body.py
│   └── config.py           # Settings
├── frontend/               # Frontend (React Native/Expo)
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts
│   │   ├── navigation/     # Navigation setup
│   │   ├── screens/        # App screens
│   │   ├── services/       # API service
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── App.tsx
│   └── package.json
└── data/                   # JSON data storage
    └── users/              # Per-user data files
```

---

## Notes
- Backend has CORS enabled for frontend access
- Password minimum: 8 characters
- API URL auto-switches based on platform (web vs Android emulator)
- Node.js v18.16+ works (v20+ recommended)
- All dates stored in ISO format
- Measurements in metric units (km, kg, cm)
