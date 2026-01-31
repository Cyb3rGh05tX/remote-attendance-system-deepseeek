const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwO7rRBaZT_PvPDNVd7HHyTvldn9n3abxFYikvJ_pHoILH27XDWO6hZb88HOH8Xw-Tr/exec";

let currentUser = null;

// ===== Utility Functions =====

// Get current UTC time for storing in Google Sheet
function getUTCISOTime() {
    return new Date().toISOString(); // YYYY-MM-DDTHH:MM:SS.sssZ
}

// Format ISO time to local readable string
function formatLocalTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { hour12: false }); // YYYY-MM-DD HH:MM:SS
}

// ===== Login =====
async function login() {
    const userID = document.getElementById("userID").value.trim();
    if(!userID) { alert("Enter User ID"); return; }

    const res = await fetch(WEB_APP_URL + "?sheet=Users");
    const users = await res.json();

    const user = users.find(u => u[0] === userID);
    if(user) {
        currentUser = { id: user[0], name: user[1] };
        document.getElementById("empName").innerText = currentUser.name;
        document.getElementById("employeeArea").style.display = "block";
        document.getElementById("loginArea").style.display = "none";
    } else {
        alert("Invalid User ID");
    }
}

// ===== Attendance =====
async function updateAttendance(type) {
    const dateISO = getUTCISOTime();

    // Fetch existing attendance
    const res = await fetch(WEB_APP_URL + "?sheet=Attendance");
    const data = await res.json();

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let existingRow = data.find(r => r[0] === currentUser.id && r[1].split("T")[0] === todayStr);

    if(existingRow){
        // TODO: Apps Script update function can replace this row
        alert("Attendance already exists for today. Row update will fix duplicate.");
    } else {
        // Add new row
        const payload = [currentUser.id, dateISO, type==='in'?dateISO:"", type==='out'?dateISO:"", currentUser.name];
        await fetch(WEB_APP_URL + "?sheet=Attendance", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        alert(`${type==='in' ? 'Check-In' : 'Check-Out'} recorded: ${formatLocalTime(dateISO)}`);
    }
}

function checkIn(){ updateAttendance('in'); }
function checkOut(){ updateAttendance('out'); }

// ===== Task Update =====
async function updateTask() {
    const taskTitle = document.getElementById("taskTitle").value.trim();
    const taskStatus = document.getElementById("taskStatus").value;
    const dateISO = getUTCISOTime();

    if(!taskTitle) { alert("Enter Task Title"); return; }

    const payload = ["task_" + Date.now(), currentUser.id, taskTitle, taskStatus, dateISO, currentUser.name];
    await fetch(WEB_APP_URL + "?sheet=Tasks", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    alert("Task updated: " + taskTitle + " at " + formatLocalTime(dateISO));
    document.getElementById("taskTitle").value = "";
}
