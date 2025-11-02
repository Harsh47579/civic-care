# Localhost Setup Guide

This guide will help you run the Jharkhand Civic Issues application on your local machine.

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **MongoDB** (running locally on port 27017)
3. **npm** or **yarn**

## Quick Start

### Option 1: Using the startup scripts

**Windows Batch:**
```bash
start-localhost.bat
```

**PowerShell:**
```powershell
.\start-localhost.ps1
```

### Option 2: Manual setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```

## Application URLs

- **Frontend (React):** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## Environment Configuration

The application is now configured for localhost with the following settings:

### Client Configuration (`client/.env`)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GENERATE_SOURCEMAP=false
```

### Server Configuration (`server/.env`)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jharkhand-civic
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here
```

## Important Notes

1. **MongoDB**: Make sure MongoDB is running locally on port 27017
2. **Google Maps**: Replace `your_google_maps_api_key_here` with your actual Google Maps API key
3. **JWT Secret**: Replace `your_jwt_secret_key_here` with a strong secret key for production

## Development Commands

- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start only the React client
- `npm run server` - Start only the Express server
- `npm run install-all` - Install dependencies for all packages

## Troubleshooting

1. **Port conflicts**: If ports 3000 or 5000 are in use, modify the PORT variables in the .env files
2. **MongoDB connection**: Ensure MongoDB is running and accessible on localhost:27017
3. **CORS issues**: The server is configured to accept requests from http://localhost:3000

## Features Available on Localhost

- User registration and authentication
- Issue reporting and management
- Real-time notifications via Socket.IO
- Admin dashboard
- Chat functionality
- File uploads
- API endpoints for all features

The application is now fully configured to run on localhost!

