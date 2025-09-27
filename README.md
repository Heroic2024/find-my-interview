# find-my-interview

A web app to streamline and organize the recruitment process for companies.

## Database overview

This project uses a MySQL relational schema named `recruitment_system`. Main entities:

- companies: company records (id, name, email, website)
- departments: departments per company (company_id → companies.id)
- employees: HR / interviewer accounts linked to company/department
- positions: job openings (department_id → departments.id)
- candidates: applicants for positions (position_id, company_id)
- rounds: named interview rounds (e.g., "Technical Round")
- interviews: scheduled interviews (links to candidate, position, up to 3 interviewers, round)
- availability_slots: interviewers' weekly availability
- interview_reminders: scheduled reminders (email/sms/notification)
- interview_evaluations: per-interview evaluation criteria and scores
- auth_users: authentication users table used to link application users

Key schema notes:
- Referential integrity enforced via foreign keys and ON DELETE CASCADE where appropriate.
- Enum columns constrain allowed statuses (e.g., position.status, interview.status).
- Some columns use CHECK constraints for numeric ranges (MySQL 8+ supports these).
- Sample data is included at the end of the SQL.

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
     mysql -u root -p < "C:\Users\Aryan Mhatre\find-my-interview\recruitment_system.sql"
     ```
   - Or run interactively:
     ```
     mysql -u root -p
     mysql> SOURCE C:/Users/Aryan Mhatre/find-my-interview/recruitment_system.sql;
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

```sql
-- recruitment_system.sql
-- Schema for Recruitment Management System

-- Drop database if it exists
DROP DATABASE IF EXISTS recruitment_system;

-- Create Database
CREATE DATABASE recruitment_system;
USE recruitment_system;

-- COMPANIES Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255)
);

-- DEPARTMENTS Table
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- EMPLOYEES Table
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

-- POSITIONS Table
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

-- CANDIDATES Table
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

-- ROUNDS Table
CREATE TABLE rounds (
    round_id INT AUTO_INCREMENT PRIMARY KEY,
    round_name VARCHAR(100) NOT NULL
);

-- INTERVIEWS Table
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
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id_1) REFERENCES employees(id),
    FOREIGN KEY (interviewer_id_2) REFERENCES employees(id),
    FOREIGN KEY (interviewer_id_3) REFERENCES employees(id),
    FOREIGN KEY (round_id) REFERENCES rounds(round_id)
);

-- AVAILABILITY_SLOTS Table
CREATE TABLE availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id INT NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (interviewer_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- INTERVIEW_REMINDERS Table
CREATE TABLE interview_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interview_id INT NOT NULL,
    reminder_type ENUM('email','sms','notification') NOT NULL,
    scheduled_time DATETIME NOT NULL,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

-- INTERVIEW_EVALUATIONS Table
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

-- AUTH_USERS Table
CREATE TABLE auth_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('hr','interviewer','candidate') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================================
-- SAMPLE DATA
-- ==========================================================

-- Companies
INSERT INTO companies (name, email, website) VALUES
('TechCorp', 'info@techcorp.com', 'www.techcorp.com'),
('InnoSoft', 'contact@innosoft.com', 'www.innosoft.com');

-- Departments
INSERT INTO departments (company_id, name) VALUES
(1, 'Engineering'),
(1, 'Human Resources'),
(2, 'Product Development');

-- Auth Users
INSERT INTO auth_users (email, password_hash, role) VALUES
('hr@techcorp.com', 'hashed_pw1', 'hr'),
('john.doe@techcorp.com', 'hashed_pw2', 'interviewer'),
('jane.smith@innosoft.com', 'hashed_pw3', 'candidate');

-- Employees
INSERT INTO employees (company_id, department_id, first_name, last_name, email, username, role, auth_user_id) VALUES
(1, 2, 'Alice', 'Brown', 'hr@techcorp.com', 'alice_hr', 'hr', 1),
(1, 1, 'John', 'Doe', 'john.doe@techcorp.com', 'jdoe_eng', 'interviewer', 2);

-- Positions
INSERT INTO positions (department_id, title, status, job_description, no_of_positions, date_of_description) VALUES
(1, 'Software Engineer', 'open', 'Backend developer role', 3, '2025-09-01'),
(3, 'Product Manager', 'open', 'Manage product lifecycle', 1, '2025-09-05');

-- Candidates
INSERT INTO candidates (position_id, company_id, first_name, last_name, email, phone, applied_on, status, auth_user_id) VALUES
(1, 1, 'Jane', 'Smith', 'jane.smith@innosoft.com', '9876543210', '2025-09-10', 'applied', 3);

-- Rounds
INSERT INTO rounds (round_name) VALUES
('Technical Round'),
('HR Round');

-- Interviews
INSERT INTO interviews (candidate_id, position_id, interviewer_id_1, round_id, interview_date, status, file_name, file_path) VALUES
(1, 1, 2, 1, '2025-09-20 10:00:00', 'scheduled', 'resume.pdf', '/uploads/resume.pdf');

-- Availability Slots
INSERT INTO availability_slots (interviewer_id, day_of_week, start_time, end_time) VALUES
(2, 'Monday', '09:00:00', '12:00:00'),
(2, 'Wednesday', '14:00:00', '17:00:00');

-- Interview Reminders
INSERT INTO interview_reminders (interview_id, reminder_type, scheduled_time) VALUES
(1, 'email', '2025-09-19 09:00:00');

-- Interview Evaluations
INSERT INTO interview_evaluations (interview_id, round_id, criteria_name, score, feedback, rating) VALUES
(1, 1, 'Technical Knowledge', 8, 'Strong backend skills', 4);
```
