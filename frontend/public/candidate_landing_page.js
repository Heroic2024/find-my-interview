
    class CandidateActivities {
      constructor() {
        this.activities = [];
        this.joinedActivities = new Set(); // Track joined ones
        this.loadActivities();
      }

      async loadActivities() {
        try {
          // Simulate API call (replace with fetch('/api/activities'))
          this.activities = [
            {
              id: 1,
              title: "Group Coding Challenge",
              date: "2025-09-15",
              time: "10:00 AM",
              organizer: "HR Team",
              description: "Solve coding problems in groups to enhance teamwork."
            },
            {
              id: 2,
              title: "Presentation Skills Workshop",
              date: "2025-09-18",
              time: "2:00 PM",
              organizer: "Training Dept",
              description: "Improve your public speaking and presentation skills."
            },
            {
              id: 3,
              title: "Mock Interviews",
              date: "2025-09-20",
              time: "11:00 AM",
              organizer: "Recruitment Team",
              description: "Practice interviews with feedback sessions."
            }
          ];
          this.displayActivities();
        } catch (error) {
          document.getElementById("activities-list").innerHTML = `
            <div class="empty-state">Failed to load activities</div>
          `;
        }
      }

      displayActivities() {
        const container = document.getElementById("activities-list");
        if (this.activities.length === 0) {
          container.innerHTML = `
            <div class="empty-state">No activities available</div>
          `;
          return;
        }

        container.innerHTML = this.activities.map(activity => this.createCard(activity)).join("");
      }

      createCard(activity) {
        const isJoined = this.joinedActivities.has(activity.id);
        return `
          <div class="activity-card">
            <div class="activity-header">
              <span>${activity.title}</span>
              <span>${activity.date} @ ${activity.time}</span>
            </div>
            <div class="activity-details">
              <p><strong>Organizer:</strong> ${activity.organizer}</p>
              <p>${activity.description}</p>
            </div>
            <button 
              class="${isJoined ? "joined" : ""}" 
              onclick="candidateActivities.toggleJoin(${activity.id})">
              ${isJoined ? "✅ Joined" : "Join"}
            </button>
          </div>
        `;
      }

      toggleJoin(id) {
        if (this.joinedActivities.has(id)) {
          this.joinedActivities.delete(id);
        } else {
          this.joinedActivities.add(id);
        }
        this.displayActivities();
      }
    }

    // logout.js
    function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('candidateId');
      window.location.href = 'login.html'; // or your actual login page
    }
    // Initialize
    const candidateActivities = new CandidateActivities();
  
