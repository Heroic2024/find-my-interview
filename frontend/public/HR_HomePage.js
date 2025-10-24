console.log("💡 HR Dashboard loaded");

// Sample data for candidates (will be replaced with actual API call)
let candidates = [];

// Load company data on page load
document.addEventListener("DOMContentLoaded", () => {
  loadCompanyData();
  loadCandidates();
  loadNotes();
});

// ------------------ Company Data ------------------
async function loadCompanyData() {
  const email = localStorage.getItem("companyEmail");
  const token = localStorage.getItem("companyToken");

  if (!email || !token) {
    showError("Please log in first");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/company?email=${email}`, {
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
    console.error("❌ Error loading company data:", error);
    showError("Error loading company data");
  }
}

// ------------------ Candidates ------------------
async function loadCandidates() {
  const token = localStorage.getItem("companyToken");
  
  if (!token) {
    console.error("❌ No token found");
    document.getElementById("candidatesTableContainer").innerHTML = 
      '<p style="text-align: center; padding: 40px; color: #999;">Please log in to view candidates</p>';
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/candidates", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch candidates");
    }

    candidates = await response.json();
    console.log("✅ Loaded candidates:", candidates);

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

  const table = `
    <table class="candidates-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Position</th>
          <th>Experience</th>
          <th>Applied Date</th>
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
            <td><span class="status-badge status-${candidate.status}">${candidate.status}</span></td>
            <td>
              <button class="action-btn view-btn" onclick="viewCandidate(${candidate.id})">View</button>
              <button class="action-btn schedule-btn" onclick="scheduleInterview(${candidate.id})">Schedule</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = table;
}

function updateStats() {
  document.getElementById("totalCandidates").textContent = candidates.length;
  document.getElementById("activePositions").textContent = "3"; // This should come from positions table
  document.getElementById("pendingInterviews").textContent = candidates.filter(c => c.status === "scheduled").length;
  document.getElementById("feedbackPending").textContent = candidates.filter(c => c.status === "completed").length;
}

// ------------------ Search & Filter ------------------
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

// ------------------ Notes ------------------
function saveNote() {
  const noteInput = document.getElementById("noteInput");
  const noteText = noteInput.value.trim();

  if (!noteText) {
    alert("Please enter a note");
    return;
  }

  const note = {
    text: noteText,
    date: new Date().toLocaleString()
  };

  let notes = JSON.parse(localStorage.getItem("companyNotes") || "[]");
  notes.unshift(note);
  localStorage.setItem("companyNotes", JSON.stringify(notes));

  noteInput.value = "";
  loadNotes();
}

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("companyNotes") || "[]");
  const notesList = document.getElementById("notesList");

  if (notes.length === 0) {
    notesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No notes yet. Start adding notes above!</p>';
    return;
  }

  notesList.innerHTML = notes.map((note, index) => `
    <div class="note-item">
      <button class="delete-note-btn" onclick="deleteNote(${index})" title="Delete note">🗑️ Delete</button>
      <div class="note-date">${note.date}</div>
      <div class="note-content">${note.text}</div>
    </div>
  `).join('');
}

function deleteNote(index) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  let notes = JSON.parse(localStorage.getItem("companyNotes") || "[]");
  notes.splice(index, 1);
  localStorage.setItem("companyNotes", JSON.stringify(notes));
  loadNotes();

  console.log("✅ Note deleted successfully");
}

// ------------------ Candidate Actions ------------------
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
        <div class="detail-item"><div class="detail-label">Full Name</div><div class="detail-value">${candidate.name}</div></div>
        <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${candidate.email}</div></div>
        <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${candidate.phone || 'N/A'}</div></div>
        <div class="detail-item"><div class="detail-label">Location</div><div class="detail-value">${candidate.location || 'N/A'}</div></div>
      </div>
    </div>
    <div class="candidate-detail-section">
      <h3>Professional Information</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Position Applied</div><div class="detail-value">${candidate.position}</div></div>
        <div class="detail-item"><div class="detail-label">Experience</div><div class="detail-value">${candidate.experience}</div></div>
        <div class="detail-item"><div class="detail-label">Education</div><div class="detail-value">${candidate.education || 'N/A'}</div></div>
        <div class="detail-item"><div class="detail-label">Skills</div><div class="detail-value">${candidate.skills || 'N/A'}</div></div>
      </div>
    </div>
    <div class="candidate-detail-section">
      <h3>Application Details</h3>
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Application Date</div><div class="detail-value">${candidate.appliedDate}</div></div>
        <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge status-${candidate.status}">${candidate.status}</span></div></div>
        <div class="detail-item"><div class="detail-label">Resume</div>
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
  alert(`Download functionality for: ${filename}\nPath: ${path}\n\nNote: Implement a file download endpoint in backend.`);
}

window.onclick = function(event) {
  const modal = document.getElementById("candidateModal");
  if (event.target === modal) closeModal();
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') closeModal();
});

function scheduleInterview(id) {
  alert(`Scheduling interview for candidate ${id}.`);
}

function showFeedbackForm() {
  window.location.href = "feedback.html";
}

function showScheduler() {
  window.location.href = "interview_scheduler.html";
}

function showError(message) {
  const container = document.querySelector(".dashboard-container");
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  container.insertBefore(errorDiv, container.firstChild);
}

// ------------------ Smooth Scrolling ------------------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
