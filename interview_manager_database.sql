-- Interview Manager Database Schema
-- This script creates a comprehensive database for managing interviews

-- Create the database
CREATE DATABASE IF NOT EXISTS interview_manager;
USE interview_manager;

-- Enable foreign key constraints (for MySQL)
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TABLE: companies
-- Stores company information for multi-company support
-- ============================================
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: departments
-- Stores department information within companies
-- ============================================
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_dept (company_id, name)
);

-- ============================================
-- TABLE: positions
-- Stores job positions available for interviews
-- ============================================
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    employment_type ENUM('full-time', 'part-time', 'contract', 'internship') DEFAULT 'full-time',
    status ENUM('active', 'inactive', 'filled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_position_status (status),
    INDEX idx_position_title (title)
);

-- ============================================
-- TABLE: interviewers
-- Stores information about people who conduct interviews
-- ============================================
CREATE TABLE interviewers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    job_title VARCHAR(255),
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    specializations TEXT, -- JSON array of specialization areas
    max_interviews_per_day INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_interviewer_email (email),
    INDEX idx_interviewer_active (is_active)
);

-- ============================================
-- TABLE: candidates
-- Stores candidate information
-- ============================================
CREATE TABLE candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    linkedin_url VARCHAR(500),
    resume_path VARCHAR(500),
    cover_letter_path VARCHAR(500),
    experience_years INT,
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    expected_salary DECIMAL(10,2),
    availability_date DATE,
    notes TEXT,
    source ENUM('job_board', 'referral', 'linkedin', 'company_website', 'recruiter', 'other') DEFAULT 'other',
    status ENUM('new', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_candidate_email (email),
    INDEX idx_candidate_status (status),
    INDEX idx_candidate_name (last_name, first_name)
);

-- ============================================
-- TABLE: interviews
-- Main table for storing interview information
-- ============================================
CREATE TABLE interviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    position_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    interview_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    interview_type ENUM('phone', 'video', 'in-person', 'panel', 'technical', 'behavioral') DEFAULT 'video',
    location VARCHAR(500), -- Can be room number, zoom link, etc.
    status ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled', 'no-show') DEFAULT 'scheduled',
    round_number INT DEFAULT 1, -- For multiple interview rounds
    notes TEXT,
    preparation_notes TEXT, -- Notes for the interviewer to prepare
    feedback TEXT, -- Post-interview feedback
    rating INT CHECK (rating >= 1 AND rating <= 10), -- 1-10 rating scale
    recommendation ENUM('strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire'),
    next_steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    scheduled_by INT, -- ID of user who scheduled the interview
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
    INDEX idx_interview_date (interview_date),
    INDEX idx_interview_status (status),
    INDEX idx_interview_candidate (candidate_id),
    INDEX idx_interview_interviewer (interviewer_id),
    INDEX idx_interview_position (position_id)
);

-- ============================================
-- TABLE: interview_questions
-- Stores predefined interview questions by category
-- ============================================
CREATE TABLE interview_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('technical', 'behavioral', 'situational', 'cultural_fit', 'leadership', 'general') NOT NULL,
    question TEXT NOT NULL,
    suggested_answer TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    position_type VARCHAR(255), -- e.g., 'software engineer', 'marketing manager'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_category (category),
    INDEX idx_question_position (position_type),
    INDEX idx_question_active (is_active)
);

-- ============================================
-- TABLE: interview_evaluations
-- Stores detailed evaluation criteria and scores
-- ============================================
CREATE TABLE interview_evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interview_id INT NOT NULL,
    criteria_name VARCHAR(255) NOT NULL, -- e.g., 'Technical Skills', 'Communication'
    score INT CHECK (score >= 1 AND score <= 5), -- 1-5 scale
    comments TEXT,
    weight DECIMAL(3,2) DEFAULT 1.00, -- Weight factor for this criteria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    INDEX idx_evaluation_interview (interview_id)
);

-- ============================================
-- TABLE: interview_attachments
-- Stores file attachments related to interviews
-- ============================================
CREATE TABLE interview_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interview_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100), -- e.g., 'resume', 'portfolio', 'test_results'
    file_size INT, -- in bytes
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT, -- ID of user who uploaded
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    INDEX idx_attachment_interview (interview_id)
);

-- ============================================
-- TABLE: availability_slots
-- Stores interviewer availability
-- ============================================
CREATE TABLE availability_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interviewer_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
    INDEX idx_availability_interviewer (interviewer_id),
    INDEX idx_availability_day (day_of_week)
);

-- ============================================
-- TABLE: interview_reminders
-- Stores reminder settings and status
-- ============================================
CREATE TABLE interview_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interview_id INT NOT NULL,
    reminder_type ENUM('email', 'sms', 'slack', 'calendar') NOT NULL,
    recipient_type ENUM('candidate', 'interviewer', 'both') NOT NULL,
    scheduled_time DATETIME NOT NULL,
    sent_at DATETIME NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    INDEX idx_reminder_interview (interview_id),
    INDEX idx_reminder_status (status),
    INDEX idx_reminder_scheduled (scheduled_time)
);

-- ============================================
-- TABLE: users (for system access control)
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role ENUM('admin', 'hr_manager', 'recruiter', 'interviewer', 'viewer') DEFAULT 'viewer',
    company_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_active (is_active)
);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for complete interview information
CREATE VIEW interview_details AS
SELECT 
    i.id,
    i.interview_date,
    i.duration_minutes,
    i.interview_type,
    i.location,
    i.status,
    i.round_number,
    i.rating,
    i.recommendation,
    CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
    c.email AS candidate_email,
    c.phone AS candidate_phone,
    p.title AS position_title,
    d.name AS department_name,
    comp.name AS company_name,
    CONCAT(int.first_name, ' ', int.last_name) AS interviewer_name,
    int.email AS interviewer_email,
    i.notes,
    i.feedback,
    i.created_at,
    i.updated_at
FROM interviews i
JOIN candidates c ON i.candidate_id = c.id
JOIN positions p ON i.position_id = p.id
JOIN departments d ON p.department_id = d.id
JOIN companies comp ON d.company_id = comp.id
JOIN interviewers int ON i.interviewer_id = int.id;

-- View for candidate pipeline
CREATE VIEW candidate_pipeline AS
SELECT 
    c.id,
    CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
    c.email,
    c.status,
    c.source,
    COUNT(i.id) AS total_interviews,
    MAX(i.interview_date) AS last_interview_date,
    AVG(i.rating) AS average_rating,
    c.created_at AS application_date
FROM candidates c
LEFT JOIN interviews i ON c.id = i.candidate_id
GROUP BY c.id, c.first_name, c.last_name, c.email, c.status, c.source, c.created_at;

-- View for interviewer workload
CREATE VIEW interviewer_workload AS
SELECT 
    int.id,
    CONCAT(int.first_name, ' ', int.last_name) AS interviewer_name,
    int.email,
    COUNT(CASE WHEN i.status = 'scheduled' AND i.interview_date >= CURDATE() THEN 1 END) AS upcoming_interviews,
    COUNT(CASE WHEN i.status = 'completed' AND MONTH(i.interview_date) = MONTH(CURDATE()) THEN 1 END) AS interviews_this_month,
    AVG(CASE WHEN i.rating IS NOT NULL THEN i.rating END) AS average_rating_given,
    int.max_interviews_per_day
FROM interviewers int
LEFT JOIN interviews i ON int.id = i.interviewer_id
WHERE int.is_active = TRUE
GROUP BY int.id, int.first_name, int.last_name, int.email, int.max_interviews_per_day;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample companies
INSERT INTO companies (name, address, phone, email, website) VALUES
('TechCorp Solutions', '123 Innovation Drive, Silicon Valley, CA 94025', '+1-555-0101', 'info@techcorp.com', 'www.techcorp.com'),
('Digital Dynamics', '456 Tech Street, Austin, TX 78701', '+1-555-0102', 'contact@digitaldynamics.com', 'www.digitaldynamics.com');

-- Insert sample departments
INSERT INTO departments (company_id, name, description, manager_name) VALUES
(1, 'Engineering', 'Software development and technical operations', 'John Smith'),
(1, 'Product Management', 'Product strategy and development', 'Sarah Johnson'),
(1, 'Human Resources', 'Talent acquisition and employee relations', 'Mike Davis'),
(2, 'Marketing', 'Digital marketing and brand management', 'Lisa Chen'),
(2, 'Sales', 'Business development and client relations', 'Robert Wilson');

-- Insert sample positions
INSERT INTO positions (department_id, title, description, requirements, salary_min, salary_max, employment_type) VALUES
(1, 'Senior Software Engineer', 'Lead development of scalable web applications', 'Bachelor''s degree in CS, 5+ years experience, React, Node.js', 120000.00, 180000.00, 'full-time'),
(1, 'DevOps Engineer', 'Manage CI/CD pipelines and cloud infrastructure', 'Experience with AWS, Docker, Kubernetes, Jenkins', 100000.00, 150000.00, 'full-time'),
(2, 'Product Manager', 'Drive product strategy and roadmap', 'MBA preferred, 3+ years product management experience', 110000.00, 160000.00, 'full-time'),
(4, 'Digital Marketing Specialist', 'Execute digital marketing campaigns', 'Marketing degree, Google Ads certification, 2+ years experience', 60000.00, 85000.00, 'full-time');

-- Insert sample interviewers
INSERT INTO interviewers (company_id, first_name, last_name, email, phone, job_title, department_id, specializations) VALUES
(1, 'Alice', 'Thompson', 'alice.thompson@techcorp.com', '+1-555-0201', 'Engineering Manager', 1, '["JavaScript", "System Design", "Leadership"]'),
(1, 'Bob', 'Rodriguez', 'bob.rodriguez@techcorp.com', '+1-555-0202', 'Senior Developer', 1, '["React", "Node.js", "Database Design"]'),
(1, 'Carol', 'Kim', 'carol.kim@techcorp.com', '+1-555-0203', 'VP of Product', 2, '["Product Strategy", "User Experience", "Analytics"]'),
(2, 'David', 'Brown', 'david.brown@digitaldynamics.com', '+1-555-0204', 'Marketing Director', 4, '["Digital Marketing", "SEO", "Social Media"]');

-- Insert sample candidates
INSERT INTO candidates (first_name, last_name, email, phone, experience_years, current_position, current_company, expected_salary, source, status) VALUES
('Emma', 'Watson', 'emma.watson@email.com', '+1-555-0301', 6, 'Software Engineer', 'StartupXYZ', 140000.00, 'linkedin', 'interviewing'),
('James', 'Miller', 'james.miller@email.com', '+1-555-0302', 4, 'Full Stack Developer', 'WebTech Inc', 120000.00, 'job_board', 'screening'),
('Sophia', 'Garcia', 'sophia.garcia@email.com', '+1-555-0303', 8, 'Senior Product Manager', 'BigCorp', 150000.00, 'referral', 'interviewing'),
('William', 'Jones', 'william.jones@email.com', '+1-555-0304', 3, 'Marketing Coordinator', 'MediaCorp', 70000.00, 'company_website', 'new');

-- Insert sample interviews
INSERT INTO interviews (candidate_id, position_id, interviewer_id, interview_date, duration_minutes, interview_type, location, status, round_number, notes) VALUES
(1, 1, 1, '2024-02-15 10:00:00', 60, 'video', 'https://zoom.us/j/123456789', 'completed', 1, 'Technical screening completed successfully'),
(1, 1, 2, '2024-02-20 14:00:00', 90, 'video', 'https://zoom.us/j/987654321', 'scheduled', 2, 'Technical deep-dive interview'),
(2, 1, 1, '2024-02-18 11:00:00', 45, 'phone', 'Phone Interview', 'completed', 1, 'Initial phone screening'),
(3, 3, 3, '2024-02-22 15:30:00', 60, 'in-person', 'Conference Room A', 'scheduled', 1, 'Product management case study'),
(4, 4, 4, '2024-02-25 09:00:00', 45, 'video', 'https://meet.google.com/abc-defg-hij', 'scheduled', 1, 'Marketing role discussion');

-- Insert sample interview questions
INSERT INTO interview_questions (category, question, difficulty_level, position_type) VALUES
('technical', 'Explain the difference between SQL and NoSQL databases and when you would use each.', 'medium', 'software engineer'),
('behavioral', 'Tell me about a time when you had to work with a difficult team member. How did you handle it?', 'medium', 'general'),
('technical', 'How would you design a URL shortening service like bit.ly?', 'hard', 'software engineer'),
('situational', 'How would you prioritize features for a product with limited development resources?', 'medium', 'product manager'),
('cultural_fit', 'What motivates you to do your best work?', 'easy', 'general');

-- Insert sample availability slots
INSERT INTO availability_slots (interviewer_id, day_of_week, start_time, end_time) VALUES
(1, 'monday', '09:00:00', '17:00:00'),
(1, 'tuesday', '09:00:00', '17:00:00'),
(1, 'wednesday', '09:00:00', '17:00:00'),
(1, 'thursday', '09:00:00', '17:00:00'),
(1, 'friday', '09:00:00', '15:00:00'),
(2, 'monday', '10:00:00', '18:00:00'),
(2, 'wednesday', '10:00:00', '18:00:00'),
(2, 'friday', '10:00:00', '18:00:00');

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, role, company_id) VALUES
('admin', 'admin@techcorp.com', '$2b$10$example_hash_here', 'Admin', 'User', 'admin', 1),
('alice.t', 'alice.thompson@techcorp.com', '$2b$10$example_hash_here2', 'Alice', 'Thompson', 'interviewer', 1),
('hr.manager', 'hr@techcorp.com', '$2b$10$example_hash_here3', 'HR', 'Manager', 'hr_manager', 1);

-- ============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================

DELIMITER //

-- Procedure to schedule an interview with conflict checking
CREATE PROCEDURE ScheduleInterview(
    IN p_candidate_id INT,
    IN p_position_id INT,
    IN p_interviewer_id INT,
    IN p_interview_date DATETIME,
    IN p_duration_minutes INT,
    IN p_interview_type ENUM('phone', 'video', 'in-person', 'panel', 'technical', 'behavioral'),
    IN p_location VARCHAR(500),
    IN p_notes TEXT
)
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Check for interviewer conflicts
    SELECT COUNT(*) INTO conflict_count
    FROM interviews
    WHERE interviewer_id = p_interviewer_id
    AND status IN ('scheduled', 'in-progress')
    AND (
        (p_interview_date BETWEEN interview_date AND DATE_ADD(interview_date, INTERVAL duration_minutes MINUTE))
        OR
        (DATE_ADD(p_interview_date, INTERVAL p_duration_minutes MINUTE) BETWEEN interview_date AND DATE_ADD(interview_date, INTERVAL duration_minutes MINUTE))
    );

    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Interviewer has a scheduling conflict';
    END IF;

    -- Insert the interview
    INSERT INTO interviews (
        candidate_id, position_id, interviewer_id, interview_date, 
        duration_minutes, interview_type, location, notes
    ) VALUES (
        p_candidate_id, p_position_id, p_interviewer_id, p_interview_date,
        p_duration_minutes, p_interview_type, p_location, p_notes
    );

    COMMIT;
END//

-- Procedure to get interviewer availability
CREATE PROCEDURE GetInterviewerAvailability(
    IN p_interviewer_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE(p_start_date + INTERVAL days.n DAY) as available_date,
        a.start_time,
        a.end_time,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM interviews i 
                WHERE i.interviewer_id = p_interviewer_id 
                AND DATE(i.interview_date) = DATE(p_start_date + INTERVAL days.n DAY)
                AND i.status IN ('scheduled', 'in-progress')
            ) THEN 'partial'
            ELSE 'available'
        END as status
    FROM (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    ) as days
    JOIN availability_slots a ON a.interviewer_id = p_interviewer_id
    WHERE DAYNAME(p_start_date + INTERVAL days.n DAY) = 
          CASE a.day_of_week
              WHEN 'monday' THEN 'Monday'
              WHEN 'tuesday' THEN 'Tuesday' 
              WHEN 'wednesday' THEN 'Wednesday'
              WHEN 'thursday' THEN 'Thursday'
              WHEN 'friday' THEN 'Friday'
              WHEN 'saturday' THEN 'Saturday'
              WHEN 'sunday' THEN 'Sunday'
          END
    AND (p_start_date + INTERVAL days.n DAY) <= p_end_date
    AND a.is_available = TRUE
    ORDER BY available_date, a.start_time;
END//

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_interviews_candidate_status ON interviews(candidate_id, status);
CREATE INDEX idx_interviews_date_status ON interviews(interview_date, status);
CREATE INDEX idx_interviews_interviewer_date ON interviews(interviewer_id, interview_date);
CREATE INDEX idx_candidates_status_created ON candidates(status, created_at);
CREATE INDEX idx_positions_dept_status ON positions(department_id, status);

-- ============================================
-- TRIGGERS FOR AUDIT TRAIL
-- ============================================

-- Trigger to update candidate status when interview is completed
DELIMITER //
CREATE TRIGGER update_candidate_status_after_interview
AFTER UPDATE ON interviews
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update candidate status based on interview outcome
        IF NEW.recommendation IN ('strong_hire', 'hire') THEN
            UPDATE candidates SET status = 'offered' WHERE id = NEW.candidate_id;
        ELSEIF NEW.recommendation = 'strong_no_hire' THEN
            UPDATE candidates SET status = 'rejected' WHERE id = NEW.candidate_id;
        END IF;
    END IF;
END//
DELIMITER ;

-- Show all tables created
SHOW TABLES;

-- Display table structures
DESCRIBE companies;
DESCRIBE candidates;
DESCRIBE interviews;
DESCRIBE positions;