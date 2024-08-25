# Kryptonite App
Kryptonite is a comprehensive user authentication and file upload service. The application allows users to register, log in, and upload image files using an API key. It also supports various user roles and OTP verification for secure login processes.

## Table of Contents
- Features
- Prerequisites
- Installation
- Configuration
- Usage
- API Endpoints
- Contributing
- License

 ## Features
- User Registration and Login
- OTP Verification
- Password Reset
- File Upload (Only image files allowed)
- API Key Management
 - User Roles (Guest, Supergirl)
- Secure storage of image files as Base64 strings
- Prerequisites
- Node.js
- MongoDB

## Installation
1. Clone the repository:
git clone https://github.com/solowiseCv/kryptoniteApp.git
cd kryptoniteApp

2. Install dependencies
npm install

3. Set up environment
cp .env.example .env
# Then, edit .env to add your MongoDB URI and other configurations

4. Start the development server:
npm start

## Configuration
Edit the .env file to configure your environment variables. For example:
MONGODB_URI=mongodb://localhost:27017/kryptonite
PORT=3000
SECRET_KEY=your_secret_key

# Usage
## Running the Application
To start the application, use:
npm start

# API Endpoints
## Authentication

- Register
POST /register
Body: `{ "username": "uche", "email": "ali@gmail.com", "password": "password12" }`

- Login
POST /login
Body: `{ "email": "example@example.com", "password": "password" }`

- OTP Verification
POST /otp-verification
Body: `{ "otp": "123456", "email": "example@example.com" }`

- Forgot Password
 POST /forgot_password
 Body: `{ "email": "example@example.com" }`

- Reset Password
PATCH /reset-password
Query: `email=example@example.com`
Body: `{ "newPassword": "newpassword" }`

- Resend OTP
POST /resend-otp
Body: `{ "email": "example@example.com" }`

- Generate API Key
POST /generate-api-key
Body: `{ "userId": "user_id" }`

- Invalidate API Key

PATCH /invalidate-api-key/:userId

## File Management

- Upload File
POST /upload-file

- Headers: API-Key: your_api_key
- Form Data: file (multipart/form-data)

- Get All Files for a User
GET /files/:userId/:fileId

- Get Specific File
GET /files/:userId/:fileId

# Directory Structure

# Kryptonite App

Kryptonite App is a comprehensive authentication and file upload service built with Node.js, Express, and MongoDB. It includes features like user registration, login, OTP verification, API key generation, and file upload functionality.

## Directory Structure

```plaintext
kryptonite-app/
├── config/
│   ├── db.js
│   ├── email.js
│   ├── env.js
│   └── nodemon.js
├── controllers/
│   ├── auth.controller.js
│   └── file.controller.js
├── models/
│   ├── user.model.js
│   └── file.model.js
├── services/
│   ├── auth.service.js
│   └── file.service.js
├── lib/
│   └── appError.js
├── middlewares/
│   └── errorHandler.js
├── validator/
│   ├── authValidator.js
│   └── index.js
├── utils/
│   ├── codeGenerator.js
│   └── multer.js
├── routes/
│   ├── index.js
│   ├── auth.route.js
│   └── file.route.js
├── .env.example
├── .gitignore
├── README.md
├── server.js


# Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License
This project is licensed under the Learnable Genesys License.