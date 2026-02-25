let totalHours = [];
let subjects = [];
const MAX_HOURS = 6;

function addSubject() {
    const subject = document.getElementById("subject").value.trim();
    const difficulty = parseInt(document.getElementById("difficulty").value);
    const deadline = parseInt(document.getElementById("deadline").value);

    if (!subject || !deadline) {
        alert("Please fill in all fields");
        return;
    }

    // Smart Estimation based on difficulty
    const baseHours = { 1: 4, 2: 8, 3: 12 };
    let estimatedHours = baseHours[difficulty];
    let hoursPerDay = estimatedHours / deadline;

    // Store subject with difficulty for coloring
    const subjectData = {
        name: subject,
        difficulty: difficulty,
        hours: estimatedHours,
        deadline: deadline
    };
    subjects.push(subjectData);

    for (let i = 0; i < deadline; i++) {
        totalHours[i] = (totalHours[i] || 0) + hoursPerDay;
    }

    // Clear input fields
    document.getElementById("subject").value = "";
    document.getElementById("deadline").value = "";

    displaySubjects();
    displaySchedule();
    saveData();
}

function displaySubjects() {
    const subjectDiv = document.getElementById("subjects");
    
    if (subjects.length === 0) {
        subjectDiv.innerHTML = '<p class="empty-state">No subjects added yet. Start by adding your first subject!</p>';
        return;
    }

    subjectDiv.innerHTML = subjects.map((sub, index) => {
        const icons = { 1: 'fa-star', 2: 'fa-star-half-alt', 3: 'fa-star' };
        const colors = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
        return `
            <div class="subject-chip" style="animation-delay: ${index * 0.1}s">
                <i class="fas ${icons[sub.difficulty]}" style="color: ${colors[sub.difficulty]}"></i>
                ${sub.name}
                <span class="delete-subject" onclick="removeSubject(${index})">
                    <i class="fas fa-times"></i>
                </span>
            </div>
        `;
    }).join('');
}

function removeSubject(index) {
    if (confirm(`Are you sure you want to remove "${subjects[index].name}"?`)) {
        subjects.splice(index, 1);
        recalculateSchedule();
        saveData();
    }
}

function recalculateSchedule() {
    totalHours = [];
    subjects.forEach(sub => {
        let days = sub.deadline || Math.max(1, Math.ceil(sub.hours / 2));
        let hoursPerDay = sub.hours / days;
        
        for (let i = 0; i < days; i++) {
            totalHours[i] = (totalHours[i] || 0) + hoursPerDay;
        }
    });
    displaySubjects();
    displaySchedule();
}

function displaySchedule() {
    const scheduleDiv = document.getElementById("schedule");
    const warningText = document.getElementById("warning");
    const motivation = document.getElementById("motivation");

    scheduleDiv.innerHTML = "";
    warningText.innerHTML = "";
    motivation.innerHTML = "";

    if (totalHours.length === 0) {
        scheduleDiv.innerHTML = '<p class="empty-state">Your study schedule will appear here.</p>';
        return;
    }

    totalHours.forEach((hours, index) => {
        let percent = Math.min((hours / MAX_HOURS) * 100, 100);
        
        let barClass = "bar";
        let difficultyClass = "easy";
        
        if (hours > MAX_HOURS) {
            barClass += " overload";
            difficultyClass = "overload";
            warningText.innerHTML = "⚠️ Study overload detected! Take 15-30 min breaks between sessions.";
        } else if (hours >= 4) {
            barClass += " medium";
            difficultyClass = "medium";
        } else if (hours >= 2) {
            barClass += " easy";
            difficultyClass = "easy";
        }

        barClass += " " + difficultyClass;

        let dayDiv = document.createElement("div");
        dayDiv.className = "day";
        dayDiv.style.animationDelay = `${index * 0.1}s`;
        dayDiv.innerHTML = `
            <div class="day-header">
                <span class="day-title"><i class="fas fa-clock"></i> Day ${index + 1}</span>
                <span class="day-hours" style="color: ${getHoursColor(hours)}">${hours.toFixed(1)} hrs</span>
            </div>
            <div class="progress">
                <div class="${barClass}" style="width: ${percent}%"></div>
            </div>
        `;

        scheduleDiv.appendChild(dayDiv);
    });

    if (totalHours.length > 0) {
        motivation.innerHTML = `💡 ${getMotivation()}`;
    }
}

function getHoursColor(hours) {
    if (hours > MAX_HOURS) return '#ef4444';
    if (hours >= 4) return '#f59e0b';
    return '#10b981';
}

function resetPlan() {
    if (confirm("Are you sure you want to reset the entire plan?")) {
        totalHours = [];
        subjects = [];
        document.getElementById("subjects").innerHTML = '<p class="empty-state">No subjects added yet. Start by adding your first subject!</p>';
        document.getElementById("schedule").innerHTML = '<p class="empty-state">Your study schedule will appear here.</p>';
        document.getElementById("warning").innerHTML = "";
        document.getElementById("motivation").innerHTML = "";
        localStorage.clear();
    }
}

function saveData() {
    const data = {
        totalHours: totalHours,
        subjects: subjects
    };
    localStorage.setItem("studyData", JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem("studyData");
    if (saved) {
        const data = JSON.parse(saved);
        totalHours = data.totalHours || [];
        subjects = data.subjects || [];
        displaySubjects();
        displaySchedule();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    
    // Update toggle button icon
    const btn = document.querySelector('.toggle-btn');
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        span.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        span.textContent = 'Dark Mode';
    }
}

function getMotivation() {
    const quotes = [
        "Small progress is still progress. Keep going! 🚀",
        "Discipline beats motivation. Stay consistent! 💪",
        "Consistency builds success. You're on the right track! 🎯",
        "Study now, shine later. Your future self will thank you! ✨",
        "Focus on the goal, not the obstacle. You've got this! 🔥",
        "Every expert was once a beginner. Keep learning! 📖",
        "Your only limit is your mind. Push forward! 🌟"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

window.onload = loadData;
