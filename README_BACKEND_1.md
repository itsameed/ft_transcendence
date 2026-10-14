# ft_Transcendance Backend

This is the backend service for the ft_Transcendance project. It provides the application server, authentication flow, session management, MongoDB models, and the routes used by the web app.

## Overview

The backend is built with:
- Node.js
- Express
- MongoDB + Mongoose
- EJS for server-rendered views
- Cookie/session-based authentication
- dotenv for environment configuration

## Project structure

```text
backend/
├── src/
│   ├── main.js
│   ├── controllers/
│   ├── models/
│   │   └── Schemas/
│   ├── routes/
│   │   ├── get_routes/
│   │   └── post_routes/
│   └── views/
├── package.json
├── README.MD
└── .env
```

## Prerequisites

Before running the app, make sure you have:
- Node.js installed
- MongoDB running locally or a reachable MongoDB instance
- npm installed

## Environment variables

Create a `.env` file in the `backend` directory with the following values:

```env
SESSION_SECRET=your_session_secret
MONGO_URL=mongodb://127.0.0.1:27017/ft_transcendence
PORT=3000
```

Notes:
- `SESSION_SECRET` is used for Express session security.
- `MONGO_URL` should point to your Mongo database.
- `PORT` is the port the backend listens on.

## Installation

From the backend directory:

```bash
npm install
```

## Running the server

Development mode:

```bash
npm run devStart
```

Or directly:

```bash
node src/main.js
```

The server will start at:

```text
http://localhost:3000
```

## Main routes

### Authentication
- `GET /login` → renders the login page
- `POST /login` → authenticates the user
- `GET /signup` → renders the signup page
- `POST /signup` → creates a new user

### Dashboard and app pages
- `GET /dashboard` → home/dashboard page
- `GET /MyGroups` → list of user groups
- `GET /Friends` → friends page
- `GET /notifications` → notifications page
- `GET /CreateGroup` → group creation page
- `POST /CreateGroup` → creates a new group

### Expenses and settlements
- `POST /createExpense` → creates a new expense
- `GET /getExpenses` → retrieves expenses
- `POST /createSettlement` → creates a settlement record

### Additional GET routes
- `GET /auth/login` → renders the login page
- `GET /Friends/requests` → retrieves incoming friend requests
- `GET /GroupDetails` → calculates the current user's expense details for a group
- `GET /MyGroups/GroupTotalExpenses` → returns balances between the current user and other group members

## Session behavior

The app uses Express sessions and stores session data in MongoDB via `connect-mongo`. Authenticated routes are protected by the middleware in `src/controllers/middleware.js`.

## Notes

This project is still under active development, and some routes or logic may still evolve as the application is refined.

## Troubleshooting

If the backend does not start:
1. Verify MongoDB is running.
2. Check that the `.env` file exists and contains valid values.
3. Ensure dependencies were installed correctly with `npm install`.
4. Confirm the port is not already in use.

## License

ISC

# Backend end points ////////////////////////////////////////////////////////////////////////////////

# Backend API Documentation

## Base URL


---

## Authentication

### Signup

the request will arrive as this : 
GET /auth/signup

---

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}

the request will arrive like this :
POST /auth/login

{
  "email": "string",
  "password": "string"
}

when the user enters invalid credentials the backend will send a proper error message with send function

GET /auth/logout

Response: Clears session, redirect to /login



GET /

Response: Renders Dashboard.ejs

data sent to the Dashboard along with the front page :
{
  "formattedGroups": [
    {
      "groupName": String,
      "groupMembersCount": Number,
      "userOwes": Number,
      "OwedToUser": NUmber,
      "NetBalance": NUmber
    },
    {
      "groupName": String,
      "groupMembersCount": Number,
      "userOwes": Number,
      "OwedToUser": Number,
      "NetBalance": Number
    }
  ]
}

GET /MyGroups

the backend sends these infos along with the front page

{
  "groupData": [
    {
      "groupName": String,
      "members": Number,
      "description": String
    },
    {
      "groupName": String,
      "members": Number,
      "description": String
    }
  ]
}


in MyGroups when the user clicks on na certain group the request comes like this :  
GET MyGroups/:id

the infos sent to the front along with the front page are : 


{
  "GroupInfos": {
    "groupName": String,
    "members": [
      {
        "owesYou": String, // in case the current user owed by someone
        "balance": 50
      },
      {
        "youOwes": String, // in case the current user owes someone 
        "balance": -200
      }
    ]
  }
}


when the current user wants to get his Profile
GET /MyProfile

this is the response from the backend 
{
  "username": String,
  "email": String,
  "joinedAt": String,
  "TotalExpenses": Number,
  "FriendsCount": Number,
  "numberOfGroups": Number,
  "numberOfExpenses": Number
}




