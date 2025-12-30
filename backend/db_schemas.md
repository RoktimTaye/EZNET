# Database Schemas

This document outlines the database schemas for the Mongoose models used in this project.

## 1. User

The `User` model represents a user of the application.

-   `name`: `String` (Required)
-   `age`: `Number` (Required)
-   `email`: `String` (Required, Unique)
-   `password`: `String` (Required)
-   `location`: `Object` (GeoJSON Point)
    -   `type`: `String` (Enum: 'Point', Default: 'Point')
    -   `coordinates`: `[Number]` (Index: '2dsphere')
-   `profilePic`: `String`
-   `description`: `String`
-   `skillsOffered`: `String`
-   `skillsWanted`: `String`
-   `experience`: `Number` (Required)
-   `gender`: `String` (Required)
-   `education`: `Object`
    -   `school`: `String`
    -   `collage`: `String`
    -   `currentWorkingplace`: `String`
-   `photos`: `[String]`
-   `videos`: `[String]`
-   `accountType`: `String` (Enum: ["free", "premium"], Default: "free")
-   `rating`: `Number` (Default: 0)
-   `lastActive`: `Date` (Default: Date.now)
-   `createdAt`: `Date` (Default: Date.now)

## 2. Match

The `Match` model represents a successful match between two users.

-   `user1`: `ObjectId` (Ref: "User", Required)
-   `user2`: `ObjectId` (Ref: "User", Required)
-   `matchedAt`: `Date` (Default: Date.now)
-   `chatRoomId`: `String`
-   `timestamps`: `true`

## 3. Message

The `Message` model represents a single chat message between two users.

-   `sender`: `ObjectId` (Ref: "User", Required)
-   `receiver`: `ObjectId` (Ref: "User", Required)
-   `message`: `String` (Required)
-   `matchId`: `ObjectId` (Ref: "Match")
-   `timestamps`: `true`

## 4. Notification

The `Notification` model represents a notification for a user.

-   `user`: `ObjectId` (Ref: "User", Required)
-   `sender`: `ObjectId` (Ref: "User")
-   `type`: `String` (Enum: ["match", "message", "swipe_like", "system"], Required)
-   `message`: `String`
-   `isRead`: `Boolean` (Default: false)
-   `metadata`: `Object`
-   `timestamps`: `true`

## 5. Swipe

The `Swipe` model records a swipe action from one user to another.

-   `swiperId`: `ObjectId` (Ref: 'User', Required)
-   `swipedUserId`: `ObjectId` (Ref: 'User', Required)
-   `action`: `String` (Enum: ['left', 'right', 'undo', 'redo'], Required)
-   `timestamp`: `Date` (Default: 0)
-   `matchScore`: `Number` (Default: 0)
-   `timestamps`: `true`

## 6. Wallet

The `Wallet` model represents a user's wallet.

-   `user`: `ObjectId` (Ref: 'User', Unique, Required)
-   `balance`: `Number` (Default: 0)
-   `currency`: `String` (Default: 'INR')
-   `ledger`: `[ObjectId]` (Ref: 'Transaction')
-   `timestamps`: `true`

## 7. Transaction

The `Transaction` model records all financial transactions.

-   `type`: `String` (Enum: ['payment', 'refund', 'payout', 'fee'], Required)
-   `user`: `ObjectId` (Ref: 'User')
-   `razorpayPaymentId`: `String`
-   `razorpayOrderId`: `String`
-   `amount`: `Number` (Required)
-   `currency`: `String` (Default: 'INR')
-   `platformFee`: `Number` (Default: 0)
-   `status`: `String` (Enum: ['created', 'captured', 'failed', 'refunded', 'paid_out'], Default: 'created')
-   `meta`: `Object`
-   `timestamps`: `true`

## 8. Payout

The `Payout` model records payout requests from users.

-   `user`: `ObjectId` (Ref: 'User', Required)
-   `amount`: `Number` (Required)
-   `currency`: `String` (Default: 'INR')
-   `razorpayPayoutId`: `String`
-   `status`: `String` (Enum: ['created', 'processed', 'failed'], Default: 'created')
-   `meta`: `Object`
-   `timestamps`: `true`
