# Interview Manager - Full Stack Setup Guide

## 🚀 Complete Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- MySQL 5.7+ or MariaDB 10.3+
- Git (optional)

### 📁 Project Structure
```
interview-manager/
├── server.js              # Backend server
├── package.json           # Node.js dependencies
├── .env                   # Environment variables
├── public/
│   └── index.html         # Frontend application
├── database/
│   └── schema.sql         # Database schema
└── README.md              # This file
```

## 🗄️ Database Setup

### 1. Create Database
```sql
-- Run this in your MySQL client
CREATE DATABASE interview_manager;
```

### 2. Run Database Schema
Copy the entire SQL schema from the database artifact and run it in your MySQL client or command line:

```bash
mysql -u root -p interview_manager < database/schema.sql
```

### 3. Verify Tables
```sql
USE interview_manager;
SHOW TABLES;
-- Should show: companies, departments, positions, candidates, interviews, etc.
```

## ⚙️ Backend Setup

### 1. Initialize Project
```bash
mkdir interview-manager
cd interview-manager
npm init -y
```

### 2. Install Dependencies
```bash
npm install express mysql2 cors dotenv
npm install --save-dev nodemon
```

### 3. Create Environment File
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=interview_manager
PORT=3000
NODE_ENV=development
```

### 4. Create Directory Structure
```bash
mkdir public
mkdir database
```

### 5. Add Files
- Copy `server.js` to the root directory
- Copy the HTML content to `public/index.html`
- Copy the SQL schema to `database/schema.sql`

### 6. Update package.json Scripts
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## 🎯 Running the Application

### 1. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

### 2. Access the Application
Open your browser and navigate to: `http://localhost:3000`

## 🔧 API Endpoints

### Interviews
- `GET /api/interviews` - Get all interviews (with search/filter)
- `GET /api/interviews/:id` - Get specific interview
- `POST /api/interviews` - Create new interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `PATCH /api/interviews/:id/status` - Update interview status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/upcoming` - Get upcoming interviews

### Utility
- `GET /api/health` - Health check
- `GET /api/interviewers` - Get all interviewers
- `GET /api/positions` - Get all positions

## 🎨 Features

### ✅ Frontend Features
- **Modern UI**: Gradient backgrounds, smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Data syncs with database
- **Search & Filter**: Find interviews quickly
- **Form Validation**: Client-side and server-side validation
- **Loading States**: Visual feedback for all operations
- **Error Handling**: User-friendly error messages

### ✅ Backend Features
- **RESTful API**: Clean, consistent API design
- **Database Integration**: Full MySQL integration
- **Transaction Support**: Ensures data consistency
- **Error Handling**: Comprehensive error management
- **Data Validation**: Input validation and sanitization
- **CORS Support**: Frontend-backend communication

### ✅ Database Features
- **Normalized Schema**: Efficient data storage
- **Foreign Keys**: Data integrity constraints
- **Indexes**: Optimized query performance
- **Views**: Simplified complex queries
- **Stored Procedures**: Business logic in database
- **Triggers**: Automatic status updates

## 🔒 Security Considerations

### Current Implementation
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- Error message sanitization

### Recommended Enhancements
```javascript
// Add these for production use:
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(helmet());
app.use(limiter);
```

## 📊 Sample Data

The database comes pre-populated with sample data:
- 2 Companies (TechCorp Solutions, Digital Dynamics)
- 5 Departments
- 4 Job Positions
- 4 Interviewers
- 4 Candidates
- 5 Sample Interviews

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3306
   ```
   - Check MySQL is running: `sudo service mysql start`
   - Verify credentials in `.env` file
   - Test connection: `mysql -u root -p`

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   - Change PORT in `.env` file
   - Or kill process: `lsof -ti:3000 | xargs kill -9`

3. **Module Not Found**
   ```
   Error: Cannot find module 'express'
   ```
   - Run: `npm install`
   - Check `package.json` exists

4. **CORS Issues**
   - Ensure CORS is enabled in server.js
   - Check browser console for specific errors

### Database Issues

1. **Tables Don't Exist**
   - Re-run database schema
   - Check database name in `.env`

2. **Foreign Key Constraints**
   - Ensure sample data is inserted in correct order
   - Check MySQL foreign key settings

## 🚀 Deployment Options

### 1. Local Development
- Use `npm run dev` for development
- Use `npm start` for production testing

### 2. VPS/Cloud Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start server.js --name "interview-manager"

# Setup nginx reverse proxy (optional)
```

### 3. Docker Deployment
```dockerfile
# Dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Future Enhancements

### Planned Features
- [ ] User authentication & authorization
- [ ] Email notifications for interviews
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] File upload for resumes/documents
- [ ] Advanced reporting & analytics
- [ ] Interview feedback forms
- [ ] Multi-company support
- [ ] API rate limiting
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app (React Native)

### Database Enhancements
- [ ] Audit trails for all changes
- [ ] Soft delete functionality
- [ ] Advanced search with full-text indexing
- [ ] Interview recording metadata
- [ ] Candidate skill tracking
- [ ] Interview templates

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Check browser console for frontend errors
4. Verify database connections and permissions

## 🎉 You're Ready!

Your Interview Manager is now fully set up with:
- ✅ Database with sample data
- ✅ Backend API server
- ✅ Modern frontend interface
- ✅ Full CRUD operations
- ✅ Search and filtering
- ✅ Dashboard analytics

Start scheduling interviews and streamline your recruitment process!