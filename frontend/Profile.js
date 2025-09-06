document.addEventListener('DOMContentLoaded', function () {
    let calendarEl = document.getElementById('calendar');
  
    let calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 500,
      events: [
        {
          title: 'Technical Interview',
          start: '2025-09-10T10:00:00',
          end: '2025-09-10T11:00:00',
          color: '#4a90e2'
        },
        {
          title: 'HR Interview',
          start: '2025-09-12T14:00:00',
          end: '2025-09-12T15:00:00',
          color: '#1a73e8'
        },
        {
          title: 'Final Round',
          start: '2025-09-15T16:00:00',
          end: '2025-09-15T17:00:00',
          color: '#357ab8'
        }
      ]
    });
  
    calendar.render();
  });
  