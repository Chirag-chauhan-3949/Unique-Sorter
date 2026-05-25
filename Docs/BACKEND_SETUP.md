# Backend Setup Guide

## Architecture Overview

```
Frontend (React/Next.js)
    ↓ POST /api/inquiries
Backend (Next.js API Routes) ← Data stored here FIRST
    ↓ Background Sync
Firebase (Firestore)
```

All data flows through the backend first, then syncs to Firebase.

## Firebase Configuration

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Create a new project
   - Enable Firestore Database
   - Get your Firebase config

2. **Set Environment Variables:**

Create `.env.local` file in project root:

```env
# Firebase Config
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/login` | Login with phone + password + OTP |

### Inquiries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inquiries` | Get all inquiries |
| POST | `/api/inquiries` | Create new inquiry |
| PUT | `/api/inquiries` | Update inquiry |
| DELETE | `/api/inquiries?id=xxx` | Delete inquiry |

## Data Flow

### 1. Login Flow
```
1. User enters phone + password
2. POST /api/auth/send-otp
3. Backend validates credentials
4. Backend stores OTP in memory
5. OTP sent to user (console for dev)
6. User enters OTP
7. POST /api/auth/login
8. Backend validates OTP
9. Backend generates token
10. Backend syncs user to Firebase
11. User redirected to /inquiry
```

### 2. Inquiry Submission Flow
```
1. User fills inquiry form
2. POST /api/inquiries (using axios)
3. Backend stores inquiry in memory FIRST
4. Backend returns success
5. Backend syncs inquiry to Firebase (background)
6. User sees success message
```

## Default Test Users

Create users manually or via API:

```bash
# Admin User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "phone": "9876543210",
    "email": "admin@uniquesorter.com",
    "password": "admin123",
    "role": "admin"
  }'

# Regular User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9123456789",
    "email": "user@uniquesorter.com",
    "password": "user123",
    "role": "user"
  }'
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js         # Login endpoint
│   │   │   ├── register/route.js      # Register endpoint
│   │   │   └── send-otp/route.js      # Send OTP endpoint
│   │   └── inquiries/
│   │       └── route.js               # CRUD for inquiries
│   ├── inquiry/page.js                # Inquiry form
│   └── login/page.js                  # Login page
├── lib/
│   ├── db.js                          # In-memory database
│   ├── firebase.js                    # Firebase config
│   └── firebaseSync.js                # Sync to Firebase
└── scripts/
    └── seedUsers.js                   # Seed test users
```

## Security Notes

1. **In Production:**
   - Hash passwords using bcrypt
   - Use proper JWT library (jsonwebtoken)
   - Add rate limiting to prevent brute force
   - Validate all inputs
   - Use HTTPS only

2. **Firebase Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inquiries/{inquiryId} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
  }
}
```

## Running the App

```bash
# Install dependencies
npm install

# Set up Firebase (create .env.local)

# Run development server
npm run dev

# Open http://localhost:3000/login
```

## Testing the Flow

1. Go to http://localhost:3000/login
2. Enter phone: `9876543210`, password: `admin123`
3. Click "Send OTP"
4. Check console for OTP (in development)
5. Enter OTP and login
6. You'll be redirected to /inquiry
7. Fill and submit inquiry form
8. Check:
   - Backend console (data stored first)
   - Firebase console (data synced)
