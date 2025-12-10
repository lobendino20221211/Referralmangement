// API Configuration
const API_BASE = 'http://localhost:3000/api';
let countdownInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAvailability();
    setupEventListeners();
    loadThisWeek();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Form submission
    document.getElementById('prescribeForm').addEventListener('submit', handlePrescribe);
}

// Check if prescription is allowed
async function checkAvailability() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/check-availability`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        updateStatusBanner(data);

        if (!data.allowed) {
            document.getElementById('submitBtn').disabled = true;
            startCountdown(data.timeUntilNext);
        }
    } catch (error) {
        console.error('Error checking availability:', error);
        showError('Failed to check availability. Please try again.');
    }
}

// Update status banner
function updateStatusBanner(data) {
    const banner = document.getElementById('statusBanner');
    
    if (data.allowed) {
        banner.className = 'status-banner available';
        banner.innerHTML = `
            <h2>✅ Ready to Prescribe</h2>
            <p>You can create a prescription for this week!</p>
            <p class="status-date">Week of ${new Date().toLocaleDateString()}</p>
        `;
    } else {
        const lastDate = new Date(data.lastPrescriptionDate);
        banner.className = 'status-banner blocked';
        banner.innerHTML = `
            <h2>⛔ Weekly Limit Reached</h2>
            <p>A prescription has already been created this week</p>
            <div class="countdown" id="countdown">Calculating...</div>
            <p class="countdown-label">Until next prescription</p>
            <p class="status-info">
                Last prescription: ${lastDate.toLocaleString()}<br>
                Current week: ${new Date(data.currentWeek.start).toLocaleDateString()} - 
                ${new Date(data.currentWeek.end).toLocaleDateString()}
            </p>
        `;
    }
}

// Start countdown timer
function startCountdown(timeUntil) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = new Date();
        const target = new Date(timeUntil.nextMonday);
        const diff = target - now;

        if (diff <= 0) {
            clearInterval(countdownInterval);
            location.reload();
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Load content if needed
    if (tabName === 'current') loadThisWeek();
    if (tabName === 'history') loadHistory();
}

// Load this week's prescription
async function loadThisWeek() {
    const content = document.getElementById('currentWeekContent');
    content.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/this-week`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success && data.prescription) {
            content.innerHTML = renderPrescription(data.prescription);
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>📭 No Prescription Yet</h3>
                    <p>Create one in the "New Prescription" tab!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading this week:', error);
        content.innerHTML = '<div class="error-message">Failed to load data</div>';
    }
}

// Load history
async function loadHistory() {
    const content = document.getElementById('historyContent');
    content.innerHTML = '<div class="loading-spinner"></div><p>Loading...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.prescriptions.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>📭 No History Yet</h3>
                    <p>Your prescription history will appear here</p>
                </div>
            `;
            return;
        }

        let html = `<h3 class="history-title">📚 Past Prescriptions (${data.total})</h3>`;
        
        data.prescriptions.forEach(p => {
            const date = new Date(p.timestamp);
            html += `
                <div class="history-item" onclick='showHistoryDetail(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                    <div class="history-header">
                        <span class="history-week">Week ${p.week} (${p.year})</span>
                        <span class="history-date">${date.toLocaleDateString()}</span>
                    </div>
                    <div class="history-issue">${p.issue}</div>
                    <div class="history-meta">
                        <span class="severity-badge severity-${p.solution.severity}">${p.solution.severity.toUpperCase()}</span>
                        <span class="history-cost">Cost: $${p.cost}</span>
                    </div>
                </div>
            `;
        });

        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading history:', error);
        content.innerHTML = '<div class="error-message">Failed to load history</div>';
    }
}

// Handle prescription form submission
async function handlePrescribe(e) {
    e.preventDefault();

    const issue = document.getElementById('issue').value;
    const context = {
        affectedGrade: document.getElementById('affectedGrade').value,
        numberOfCases: document.getElementById('numberOfCases').value,
        trend: document.getElementById('trend').value,
        category: document.getElementById('category').value
    };

    // Remove empty context fields
    Object.keys(context).forEach(key => {
        if (!context[key]) delete context[key];
    });

    showLoading();

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai-prescriptions/prescribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ issue, context })
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            showResults(result);
            checkAvailability(); // Refresh status
            
            // Show success message
            showSuccess('✅ Weekly prescription created successfully!');
            
            // Clear form
            document.getElementById('prescribeForm').reset();
        } else if (result.blocked) {
            showError(result.message);
        } else {
            showError(result.error || 'Failed to create prescription');
        }
    } catch (error) {
        hideLoading();
        console.error('Error creating prescription:', error);
        showError('Failed to create prescription. Please try again.');
    }
}

// Render prescription
function renderPrescription(p) {
    const date = new Date(p.timestamp);
    let html = `
        <div class="prescription-card">
            <div class="week-info">
                <strong>📅 Week ${p.week} (${p.year})</strong>
                <span class="week-date">Prescribed on ${date.toLocaleString()}</span>
            </div>

            <h2 class="issue-title">📋 ${p.issue}</h2>

            <span class="severity-badge severity-${p.solution.severity}">
                🚨 ${p.solution.severity.toUpperCase()} Severity
            </span>

            <div class="root-cause">
                <strong>📌 Root Cause:</strong>
                <p>${p.solution.root_cause}</p>
            </div>

            <h3>💡 Solutions</h3>
            ${p.solution.solutions.map((sol, i) => `
                <div class="solution-card">
                    <h4>${i + 1}. ${sol.title}</h4>
                    <ul class="steps-list">
                        ${sol.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                    <div class="impact">
                        <strong>Impact:</strong> ${sol.impact}
                    </div>
                </div>
            `).join('')}
    `;

    if (p.solution.quick_wins && p.solution.quick_wins.length > 0) {
        html += `
            <div class="quick-wins">
                <h4>⚡ Quick Wins</h4>
                <ul>
                    ${p.solution.quick_wins.map(win => `<li>${win}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// Show history detail in modal
function showHistoryDetail(prescription) {
    const modal = document.getElementById('resultsModal');
    const content = document.getElementById('resultsContent');
    content.innerHTML = renderPrescription(prescription);
    modal.style.display = 'block';
}

// Show results in modal
function showResults(result) {
    const modal = document.getElementById('resultsModal');
    const content = document.getElementById('resultsContent');
    content.innerHTML = renderPrescription(result);
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('resultsModal').style.display = 'none';
}

// Show/hide loading
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Show success message
function showSuccess(message) {
    // Use your existing custom alert system
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(message, 'success');
    } else {
        alert(message);
    }
}

// Show error message
function showError(message) {
    // Use your existing custom alert system
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(message, 'error');
    } else {
        alert(message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('resultsModal');
    if (event.target === modal) {
        closeModal();
    }
}

