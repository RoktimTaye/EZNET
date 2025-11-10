# Production Deployment Guide

This guide provides instructions for deploying the EZNAT backend to a production environment.

## 1. Prerequisites

*   **Node.js:** Version 18.x or higher.
*   **npm** or **yarn:** A Node.js package manager.
*   **MongoDB:** A running instance of MongoDB (local or a cloud service like MongoDB Atlas).
*   **A server:** A server to deploy the application on (e.g., AWS, Google Cloud, Heroku).

## 2. Configuration

The application uses environment variables for configuration. These variables are loaded from a `.env` file in the root of the backend directory.

Create a `.env` file on your server and add the following environment variables:

```dotenv
# .env

# MongoDB Connection URI
MONGO_URI=<your-mongodb-connection-uri>

# JWT Secret for signing authentication tokens
JWT_SECRET=<your-strong-jwt-secret-key>

# Port for the server to run on
PORT=3000
```

**Note:** It is important to use a strong and unique JWT secret in a production environment.

## 3. Running the Application

To run the application in a production environment, use the following command:

```bash
npm start
```

This command will start the server using `node`.

## 4. Securing CORS Policies

In a production environment, it is important to restrict the domains that are allowed to access the API. This can be done by configuring the `cors` middleware in `src/app.js`.

```javascript
// src/app.js

const cors = require('cors');

// ...

const allowedOrigins = ['https://your-frontend-domain.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

## 5. Fixing Known Bugs

Before deploying to production, it is important to fix any known bugs. You can find a list of known bugs in the "Future Improvements" section of the `PROJECT_README.md` file.