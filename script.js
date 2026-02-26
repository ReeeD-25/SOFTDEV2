 // ==================== SCROLL TO PLANNER ====================
        function scrollToPlanner() {
            const plannerSection = document.querySelector('.planner-section');
            plannerSection.scrollIntoView({ behavior: 'smooth' });
        }

        // ==================== TAB MANAGEMENT ====================
        function switchTab(event, tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            event.target.closest('.tab-btn').classList.add('active');
        }

        // ==================== DARK MODE ====================
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            document.querySelector('nav').classList.toggle('dark-mode');
            document.querySelector('.hero').classList.toggle('dark-mode');
            document.querySelector('.planner-section').classList.toggle('dark-mode');
            document.querySelector('.about-section').classList.toggle('dark-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'true');
            } else {
                localStorage.setItem('darkMode', 'false');
            }
        }

        // ==================== TAB 1: DETAILED TASK PLANNER ====================
        let tasks = [];

        function addTask(event) {
            event.preventDefault();
            const task = {
                id: Date.now(),
                name: document.getElementById('taskName').value,
                course: document.getElementById('course').value,
                dueDate: document.getElementById('dueDate').value,
                estimatedHours: parseFloat(document.getElementById('estimatedHours').value),
                priority: document.getElementById('priority').value,
                description: document.getElementById('description').value
            };
            tasks.push(task);
            sortTasks();
            renderTasks();
            generateSchedule();
            updateStats();
            document.getElementById('taskForm').reset();
            saveData();
        }

        function sortTasks() {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            tasks.sort((a, b) => {
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                if (dateA !== dateB) return dateA - dateB;
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        }

        function renderTasks() {
            const tasksList = document.getElementById('tasksList');
            if (tasks.length === 0) {
                tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add your first task to get started!</div>';
                return;
            }
            tasksList.innerHTML = tasks.map(task => `
                <div class="item-card">
                    <div class="item-header">
                        <div class="item-title">${escapeHtml(task.name)}</div>
                        <div class="badge badge-${task.priority}">${task.priority}</div>
                    </div>
                    <div class="item-meta">
                        <span>📚 ${escapeHtml(task.course)}</span>
                        <span>📅 ${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>⏱️ ${task.estimatedHours}h</span>
                    </div>
                    ${task.description ? `<div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.8rem;">${escapeHtml(task.description)}</div>` : ''}
                    <div class="item-actions">
                        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        function deleteTask(id) {
            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
            generateSchedule();
            updateStats();
            saveData();
        }

        function updateStats() {
            const totalTasks = tasks.length;
            const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
            let daysUntilDeadline = 0;
            if (tasks.length > 0) {
                const latestDate = new Date(Math.max(...tasks.map(t => new Date(t.dueDate))));
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                daysUntilDeadline = Math.ceil((latestDate - today) / (1000 * 60 * 60 * 24));
            }
            const avgDaily = daysUntilDeadline > 0 ? (totalHours / daysUntilDeadline).toFixed(1) : 0;
            document.getElementById('totalTasks').textContent = totalTasks;
            document.getElementById('totalHours').textContent = totalHours.toFixed(1);
            document.getElementById('avgDaily').textContent = avgDaily + 'h';
        }

        function generateSchedule() {
            const schedulePlan = document.getElementById('schedulePlan');
            const warningTask = document.getElementById('warningTask');
            const motivationTask = document.getElementById('motivationTask');
            warningTask.style.display = 'none';
            motivationTask.style.display = 'none';
            if (tasks.length === 0) {
                schedulePlan.innerHTML = '<div class="empty-state">Add tasks to generate your personalized schedule</div>';
                return;
            }
            const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
            const latestDate = new Date(Math.max(...tasks.map(t => new Date(t.dueDate))));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntilDeadline = Math.ceil((latestDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= 0) {
                schedulePlan.innerHTML = '<div class="empty-state">⚠️ Your deadline has passed! Update your task dates.</div>';
                return;
            }
            let scheduleHTML = '';
            for (let i = 0; i < Math.min(7, daysUntilDeadline); i++) {
                const currentDate = new Date(today);
                currentDate.setDate(currentDate.getDate() + i);
                const dateString = currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const hoursPerDay = Math.ceil(totalHours / daysUntilDeadline);
                const studyStartHour = 14;
                const studyEndHour = 21;
                const availableHours = studyEndHour - studyStartHour;
                const dailyHours = Math.min(hoursPerDay, availableHours);
                let dayTasks = [];
                let dayHours = dailyHours;
                for (let task of tasks) {
                    if (dayHours <= 0) break;
                    const allocatedHours = Math.min(task.estimatedHours, dayHours);
                    dayTasks.push({ name: task.name, hours: allocatedHours, priority: task.priority });
                    dayHours -= allocatedHours;
                }
                let currentHour = studyStartHour;
                let slotsHTML = '';
                for (let task of dayTasks) {
                    const startTime = `${currentHour.toString().padStart(2, '0')}:00`;
                    const endHour = currentHour + Math.ceil(task.hours);
                    const duration = `${task.hours.toFixed(1)}h`;
                    slotsHTML += `
                        <div class="time-slot">
                            <div class="slot-time">${startTime}</div>
                            <div class="slot-task">${escapeHtml(task.name)}</div>
                            <div class="slot-duration">${duration}</div>
                        </div>
                    `;
                    currentHour += Math.ceil(task.hours);
                }
                if (slotsHTML) {
                    scheduleHTML += `
                        <div class="day-block">
                            <div class="day-title">📆 ${dateString}</div>
                            <div class="time-slots">${slotsHTML}</div>
                        </div>
                    `;
                }
            }
            schedulePlan.innerHTML = scheduleHTML || '<div class="empty-state">No schedule generated</div>';
            if (totalHours > 0) {
                motivationTask.innerHTML = `💡 ${getMotivation()}`;
                motivationTask.style.display = 'block';
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ==================== TAB 2: QUICK SCHEDULER ====================
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
            const baseHours = { 1: 4, 2: 8, 3: 12 };
            let estimatedHours = baseHours[difficulty];
            let hoursPerDay = estimatedHours / deadline;
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
            document.getElementById("subject").value = "";
            document.getElementById("deadline").value = "";
            displaySubjects();
            displaySchedule();
            saveData();
        }

        function displaySubjects() {
            const subjectDiv = document.getElementById("subjects");
            if (subjects.length === 0) {
                subjectDiv.innerHTML = '<div class="empty-state" style="width: 100%;">No subjects added yet. Start by adding your first subject!</div>';
                return;
            }
            subjectDiv.innerHTML = subjects.map((sub, index) => {
                const icons = { 1: '😎', 2: '⚔️', 3: '🔥' };
                const colors = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
                return `
                    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: linear-gradient(135deg, rgba(13, 126, 126, 0.1) 0%, rgba(26, 159, 160, 0.1) 100%); border: 2px solid rgba(13, 126, 126, 0.2); border-radius: 50px; font-size: 0.95rem; font-weight: 600; color: var(--primary); animation: fadeIn 0.4s ease; animation-delay: ${index * 0.1}s;">
                        ${icons[sub.difficulty]}
                        ${sub.name}
                        <span style="cursor: pointer; opacity: 0.6; transition: opacity 0.2s; margin-left: 4px;" onclick="removeSubject(${index})">
                            ✕
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
            warningText.style.display = 'none';
            motivation.style.display = 'none';
            if (totalHours.length === 0) {
                scheduleDiv.innerHTML = '<div class="empty-state">Your study schedule will appear here</div>';
                return;
            }
            let html = '';
            totalHours.forEach((hours, index) => {
                let percent = Math.min((hours / MAX_HOURS) * 100, 100);
                let barClass = "bar";
                if (hours > MAX_HOURS) {
                    barClass = "bar bar-hard";
                    warningText.innerHTML = "⚠️ Study overload detected! Take 15-30 min breaks between sessions.";
                    warningText.style.display = 'block';
                } else if (hours >= 4) {
                    barClass = "bar bar-medium";
                } else if (hours >= 2) {
                    barClass = "bar bar-easy";
                }
                html += `
                    <div class="day-block" style="animation-delay: ${index * 0.1}s;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span style="font-weight: 600; color: var(--text-primary);">⏰ Day ${index + 1}</span>
                            <span style="font-weight: 600; color: ${getHoursColor(hours)}">${hours.toFixed(1)} hrs</span>
                        </div>
                        <div class="progress-bar">
                            <div class="${barClass}" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            });
            scheduleDiv.innerHTML = html;
            if (totalHours.length > 0) {
                motivation.innerHTML = `💡 ${getMotivation()}`;
                motivation.style.display = 'block';
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
                document.getElementById("subjects").innerHTML = '<div class="empty-state" style="width: 100%;">No subjects added yet. Start by adding your first subject!</div>';
                document.getElementById("schedule").innerHTML = '<div class="empty-state">Your study schedule will appear here</div>';
                document.getElementById("warning").style.display = 'none';
                document.getElementById("motivation").style.display = 'none';
                localStorage.removeItem("smartStudyData");
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

        function saveData() {
            const data = { tasks: tasks, totalHours: totalHours, subjects: subjects };
            localStorage.setItem("smartStudyData", JSON.stringify(data));
        }

        function loadData() {
            const saved = localStorage.getItem("smartStudyData");
            if (saved) {
                const data = JSON.parse(saved);
                tasks = data.tasks || [];
                totalHours = data.totalHours || [];
                subjects = data.subjects || [];
                renderTasks();
                displaySubjects();
                displaySchedule();
                updateStats();
            }
            const darkModeSaved = localStorage.getItem('darkMode');
            if (darkModeSaved === 'true') {
                document.body.classList.add('dark-mode');
                document.querySelector('nav').classList.add('dark-mode');
                document.querySelector('.hero').classList.add('dark-mode');
                document.querySelector('.planner-section').classList.add('dark-mode');
                document.querySelector('.about-section').classList.add('dark-mode');
            }
        }

        document.getElementById('dueDate').min = new Date().toISOString().split('T')[0];
        window.onload = loadData;
