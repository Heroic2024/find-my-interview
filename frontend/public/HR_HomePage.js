
    console.log("💡 HR Dashboard loaded");

    // Sample data for candidates (will be replaced with actual API call)
    let candidates = [];

    // Load company data on page load
    document.addEventListener("DOMContentLoaded", () => {
      loadCompanyData();
      loadCandidates();
      loadNotes();
    });

    async function loadCompanyData() {
      const email = localStorage.getItem("companyEmail");
      const token = localStorage.getItem("companyToken");

      if (!email || !token) {
        showError("Please log in first");
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/companies?email=${email}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch company data");

        const company = await response.json();
        console.log("🏢 Company data:", company);

        // Update all company information across the dashboard
        document.getElementById("navCompanyName").textContent = company.name;
        document.getElementById("welcomeCompanyName").textContent = `Welcome, ${company.name}!`;
        document.getElementById("companyIndustry").textContent = company.industry;
        document.getElementById("companyEmail").textContent = company.official_email;
        document.getElementById("companyContact").textContent = company.contact_number;
        
        // Set company initials
        const initials = company.name.split(' ').map(word => word[0]).join('').substring(0, 2);
        document.getElementById("companyInitials").textContent = initials.toUpperCase();

        // Update contact section
        document.getElementById("contactCompanyName").textContent = company.name;
        document.getElementById("contactRegNo").textContent = company.registration_number || "N/A";
        document.getElementById("contactGSTIN").textContent = company.gstin || "N/A";
        document.getElementById("contactEmail").textContent = company.official_email;
        document.getElementById("contactWebsite").textContent = company.website || "N/A";
        document.getElementById("contactPhone").textContent = company.contact_number;
        document.getElementById("contactSize").textContent = company.company_size;
        document.getElementById("contactAddress").textContent = company.address;

      } catch (error) {
        console.error("❌  ng company data:", error);
        showError("Error loading company data");
      }
    }

    async function loadCandidates() {
      const token = localStorage.getItem("companyToken");
      
      if (!token) {
        console.error("❌ No token found");
        document.getElementById("candidatesTableContainer").innerHTML = 
          '<p style="text-align: center; padding: 40px; color: #999;">Please log in to view candidates</p>';
        return;
      }

      try {
        // Fetch candidates
        const candidatesResponse = await fetch("http://localhost:3000/api/candidates", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!candidatesResponse.ok) {
          throw new Error("Failed to fetch candidates");
        }

        candidates = await candidatesResponse.json();

        // Fetch interviews to determine candidate status
        const interviewsResponse = await fetch("http://localhost:3000/api/interviews", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        let interviews = [];
        if (interviewsResponse.ok) {
          interviews = await interviewsResponse.json();
        }

        // Fetch feedback to determine if candidate passed
        const feedbackResponse = await fetch("http://localhost:3000/api/feedback", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        let feedbacks = [];
        if (feedbackResponse.ok) {
          feedbacks = await feedbackResponse.json();
        }

        // Update candidate status based on interviews and feedback
        candidates = candidates.map(candidate => {
          const candidateInterviews = interviews.filter(i => i.candidate_id === candidate.id);
          const candidateFeedback = feedbacks.filter(f => f.candidate_id === candidate.id);

          let status = 'applied'; // Default status
          let statusColor = 'pending';

          if (candidateInterviews.length === 0) {
            // No interviews scheduled
            status = 'applied';
            statusColor = 'pending';
          } else {
            const latestInterview = candidateInterviews[0];
            
            if (latestInterview.status === 'scheduled') {
              const interviewDate = new Date(latestInterview.interview_date);
              const now = new Date();
              
              if (interviewDate > now) {
                status = 'interview scheduled';
                statusColor = 'scheduled';
              } else {
                status = 'interview pending';
                statusColor = 'pending';
              }
            } else if (latestInterview.status === 'completed') {
              if (candidateFeedback.length > 0) {
                const latestFeedback = candidateFeedback[0];
                
                // Determine if candidate passed based on recommendation
                if (latestFeedback.recommendation === 'strongly_recommend' || 
                    latestFeedback.recommendation === 'recommend') {
                  status = 'selected';
                  statusColor = 'completed';
                } else if (latestFeedback.recommendation === 'strongly_not_recommend' || 
                           latestFeedback.recommendation === 'not_recommend') {
                  status = 'rejected';
                  statusColor = 'canceled';
                } else {
                  status = 'under review';
                  statusColor = 'pending';
                }
              } else {
                status = 'feedback pending';
                statusColor = 'pending';
              }
            } else if (latestInterview.status === 'canceled') {
              status = 'interview canceled';
              statusColor = 'canceled';
            }
          }

          return {
            ...candidate,
            status: status,
            statusColor: statusColor,
            interviewCount: candidateInterviews.length,
            feedbackCount: candidateFeedback.length
          };
        });

        console.log("✅ Loaded candidates with status:", candidates);

        renderCandidates(candidates);
        updateStats();
      } catch (error) {
        console.error("❌ Error loading candidates:", error);
        document.getElementById("candidatesTableContainer").innerHTML = 
          '<div class="error">Error loading candidates. Please try again.</div>';
      }
    }

    function renderCandidates(candidatesList) {
      const container = document.getElementById("candidatesTableContainer");
      
      if (candidatesList.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No candidates found</p>';
        return;
      }

      // Populate position filter with unique positions
      const positions = [...new Set(candidates.map(c => c.position))];
      const positionFilter = document.getElementById("positionFilter");
      const currentValue = positionFilter.value;
      positionFilter.innerHTML = '<option value="">All Positions</option>' + 
        positions.map(pos => `<option value="${pos}">${pos}</option>`).join('');
      positionFilter.value = currentValue;

      // Get status label with proper formatting
      const getStatusLabel = (status) => {
        const statusLabels = {
          'applied': 'Applied',
          'interview scheduled': 'Interview Scheduled',
          'interview pending': 'Interview Pending',
          'feedback pending': 'Feedback Pending',
          'under review': 'Under Review',
          'selected': 'Selected ✓',
          'rejected': 'Rejected',
          'interview canceled': 'Interview Canceled'
        };
        return statusLabels[status] || status;
      };

      const table = `
        <table class="candidates-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Experience</th>
              <th>Applied Date</th>
              <th>Interviews</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${candidatesList.map(candidate => `
              <tr>
                <td><strong>${candidate.name}</strong></td>
                <td>${candidate.email}</td>
                <td>${candidate.position}</td>
                <td>${candidate.experience}</td>
                <td>${candidate.appliedDate}</td>
                <td style="text-align: center;">
                  ${candidate.interviewCount > 0 ? 
                    `<span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${candidate.interviewCount}</span>` 
                    : '-'}
                </td>
                <td>
                  <span class="status-badge status-${candidate.statusColor}">
                    ${getStatusLabel(candidate.status)}
                  </span>
                </td>
                <td>
                  <button class="action-btn view-btn" onclick="viewCandidate(${candidate.id})">View</button>
                  ${candidate.status === 'applied' || candidate.status === 'interview canceled' ? 
                    `<button class="action-btn schedule-btn" onclick="scheduleInterview('${candidate.first_name}', '${candidate.last_name}')">Schedule</button>
` 
                    : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      container.innerHTML = table;
    }

    function updateStats() {
      // Count different statuses
      const totalCandidates = candidates.length;
      const scheduledInterviews = candidates.filter(c => c.status === 'interview scheduled').length;
      const feedbackPending = candidates.filter(c => c.status === 'feedback pending').length;
      const selected = candidates.filter(c => c.status === 'selected').length;

      document.getElementById("totalCandidates").textContent = totalCandidates;
      document.getElementById("activePositions").textContent = [...new Set(candidates.map(c => c.position))].length;
      document.getElementById("pendingInterviews").textContent = scheduledInterviews;
      document.getElementById("feedbackPending").textContent = feedbackPending;
    }

    // Search and filter functionality
    document.getElementById("searchInput")?.addEventListener("input", filterCandidates);
    document.getElementById("positionFilter")?.addEventListener("change", filterCandidates);
    document.getElementById("statusFilter")?.addEventListener("change", filterCandidates);

    function filterCandidates() {
      const searchTerm = document.getElementById("searchInput").value.toLowerCase();
      const positionFilter = document.getElementById("positionFilter").value;
      const statusFilter = document.getElementById("statusFilter").value;

      const filtered = candidates.filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(searchTerm) ||
                            candidate.email.toLowerCase().includes(searchTerm) ||
                            candidate.position.toLowerCase().includes(searchTerm);
        const matchesPosition = !positionFilter || candidate.position === positionFilter;
        const matchesStatus = !statusFilter || candidate.status === statusFilter;

        return matchesSearch && matchesPosition && matchesStatus;
      });

      renderCandidates(filtered);
    }

    // Notes functionality
    async function saveNote() {
      const noteInput = document.getElementById("noteInput");
      const noteText = noteInput.value.trim();

      if (!noteText) {
        alert("Please enter a note");
        return;
      }

      const token = localStorage.getItem("companyToken");
      if (!token) {
        alert("Please log in first");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/notes", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ noteText })
        });

        if (!response.ok) throw new Error("Failed to save note");

        noteInput.value = "";
        await loadNotes();
        console.log("✅ Note saved successfully");

      } catch (error) {
        console.error("❌ Error saving note:", error);
        alert("Failed to save note. Please try again.");
      }
    }

    async function loadNotes() {
      const token = localStorage.getItem("companyToken");
      if (!token) return;

      try {
        const response = await fetch("http://localhost:3000/api/notes", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });

        if (!response.ok) throw new Error("Failed to load notes");

        const notes = await response.json();
        const notesList = document.getElementById("notesList");

        if (notes.length === 0) {
          notesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No notes yet. Start adding notes above!</p>';
          return;
        }

        notesList.innerHTML = notes.map((note) => `
          <div class="note-item">
            <button class="delete-note-btn" onclick="deleteNote(${note.id})" title="Delete note">🗑️ Delete</button>
            <div class="note-date">${new Date(note.created_at).toLocaleString()}</div>
            <div class="note-content">${note.note_text}</div>
          </div>
        `).join('');

      } catch (error) {
        console.error("❌ Error loading notes:", error);
        document.getElementById("notesList").innerHTML = 
          '<p style="color: #999; text-align: center; padding: 20px;">Error loading notes</p>';
      }
    }
    async function deleteNote(noteId) {
      if (!confirm("Are you sure you want to delete this note?")) {
        return;
      }

      const token = localStorage.getItem("companyToken");
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:3000/api/notes/${noteId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });

        if (!response.ok) throw new Error("Failed to delete note");

        await loadNotes();
        console.log("✅ Note deleted successfully");

      } catch (error) {
        console.error("❌ Error deleting note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }

    // Action functions
    let currentCandidateId = null;

    function viewCandidate(id) {
      currentCandidateId = id;
      const candidate = candidates.find(c => c.id === id);
      
      if (!candidate) {
        alert("Candidate not found!");
        return;
      }

      const modalBody = document.getElementById("modalBody");
      modalBody.innerHTML = `
        <div class="candidate-detail-section">
          <h3>Personal Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Full Name</div>
              <div class="detail-value">${candidate.name}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Email</div>
              <div class="detail-value">${candidate.email}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${candidate.phone || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Location</div>
              <div class="detail-value">${candidate.location || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="candidate-detail-section">
          <h3>Professional Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Position Applied</div>
              <div class="detail-value">${candidate.position}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Experience</div>
              <div class="detail-value">${candidate.experience}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Education</div>
              <div class="detail-value">${candidate.education || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Skills</div>
              <div class="detail-value">${candidate.skills || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="candidate-detail-section">
          <h3>Application Details</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Application Date</div>
              <div class="detail-value">${candidate.appliedDate}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value">
                <span class="status-badge status-${candidate.status}">${candidate.status}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Resume</div>
              <div class="detail-value">
                ${candidate.resume_file_name ? 
                  `<a href="#" class="resume-download" onclick="downloadResume('${candidate.resume_file_path}', '${candidate.resume_file_name}')">📄 Download Resume</a>` 
                  : 'No resume uploaded'}
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById("candidateModal").style.display = "block";
    }

    function closeModal() {
      document.getElementById("candidateModal").style.display = "none";
      currentCandidateId = null;
    }

    function scheduleInterviewFromModal() {
      if (currentCandidateId) {
        closeModal();
        scheduleInterview(currentCandidateId);
      }
    }

    function downloadResume(path, filename) {
      // This would need a backend endpoint to serve the file
      alert(`Download functionality for: ${filename}\nPath: ${path}\n\nNote: You'll need to implement a file download endpoint in your backend.`);
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
      const modal = document.getElementById("candidateModal");
      if (event.target === modal) {
        closeModal();
      }
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    function scheduleInterview(candidateId) {
      /*const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) {
        alert("Candidate not found!");
        return;
      }

      // Store candidate info in localStorage for the scheduler page
      localStorage.setItem('scheduleCandidate', JSON.stringify({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        position: candidate.position
      }));*/

      window.location.href = "interview_scheduler.html";
    }

    function scheduleInterviewFromModal() {
      /*if (currentCandidateId) {
        closeModal();
        scheduleInterview(currentCandidateId);
      }*/
      window.location.href = "interview_scheduler.html";
    }

    function showFeedbackForm() {
  window.location.href = "/feedback";
}

function showScheduler() {
  window.location.href = "/interviewScheduler";
}

    function showError(message) {
      const container = document.querySelector(".dashboard-container");
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = message;
      container.insertBefore(errorDiv, container.firstChild);
    }

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
