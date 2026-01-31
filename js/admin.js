const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwO7rRBaZT_PvPDNVd7HHyTvldn9n3abxFYikvJ_pHoILH27XDWO6hZb88HOH8Xw-Tr/exec";

async function fetchData(sheetName) {
  const res = await fetch(WEB_APP_URL + "?sheet=" + sheetName);
  return await res.json();
}

function getDateFilter(period) {
  const today = new Date();
  let startDate;
  if(period === "daily") {
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  } else if(period === "weekly") {
    const day = today.getDay();
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
  } else if(period === "monthly") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  return startDate;
}

async function initDashboard() {
  const period = document.getElementById("period").value;
  const startDate = getDateFilter(period);

  const attendance = await fetchData("Attendance");
  const tasks = await fetchData("Tasks");

  const filteredAttendance = attendance.filter(row => new Date(row[1]) >= startDate);
  const filteredTasks = tasks.filter(row => new Date(row[4]) >= startDate);

  // Attendance summary
  const attendanceMap = {};
  filteredAttendance.forEach(row => {
    const user = row[0];
    if(!attendanceMap[user]) attendanceMap[user] = 0;
    if(row[2]) attendanceMap[user]++;
  });

  const labels = Object.keys(attendanceMap);
  const data = Object.values(attendanceMap);

  new Chart(document.getElementById("attendanceChart"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Check-Ins',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Task summary
  const statusCount = { "Not Started": 0, "In Progress": 0, "Completed": 0 };
  filteredTasks.forEach(row => {
    const status = row[3];
    if(statusCount[status] !== undefined) statusCount[status]++;
  });

  new Chart(document.getElementById("taskChart"), {
    type: 'pie',
    data: {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: ['#FF6384','#36A2EB','#FFCE56']
      }]
    },
    options: { responsive: true }
  });
}

// Export CSV
async function exportToCSV() {
  const attendance = await fetchData("Attendance");
  const tasks = await fetchData("Tasks");

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Attendance\nUserID,Date,CheckIn,CheckOut\n";
  attendance.forEach(row => { csvContent += row.join(",") + "\n"; });
  csvContent += "\nTasks\nTaskID,UserID,TaskTitle,Status,LastUpdated\n";
  tasks.forEach(row => { csvContent += row.join(",") + "\n"; });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

initDashboard();
