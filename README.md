# HireHive

A web app to streamline and organize the recruitment process for companies.

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

Start scheduling interviews and streamline your recruitment process!
