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

Save the SQL below as `recruitment_system.sql` at the repository root (C:\Users\Aryan Mhatre\find-my-interview\recruitment_system.sql) and import it into your local MySQL.

Steps (PowerShell):
1. Save the file.
2. Import:
   mysql -u root -p < "C:\Users\Aryan Mhatre\find-my-interview\recruitment_system.sql"
   Or interactively:
   mysql -u root -p
   mysql> SOURCE C:/Users/Aryan Mhatre/find-my-interview/recruitment_system.sql;

Verify:
mysql -u root -p -e "USE recruitment_system; SHOW TABLES;"

-- recruitment_system.sql (DDL + minimal sample data) --
```sql
-- Drop & create
DROP DATABASE IF EXISTS recruitment_system;
CREATE DATABASE recruitment_system;
USE recruitment_system;

-- COMPANIES
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255)
);

-- DEPARTMENTS
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- EMPLOYEES
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    department_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('hr','interviewer') NOT NULL,
    auth_user_id INT UNIQUE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- POSITIONS
CREATE TABLE positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('open','closed','on_hold') DEFAULT 'open',
    job_description TEXT,
    no_of_positions INT DEFAULT 1,
    date_of_description DATE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- CANDIDATES
CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    position_id INT NOT NULL,
    company_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    applied_on DATE NOT NULL,
    status ENUM('applied','shortlisted','interview_scheduled','selected','rejected') DEFAULT 'applied',
    auth_user_id INT UNIQUE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ROUNDS
CREATE TABLE rounds (
    round_id INT AUTO_INCREMENT PRIMARY KEY,
    round_name VARCHAR(100) NOT NULL
);

-- INTERVIEWS
CREATE TABLE interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    position_id INT NOT NULL,
    interviewer_id_1 INT NOT NULL,
    interviewer_id_2 INT NULL,
    interviewer_id_3 INT NULL,
    round_id INT NOT NULL,
    interview_date DATETIME NOT NULL,
    status ENUM('scheduled','completed','canceled','pending') DEFAULT 'scheduled',
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id_1) REFERENCES employees(id),
    FOREIGN KEY (interviewer_id_2) REFERENCES employees(id),
    FOREIGN KEY (interviewer_id_3) REFERENCES employees(id),
    FOREIGN KEY (round_id) REFERENCES rounds(round_id)
);

-- AVAILABILITY_SLOTS
CREATE TABLE availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id INT NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (interviewer_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- INTERVIEW_REMINDERS
CREATE TABLE interview_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interview_id INT NOT NULL,
    reminder_type ENUM('email','sms','notification') NOT NULL,
    scheduled_time DATETIME NOT NULL,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

-- INTERVIEW_EVALUATIONS
CREATE TABLE interview_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interview_id INT NOT NULL,
    round_id INT NOT NULL,
    criteria_name VARCHAR(255) NOT NULL,
    score INT CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    FOREIGN KEY (round_id) REFERENCES rounds(round_id)
);

-- AUTH_USERS
CREATE TABLE auth_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('hr','interviewer','candidate') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SAMPLE DATA (minimal)
INSERT INTO companies (name, email, website) VALUES
('TechCorp', 'info@techcorp.com', 'www.techcorp.com'),
('InnoSoft', 'contact@innosoft.com', 'www.innosoft.com');

INSERT INTO departments (company_id, name) VALUES
(1, 'Engineering'), (1, 'Human Resources'), (2, 'Product Development');

INSERT INTO auth_users (email, password_hash, role) VALUES
('hr@techcorp.com', 'hashed_pw1', 'hr'),
('john.doe@techcorp.com', 'hashed_pw2', 'interviewer'),
('jane.smith@innosoft.com', 'hashed_pw3', 'candidate');

INSERT INTO employees (company_id, department_id, first_name, last_name, email, username, role, auth_user_id) VALUES
(1, 2, 'Alice', 'Brown', 'hr@techcorp.com', 'alice_hr', 'hr', 1),
(1, 1, 'John', 'Doe', 'john.doe@techcorp.com', 'jdoe_eng', 'interviewer', 2);

INSERT INTO positions (department_id, title, status, job_description, no_of_positions, date_of_description) VALUES
(1, 'Software Engineer', 'open', 'Backend developer role', 3, CURDATE());

INSERT INTO candidates (position_id, company_id, first_name, last_name, email, phone, applied_on, status, auth_user_id) VALUES
(1, 1, 'Jane', 'Smith', 'jane.smith@innosoft.com', '9876543210', CURDATE(), 'applied', 3);

INSERT INTO rounds (round_name) VALUES ('Technical Round'), ('HR Round');

INSERT INTO interviews (candidate_id, position_id, interviewer_id_1, round_id, interview_date, status, file_name, file_path) VALUES
(1, 1, 2, 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 'scheduled', 'resume.pdf', '/uploads/resume.pdf');
```
-- End of DDL --

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