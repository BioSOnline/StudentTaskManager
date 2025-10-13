# MongoDB Setup Guide

## Option 1: Local MongoDB (Recommended for Development)

### Windows Installation:
1. Go to https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server for Windows
3. Run the .msi installer
4. Choose "Complete" installation
5. Install as a Service (recommended)
6. Install MongoDB Compass (GUI tool)

### Start MongoDB:
- MongoDB should start automatically as a service
- Or run: `net start MongoDB` in admin command prompt
- Default connection: `mongodb://localhost:27017`

## Option 2: MongoDB Atlas (Cloud Database)

### Setup Steps:
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user
5. Add your IP address to network access
6. Get connection string from "Connect" button
7. Update `backend/.env` with your connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-task-manager
```

## Database Schema

The application will automatically create these collections:
- `users` - User accounts and authentication
- `tasks` - Student tasks and assignments

## Connection Status

The application will show connection status in the console:
- ✅ "MongoDB Connected: [host]" - Success
- ❌ "Error connecting to MongoDB" - Check your connection

## Troubleshooting

**Common Issues:**
1. **Connection refused** - MongoDB service not running
2. **Authentication failed** - Check username/password in Atlas
3. **Network timeout** - Check firewall/network access in Atlas
4. **Database not found** - Will be created automatically on first use