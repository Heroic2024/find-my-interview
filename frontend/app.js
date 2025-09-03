
        class InterviewManager {
            constructor() {
                this.apiUrl = '/api'; // Change this to your API URL if different
                this.interviews = [];
                this.currentEditId = null;
                this.initializeEventListeners();
                this.loadInitialData();
            }

            async apiCall(endpoint, options = {}) {
                try {
                    const response = await fetch(`${this.apiUrl}${endpoint}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        },
                        ...options
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || `HTTP error! status: ${response.status}`);
                    }

                    return await response.json();
                } catch (error) {
                    console.error('API call failed:', error);
                    throw error;
                }
            }

            async loadInitialData() {
                try {
                    await this.loadInterviews();
                    await this.updateDashboard();
                } catch (error) {
                    this.showError('Failed to load initial data: ' + error.message);
                }
            }

            async loadInterviews() {
                try {
                    this.interviews = await this.apiCall('/interviews');
                    this.displayInterviews();
                } catch (error) {
                    this.showError('Failed to load interviews: ' + error.message);
                    this.interviews = [];
                }
            }

            initializeEventListeners() {
                document.getElementById('interview-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit();
                });

                document.getElementById('search-input').addEventListener('input', () => {
                    this.filterInterviews();
                });

                document.getElementById('status-filter').addEventListener('change', () => {
                    this.filterInterviews();
                });
            }

            async handleFormSubmit() {
                const submitBtn = document.getElementById('submit-btn');
                const btnText = submitBtn.querySelector('.btn-text');
                const originalText = btnText.textContent;
                
                try {
                    // Show loading state
                    submitBtn.disabled = true;
                    btnText.innerHTML = '<div class="loading"></div>Processing...';
                    this.hideError();

                    const formData = {
                        candidateName: document.getElementById('candidate-name').value,
                        candidateEmail: document.getElementById('candidate-email').value,
                        candidatePhone: document.getElementById('candidate-phone').value,
                        position: document.getElementById('position').value,
                        interviewDate: document.getElementById('interview-date').value,
                        interviewer: document.getElementById('interviewer').value,
                        notes: document.getElementById('notes').value
                    };

                    if (this.currentEditId) {
                        // Update existing interview
                        await this.apiCall(`/interviews/${this.currentEditId}`, {
                            method: 'PUT',
                            body: JSON.stringify(formData)
                        });
                        this.showSuccessMessage('Interview updated successfully!');
                        this.currentEditId = null;
                    } else {
                        // Create new interview
                        await this.apiCall('/interviews', {
                            method: 'POST',
                            body: JSON.stringify(formData)
                        });
                        this.showSuccessMessage('Interview scheduled successfully!');
                    }

                    this.resetForm();
                    await this.loadInterviews();
                    await this.updateDashboard();
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    // Reset button state
                    submitBtn.disabled = false;
                    btnText.textContent = originalText;
                }
            }

            async editInterview(id) {
                try {
                    const interview = await this.apiCall(`/interviews/${id}`);
                    this.currentEditId = id;
                    
                    // Fill form with interview data
                    document.getElementById('candidate-name').value = interview.candidateName;
                    document.getElementById('candidate-email').value = interview.candidateEmail;
                    document.getElementById('candidate-phone').value = interview.candidatePhone || '';
                    document.getElementById('position').value = interview.position;
                    document.getElementById('interview-date').value = interview.interviewDate.slice(0, 16);
                    document.getElementById('interviewer').value = interview.interviewer;
                    document.getElementById('notes').value = interview.notes || '';
                    
                    // Update button text
                    const submitBtn = document.getElementById('submit-btn');
                    const btnText = submitBtn.querySelector('.btn-text');
                    btnText.textContent = 'Update Interview';
                    submitBtn.className = 'btn btn-success';
                    
                    // Switch to add interview tab
                    showTab('add-interview');
                } catch (error) {
                    this.showError('Failed to load interview data: ' + error.message);
                }
            }

            async deleteInterview(id) {
                if (!confirm('Are you sure you want to delete this interview?')) {
                    return;
                }

                try {
                    await this.apiCall(`/interviews/${id}`, { method: 'DELETE' });
                    this.showSuccessMessage('Interview deleted successfully!');
                    await this.loadInterviews();
                    await this.updateDashboard();
                } catch (error) {
                    this.showError('Failed to delete interview: ' + error.message);
                }
            }

            async updateStatus(id, newStatus) {
                try {
                    await this.apiCall(`/interviews/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: newStatus })
                    });
                    this.showSuccessMessage(`Interview marked as ${newStatus}!`);
                    await this.loadInterviews();
                    await this.updateDashboard();
                } catch (error) {
                    this.showError('Failed to update interview status: ' + error.message);
                }
            }

            async filterInterviews() {
                const searchTerm = document.getElementById('search-input').value;
                const statusFilter = document.getElementById('status-filter').value;
                
                try {
                    const params = new URLSearchParams();
                    if (searchTerm) params.append('search', searchTerm);
                    if (statusFilter) params.append('status', statusFilter);
                    
                    const filtered = await this.apiCall(`/interviews?${params}`);
                    this.displayInterviews(filtered);
                } catch (error) {
                    this.showError('Failed to filter interviews: ' + error.message);
                }
            }

            displayInterviews(interviewsToShow = this.interviews) {
                const container = document.getElementById('interviews-list');
                
                if (interviewsToShow.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <h3>No interviews found</h3>
                            <p>Start by scheduling your first interview!</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = interviewsToShow
                    .map(interview => this.createInterviewCard(interview))
                    .join('');
            }

            createInterviewCard(interview) {
                const interviewDate = new Date(interview.interviewDate);
                const formattedDate = interviewDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const formattedTime = interviewDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `
                    <div class="interview-card">
                        <div class="interview-header">
                            <div>
                                <div class="candidate-name">${interview.candidateName}</div>
                                <div class="position">${interview.position}</div>
                            </div>
                            <span class="status-badge status-${interview.status}">${interview.status}</span>
                        </div>
                        
                        <div class="interview-details">
                            <div class="detail-item">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${formattedDate}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${formattedTime}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Interviewer:</span>
                                <span class="detail-value">${interview.interviewer}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${interview.candidateEmail}</span>
                            </div>
                            ${interview.candidatePhone ? `
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${interview.candidatePhone}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${interview.notes ? `
                            <div style="margin-top: 15px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 10px;">
                                <strong>Notes:</strong> ${interview.notes}
                            </div>
                        ` : ''}
                        
                        <div class="actions">
                            <button class="btn btn-primary" onclick="interviewManager.editInterview('${interview.id}')" style="padding: 8px 16px; font-size: 0.9rem;">Edit</button>
                            ${interview.status === 'scheduled' ? `
                                <button class="btn btn-success" onclick="interviewManager.updateStatus('${interview.id}', 'completed')" style="padding: 8px 16px; font-size: 0.9rem;">Mark Complete</button>
                                <button class="btn btn-danger" onclick="interviewManager.updateStatus('${interview.id}', 'cancelled')" style="padding: 8px 16px; font-size: 0.9rem;">Cancel</button>
                            ` : ''}
                            <button class="btn btn-danger" onclick="interviewManager.deleteInterview('${interview.id}')" style="padding: 8px 16px; font-size: 0.9rem;">Delete</button>
                        </div>
                    </div>
                `;
            }

            async updateDashboard() {
                try {
                    // Get statistics
                    const stats = await this.apiCall('/dashboard/stats');
                    document.getElementById('total-interviews').textContent = stats.total_interviews || 0;
                    document.getElementById('scheduled-count').textContent = stats.scheduled_count || 0;
                    document.getElementById('completed-count').textContent = stats.completed_count || 0;
                    document.getElementById('this-week-count').textContent = stats.this_week_count || 0;

                    // Get upcoming interviews
                    const upcoming = await this.apiCall('/dashboard/upcoming');
                    const upcomingContainer = document.getElementById('upcoming-interviews');
                    
                    if (upcoming.length === 0) {
                        upcomingContainer.innerHTML = `
                            <div class="empty-state">
                                <h3>No upcoming interviews</h3>
                                <p>All caught up!</p>
                            </div>
                        `;
                    } else {
                        upcomingContainer.innerHTML = upcoming
                            .map(interview => this.createInterviewCard(interview))
                            .join('');
                    }
                } catch (error) {
                    this.showError('Failed to update dashboard: ' + error.message);
                }
            }

            resetForm() {
                document.getElementById('interview-form').reset();
                this.currentEditId = null;
                const submitBtn = document.getElementById('submit-btn');
                const btnText = submitBtn.querySelector('.btn-text');
                btnText.textContent = 'Schedule Interview';
                submitBtn.className = 'btn btn-primary';
            }

            showSuccessMessage(message) {
                // Remove any existing success messages
                document.querySelectorAll('.success-message').forEach(msg => msg.remove());
                
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = message;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.remove();
                }, 4000);
            }

            showError(message) {
                const errorDiv = document.getElementById('form-error');
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
            }

            hideError() {
                const errorDiv = document.getElementById('form-error');
                errorDiv.classList.add('hidden');
            }
        }

        // Initialize the interview manager
        const interviewManager = new InterviewManager();

        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.remove('hidden');
            
            // Add active class to clicked tab button
            event.target.classList.add('active');
            
            // Reset form if switching away from add-interview tab
            if (tabName !== 'add-interview' && interviewManager.currentEditId) {
                interviewManager.resetForm();
            }
            
            // Update dashboard when switching to it
            if (tabName === 'dashboard') {
                interviewManager.updateDashboard();
            }
        }

        // Set minimum date for interview scheduling to today
        document.getElementById('interview-date').min = new Date().toISOString().slice(0, 16);
