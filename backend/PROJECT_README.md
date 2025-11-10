# EZNAT Backend Documentation

**Version:** 1.2.0
**Last Updated:** 2025-11-09

## 1. Overview

Welcome to the EZNAT backend! This document serves as the primary guide for developers to understand, set up, and contribute to the project.

EZNAT is a skill-based social matching application. The backend provides a RESTful API for core application features and uses WebSockets for real-time communication, such as live chat between matched users.

### Project Purpose

The purpose of this project is to create a platform where users can connect with each other based on their skills and interests. Users can create a profile, add their skills, and then swipe through other users' profiles. When two users mutually swipe right on each other, they are matched and can then start a conversation. The application also includes a real-time notification system to keep users informed about new matches and messages.

### Core Technologies

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Real-time Communication:** Socket.IO
*   **Authentication:** JSON Web Tokens (JWT)
*   **Development Tooling:** Nodemon for live-reloading

---

## 2. Getting Started

Follow these steps to get the backend running on your local machine.

### 2.1. Prerequisites

*   **Node.js:** Version 18.x or higher.
*   **npm** or **yarn:** A Node.js package manager.
*   **MongoDB:** A running instance of MongoDB (local or a cloud service like MongoDB Atlas).

### 2.2. Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd eznat/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### 2.3. Configuration

The application uses environment variables for configuration. These variables are loaded from a `.env` file in the root of the backend directory.

1.  **Create a `.env` file** by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Update the `.env` file** with your local configuration:

    ```dotenv
    # .env

    # MongoDB Connection URI
    MONGO_URI=mongodb://127.0.0.1:27017/eznat

    # JWT Secret for signing authentication tokens
    JWT_SECRET=your-strong-jwt-secret-key

    # Port for the server to run on
    PORT=3000
    ```

### 2.4. Running the Application

*   **For Development:**
    This command uses `nodemon` to automatically restart the server on file changes.
    ```bash
    npm run dev
    ```

*   **For Production:**
    This command runs the server using `node`.
    ```bash
    npm start
    ```

After starting, the server will be running at `http://localhost:3000`.

---

## 3. Project Structure

The project follows a standard feature-based structure to keep the codebase organized and maintainable.

```
backend/
├── config/
│   └── db.js               # MongoDB connection logic
├── src/
│   ├── controller/        # Business logic for API endpoints
│   │   ├── chat.controller.js
│   │   ├── explore.controller.js
│   │   ├── match.controller.js
│   │   ├── notification.controller.js
│   │   ├── swipe.controller.js
│   │   └── user.controller.js
│   ├── models/             # Mongoose schemas and models
│   │   ├── match.model.js
│   │   ├── message.model.js
│   │   ├── notification.model.js
│   │   ├── swipe.model.js
│   │   └── user.model.js
│   ├── routes/             # Express route definitions
│   │   ├── chat.routes.js
│   │   ├── explore.routes.js
│   │   ├── match.routes.js
│   │   ├── notification.routes.js
│   │   ├── swipe.routes.js
│   │   └── user.routes.js
│   └── app.js              # Express app configuration (middleware, routes)
├── .env.example            # Example environment variables file
├── package.json
└── server.js               # Main entry point, server setup, Socket.IO integration
```

---

## 4. API Endpoints

The API is organized by resource. All endpoints are prefixed with `/api`.

### 4.1. Users (`/api/users`)

*   `POST /register`: Creates a new user account.
*   `POST /login`: Authenticates a user and returns a JWT.
*   `GET /users`: Retrieves a list of all users (for debugging/admin).

### 4.2. Swipes (`/api/swipes`)

*   `POST /`: Records a swipe action (left or right) from one user on another.
*   `GET /:userId`: Gets all swipes made by a specific user.
*   `DELETE /`: Undoes the last swipe action for a user.

### 4.3. Matches (`/api/matches`)

*   `GET /:userId`: Retrieves all matches for a specific user.

### 4.4. Explore (`/api/explore`)

*   `GET /:userId`: Gets a feed of potential users to match with, based on skill compatibility.

### 4.5. Chat (`/api/chat`)

*   `GET /history/:user1/:user2`: Retrieves the chat history between two users.

### 4.6. Notifications (`/api/notifications`)

*   `GET /:userId`: Retrieves all notifications for a specific user.
*   `POST /read`: Marks a notification as read.
---

## 5. Real-time Functionality (Socket.IO)

Socket.IO is used for real-time chat between matched users. The logic is handled in `server.js`.

### Connection Flow

1.  A client connects to the Socket.IO server.
2.  The client emits a `join` event with their `userId`.
3.  The server stores the `userId` and their `socket.id` in an `onlineUsers` map to track who is currently online.

### Core Events

*   **`join` (Client → Server):**
    *   **Payload:** `{ userId: string }`
    *   **Action:** Associates the user's ID with their socket connection, marking them as online.

*   **`sendMessage` (Client → Server):**
    *   **Payload:** `{ senderId, receiverId, message, matchId }`
    *   **Action:** Saves the message to the database. If the receiver is online, the server forwards the message to them via the `receiveMessage` event.

*   **`receiveMessage` (Server → Client):**
    *   **Payload:** The full message object from the database.
    *   **Action:** Sent to the receiving user so their UI can display the new message in real-time.

*   **`messageSent` (Server → Client):**
    *   **Payload:** The full message object from the database.
    *   **Action:** Sent back to the original sender as an acknowledgment that the message was processed.

*   **`disconnect` (Client → Server):**
    *   **Action:** When a user disconnects, their entry is removed from the `onlineUsers` map.

*   **`sendNotification` (Client → Server):**
    *   **Payload:** `{ userId, senderId, type, message, metadata }`
    *   **Action:** Creates a new notification in the database. If the recipient is online, the server forwards the notification to them via the `receiveNotification` event.

*   **`receiveNotification` (Server → Client):**
    *   **Payload:** The full notification object from the database.
    *   **Action:** Sent to the receiving user so their UI can display the new notification in real-time.

---

## 6. Data Models

*   **User:** Stores user profile information, credentials, location, skills, and photos.
*   **Swipe:** Records a directional swipe (`left` or `right`) from a `swiperId` to a `swipedUserId`. A unique index prevents duplicate swipes.
*   **Match:** Created when two users have mutually swiped right on each other. Contains references to both users (`user1`, `user2`).
*   **Message:** Stores a single chat message between a `sender` and a `receiver` within the context of a `matchId`.
*   **Notification:** Stores a notification for a user, including the sender, type, message, and any associated metadata.

### Database Schema

The database schema is designed to be simple and scalable. It consists of five collections: `users`, `swipes`, `matches`, `messages`, and `notifications`.

*   The `users` collection stores all user-related data, including their profile information, credentials, and skills.
*   The `swipes` collection stores all swipe data. Each document in this collection represents a single swipe and contains the ID of the user who swiped, the ID of the user who was swiped on, and the direction of the swipe.
*   The `matches` collection stores all match data. Each document in this collection represents a single match and contains the IDs of the two users who were matched.
*   The `messages` collection stores all message data. Each document in this collection represents a single message and contains the ID of the sender, the ID of the receiver, the message content, and the ID of the match that the message belongs to.
*   The `notifications` collection stores all notification data. Each document in this collection represents a single notification and contains the ID of the user who the notification is for, the ID of the sender, the type of notification, the message content, and any associated metadata.

### Authentication and Authorization

The application uses JSON Web Tokens (JWT) for authentication. When a user logs in, a JWT is generated and sent to the client. The client then includes this token in the `Authorization` header of all subsequent requests to protected endpoints.

The server validates the JWT on each request to a protected endpoint. If the token is valid, the server extracts the user ID from the token and uses it to identify the user.

Authorization is handled by checking the user's ID against the requested resource. For example, a user can only access their own swipes and matches.

### Error Handling

The application uses a centralized error handling mechanism. All errors are caught by a global error handler, which then sends a standardized error response to the client.

The error response is a JSON object with a `message` property that contains a description of the error. This makes it easy for the client to display a user-friendly error message.

### Real-time Communication

The application uses Socket.IO for real-time communication between the client and the server. Socket.IO is a JavaScript library that enables real-time, bidirectional and event-based communication.

The application uses Socket.IO for two main features: real-time chat and real-time notifications.

*   **Real-time chat:** When a user sends a message to another user, the message is sent to the server via a Socket.IO event. The server then forwards the message to the other user via another Socket.IO event. This allows for a real-time chat experience.
*   **Real-time notifications:** When a user receives a new match or a new message, a notification is sent to the user via a Socket.IO event. This allows the user to be notified in real-time about new activity.

### Future Improvements

The following are some of the planned future improvements for the project:

*   **Implement a more sophisticated matching algorithm:** The current matching algorithm is very basic and only takes into account the user's skills. A more sophisticated algorithm could take into account other factors, such as the user's location, interests, and availability.
*   **Add more real-time features, such as typing indicators:** The application could be improved by adding more real-time features, such as typing indicators, read receipts, and user presence.
*   **Implement a notification system:** The application could be improved by implementing a more robust notification system that allows users to customize their notification settings.
*   **Add more robust error handling and logging:** The application could be improved by adding more robust error handling and logging. This would make it easier to debug the application and to identify and fix bugs.
*   **Write unit and integration tests:** The application could be improved by writing unit and integration tests. This would help to ensure the quality of the code and to prevent regressions.

### Production Deployment

For deploying to production, please refer to the `production_guide.md` document. It contains critical instructions for:
*   Securing CORS policies.
*   Using environment variables securely.
*   Fixing known bugs before deployment.

### Contributors

This project is a solo effort by a single developer. However, contributions are welcome. *   If you would like to contribute to the project, please feel free to fork the repository and submit a pull request.

### License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
---

## 7. Error Handling

The API uses a consistent error handling approach. Errors are returned in a JSON format with a `message` property.

```json
{
    "message": "Error message here"
}
```

---

## 8. Future Improvements

*   **Implement a more sophisticated matching algorithm.**
*   **Add more real-time features, such as typing indicators.**
*   **Implement a notification system.**
*   **Add more robust error handling and logging.**
*   **Write unit and integration tests.**

---

## 9. Production Deployment

For deploying to production, please refer to the `production_guide.md` document. It contains critical instructions for:
*   Securing CORS policies.
*   Using environment variables securely.
*   Fixing known bugs before deployment.