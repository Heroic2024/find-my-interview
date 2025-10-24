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

## Setup (local, MySQL Workbench or CLI)

Prerequisites:
- MySQL Server 8.0+ installed
- MySQL Workbench or mysql CLI available

1. Save the provided SQL to a file, e.g. `recruitment_system.sql`.
   - NOTE: the SQL in this repo had a small typo in the DROP line. Ensure the first lines read:
     ```
     DROP DATABASE IF EXISTS recruitment_system;
     CREATE DATABASE recruitment_system;
     USE recruitment_system;
     ```
2. Import using MySQL Workbench:
   - Open MySQL Workbench and connect to your local server.
   - File → Open SQL Script → select `recruitment_system.sql`.
   - Press the lightning bolt (Execute) to run the script.
3. Or import using the CLI (Windows):
   - Open Command Prompt and run:
     ```
     mysql -u root -p < "your-path\recruitment_system.sql"
     ```
   - Or run interactively:
     ```
     mysql -u root -p
     mysql> SOURCE your-path/recruitment_system.sql;
     ```
4. Verify import:
   - In Workbench or CLI: `USE recruitment_system; SHOW TABLES; SELECT COUNT(*) FROM companies;`

Optional: create a dedicated DB user for the app
```
CREATE USER 'findmy'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON recruitment_system.* TO 'findmy'@'localhost';
FLUSH PRIVILEGES;
```

## Troubleshooting / notes

- MySQL version: use MySQL 8+ to ensure CHECK constraints and default behaviors work as intended.
- Engine: InnoDB is required for foreign keys (MySQL default engine is InnoDB on modern installs).
- If import fails due to foreign key ordering, run the full script as provided (it creates tables in order and inserts sample data after).
- If you prefer a fresh start when re-running the script, ensure the DROP DATABASE line is correct as shown above.

## Next steps for the app

- Configure your application DB connection (host, port, database, user, password).
- Run app migrations (if the app uses an ORM) or rely on the provided SQL schema.
- Adjust sample data and add seed data as needed for development.

## Initial SQL schema (save as `recruitment_system.sql`)

Use the SQL below to create the database and schema locally. Fixed the DROP DATABASE typo.

-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: recruitment_system
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_users`
--

DROP TABLE IF EXISTS `auth_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('hr','interviewer','candidate') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_users`
--

LOCK TABLES `auth_users` WRITE;
/*!40000 ALTER TABLE `auth_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `availability_slots`
--

DROP TABLE IF EXISTS `availability_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availability_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interviewer_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`id`),
  KEY `interviewer_id` (`interviewer_id`),
  CONSTRAINT `availability_slots_ibfk_1` FOREIGN KEY (`interviewer_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availability_slots`
--

LOCK TABLES `availability_slots` WRITE;
/*!40000 ALTER TABLE `availability_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `availability_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `skills` text,
  `location` varchar(255) DEFAULT NULL,
  `resume_file_name` varchar(255) DEFAULT NULL,
  `resume_file_path` varchar(500) DEFAULT NULL,
  `notes` text,
  `password` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `candidates_chk_1` CHECK ((`experience_years` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates`
--

LOCK TABLES `candidates` WRITE;
/*!40000 ALTER TABLE `candidates` DISABLE KEYS */;
INSERT INTO `candidates` VALUES (9,'Data Analyst','aryan','','aryanmhatre380@gmail.com','8291201068','BTech Cybersec',2,'userData.notes,','Mumbai','K038_EXP4_DLD1.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759428101455-595101027-K038_EXP4_DLD1.pdf','dsasdasda','pass'),(10,'Software Engineer','adasdsa','','aryanmhatre124@gmail.com','8291201068','BTech Cybersec',2,'adad','Mumbai','K038_EXP4_DLD1.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759428333242-535867191-K038_EXP4_DLD1.pdf','adad','pass'),(11,'Software Engineer','dadad','','aryan.mhatre25@nmims.in','8291201068','BTech Cybersec',2,'sfsfs','Mumbai','K038_EXP5_DLD1.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759428500673-972122628-K038_EXP5_DLD1.pdf','sfs','pass'),(12,'Software Engineer','adadad','','aryan.mhatre15@nmims.in','8291201068','BTech Cybersec',2,'adadad','Mumbai','K038_Assign2_30-07-24.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759428649506-42003375-K038_Assign2_30-07-24.pdf','wwdqdqdwd','pass'),(15,'Software Engineer','sdsdfsdf','','aryan.mhatre10@nmims.in','8291201068','BTech Cybersec',2,'sdfsdf','Mumbai','K038_EXP5_DLD1.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759429150283-505934028-K038_EXP5_DLD1.pdf','sdf','pass'),(16,'Software Engineer','sfdfdsfass','','aryan.mhatre5@nmims.in','1312312361','BTech Cybersec',2,'good','Mumbai','K040 K2 DLD EXP 10.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759484619544-864789301-K040 K2 DLD EXP 10.pdf','dddddd','pass'),(17,'Data Analyst','Aryan','Mhatre','aryanmhatre38@gmail.com','1891201068','BTech Cybersec',4,'Python','Mumbai','K038_EXP5_DLD1.pdf','C:\\Users\\Aryan Mhatre\\find-my-interview\\backend\\uploads\\1759503014192-371254354-K038_EXP5_DLD1.pdf','none','pass');
/*!40000 ALTER TABLE `candidates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `industry` varchar(100) NOT NULL,
  `registration_number` varchar(100) NOT NULL,
  `gstin` varchar(30) DEFAULT NULL,
  `official_email` varchar(150) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `contact_number` varchar(20) NOT NULL,
  `company_size` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_number` (`registration_number`),
  UNIQUE KEY `official_email` (`official_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `department_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `role` enum('hr','interviewer') NOT NULL,
  `auth_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `auth_user_id` (`auth_user_id`),
  KEY `company_id` (`company_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interview_evaluations`
--

DROP TABLE IF EXISTS `interview_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interview_evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interview_id` int NOT NULL,
  `round_id` int NOT NULL,
  `criteria_name` varchar(255) NOT NULL,
  `score` int DEFAULT NULL,
  `feedback` text,
  `rating` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `interview_id` (`interview_id`),
  KEY `round_id` (`round_id`),
  CONSTRAINT `interview_evaluations_ibfk_1` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interview_evaluations_ibfk_2` FOREIGN KEY (`round_id`) REFERENCES `rounds` (`id`),
  CONSTRAINT `interview_evaluations_chk_1` CHECK (((`score` >= 0) and (`score` <= 10))),
  CONSTRAINT `interview_evaluations_chk_2` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_evaluations`
--

LOCK TABLES `interview_evaluations` WRITE;
/*!40000 ALTER TABLE `interview_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `interview_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interview_reminders`
--

DROP TABLE IF EXISTS `interview_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interview_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interview_id` int NOT NULL,
  `reminder_type` enum('email','sms','notification') NOT NULL,
  `scheduled_time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `interview_id` (`interview_id`),
  CONSTRAINT `interview_reminders_ibfk_1` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_reminders`
--

LOCK TABLES `interview_reminders` WRITE;
/*!40000 ALTER TABLE `interview_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `interview_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interviews`
--

DROP TABLE IF EXISTS `interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_id` int NOT NULL,
  `position_id` int NOT NULL,
  `interviewer_id_1` int NOT NULL,
  `interviewer_id_2` int DEFAULT NULL,
  `interviewer_id_3` int DEFAULT NULL,
  `round_id` int NOT NULL,
  `interview_date` datetime NOT NULL,
  `status` enum('scheduled','completed','canceled','pending') DEFAULT 'scheduled',
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  KEY `position_id` (`position_id`),
  KEY `interviewer_id_1` (`interviewer_id_1`),
  KEY `interviewer_id_2` (`interviewer_id_2`),
  KEY `interviewer_id_3` (`interviewer_id_3`),
  KEY `round_id` (`round_id`),
  CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interviews_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interviews_ibfk_3` FOREIGN KEY (`interviewer_id_1`) REFERENCES `employees` (`id`),
  CONSTRAINT `interviews_ibfk_4` FOREIGN KEY (`interviewer_id_2`) REFERENCES `employees` (`id`),
  CONSTRAINT `interviews_ibfk_5` FOREIGN KEY (`interviewer_id_3`) REFERENCES `employees` (`id`),
  CONSTRAINT `interviews_ibfk_6` FOREIGN KEY (`round_id`) REFERENCES `rounds` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviews`
--

LOCK TABLES `interviews` WRITE;
/*!40000 ALTER TABLE `interviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `interviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('open','closed','on_hold') DEFAULT 'open',
  `job_description` text,
  `no_of_positions` int DEFAULT '1',
  `date_of_description` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rounds`
--

DROP TABLE IF EXISTS `rounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rounds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rounds`
--

LOCK TABLES `rounds` WRITE;
/*!40000 ALTER TABLE `rounds` DISABLE KEYS */;
/*!40000 ALTER TABLE `rounds` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-20 18:30:16


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