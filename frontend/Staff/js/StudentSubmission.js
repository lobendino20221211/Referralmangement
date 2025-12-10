// StudentSubmissions.js - Handle student self-report submissions

// Store loaded categories for validation
let availableCategories = [];

// ====================================
// AUTO-DELETE CONFIGURATION
// ====================================
const STALE_DAYS_LIMIT = 3; // Days before auto-deletion

// ====================================
// NAVIGATION & PROFILE FUNCTIONS
// ====================================

// Highlight active nav item
function initializeNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    if (itemHref === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Profile dropdown functionality
function initializeProfileDropdown() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", (event) => {
      if (!event.target.closest("#profileDropdown")) {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// Load user profile and display in header
async function loadUserProfile() {
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      // Update profile image if available
      const profileImage = document.querySelector(".profile-image");
      if (profileImage && userProfile.data.profileImage) {
        profileImage.src = userProfile.data.profileImage;
      }
      
      // You can add more profile data display here if needed
      console.log('User profile loaded:', userProfile.data.fullName || userProfile.data.username);
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

// ====================================
// LOAD CATEGORIES DYNAMICALLY
// ====================================
async function loadCategories() {
  try {
    const response = await apiClient.getCategories();
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      availableCategories = categories;
      populateCategoryDropdown(categories);
    } else {
      console.error('Failed to load categories:', response.error);
      availableCategories = [];
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    availableCategories = [];
  }
}

function populateCategoryDropdown(categories) {
  const categorySelect = document.getElementById('view-category');
  
  if (!categorySelect) return;
  
  categorySelect.innerHTML = '<option value="">Select Category (Optional)</option>';
  
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
}

// ====================================
// AUTO-DELETE STALE SUBMISSIONS
// ====================================

// Check and delete stale submissions (older than 3 days without update)
async function checkAndDeleteStaleSubmissions() {
  try {
    console.log('🔍 Checking for stale submissions...');
    
    // Get all submissions
    const response = await apiClient.getStudentSubmissions({});
    
    if (!response.success) {
      console.error('Failed to fetch submissions for stale check');
      return;
    }
    
    const submissions = response.data || [];
    const now = new Date();
    const staleThreshold = STALE_DAYS_LIMIT * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    
    let deletedCount = 0;
    
    for (const submission of submissions) {
      // Use updatedAt if available, otherwise use createdAt
      const lastUpdateDate = new Date(submission.updatedAt || submission.createdAt);
      const timeSinceUpdate = now - lastUpdateDate;
      
      // If submission hasn't been updated in 3 days, delete it
      if (timeSinceUpdate > staleThreshold) {
        console.log(`🗑️ Auto-deleting stale submission: ${submission.submissionId} (Last update: ${lastUpdateDate.toLocaleDateString()})`);
        
        try {
          await apiClient.deleteStudentSubmission(submission._id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete stale submission ${submission._id}:`, error);
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ Auto-deleted ${deletedCount} stale submission(s)`);
      showAlert(`${deletedCount} stale submission(s) automatically removed`, 'info');
      // Reload the submissions table
      loadSubmissions();
    } else {
      console.log('✅ No stale submissions found');
    }
    
  } catch (error) {
    console.error('Error checking stale submissions:', error);
  }
}

// Load all student submissions
async function loadSubmissions() {
  try {
    // Show loading indicator
    const tbody = document.getElementById('submissionsTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading submissions...</td></tr>';
    
    const status = document.getElementById('statusFilter')?.value || 'all';
    const severity = document.getElementById('severityFilter')?.value || 'all';
    
    // Build filters object
    const filters = {};
    if (status !== 'all') filters.status = status;
    if (severity !== 'all') filters.severity = severity;
    
    console.log('📡 Fetching student submissions with filters:', filters);
    
    // Use the API client method specifically for student submissions
    const response = await apiClient.getStudentSubmissions(filters);
    
    console.log('📥 Response received:', response);
    
    if (response.success) {
      const submissions = response.data || [];
      console.log(`✅ Loaded ${submissions.length} submissions`);
      displaySubmissions(submissions);
    } else {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #ef4444;">Failed to load submissions: ${response.error || response.message}</td></tr>`;
      console.error('❌ Failed to load submissions:', response);
      showAlert(`Failed to load submissions: ${response.error || response.message}`, 'error');
    }
  } catch (error) {
    console.error('❌ Error loading submissions:', error);
    const tbody = document.getElementById('submissionsTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: #ef4444;">Error loading submissions. Check console for details.</td></tr>';
    showAlert('Network error: ' + error.message, 'error');
  }
}

// Display submissions in table with days remaining
function displaySubmissions(submissions) {
  const tbody = document.getElementById('submissionsTableBody');
  
  if (!submissions || submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No submissions found</td></tr>';
    return;
  }
  
  console.log(`Displaying ${submissions.length} submissions`);
  
  const now = new Date();
  const staleThreshold = STALE_DAYS_LIMIT * 24 * 60 * 60 * 1000;
  
  tbody.innerHTML = submissions.map(sub => {
    // Calculate days remaining
    const lastUpdateDate = new Date(sub.updatedAt || sub.createdAt);
    const timeSinceUpdate = now - lastUpdateDate;
    const daysRemaining = Math.max(0, Math.ceil((staleThreshold - timeSinceUpdate) / (24 * 60 * 60 * 1000)));
    
    // Determine warning level
    let warningClass = '';
    let warningText = '';
    if (daysRemaining === 0) {
      warningClass = 'warning-critical';
      warningText = 'Expires today';
    } else if (daysRemaining === 1) {
      warningClass = 'warning-high';
      warningText = '1 day left';
    } else if (daysRemaining === 2) {
      warningClass = 'warning-medium';
      warningText = '2 days left';
    } else {
      warningClass = 'warning-low';
      warningText = `${daysRemaining} days left`;
    }
    
    // Check if status is "Pending" - if so, show blank severity
    const isPending = (sub.status || '').toLowerCase() === 'pending';
    const severityDisplay = isPending 
      ? '<span style="color: #9ca3af;">—</span>' 
      : `<span class="severity ${(sub.severity || 'low').toLowerCase()}">${sub.severity || 'Low'}</span>`;
    
    return `
      <tr onclick="viewSubmission('${sub._id}')" style="cursor: pointer;">
        <td>${sub.submissionId || 'N/A'}</td>
        <td>${sub.studentId || 'Unknown'}</td>
        <td>${sub.studentName || 'Anonymous'}</td>
        <td>${sub.level || 'Unknown'}</td>
        <td>${sub.grade || 'Unknown'}</td>
        <td><span class="status ${(sub.status || 'pending').toLowerCase().replace(/\s+/g, '-')}">${sub.status || 'Pending'}</span></td>
        <td>${severityDisplay}</td>
        <td>${new Date(sub.createdAt).toLocaleDateString()}</td>
        <td><span class="days-remaining ${warningClass}">${warningText}</span></td>
      </tr>
    `;
  }).join('');
}

// Search functionality
function setupSearch() {
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (!searchInput) return;
  
  let debounceTimer;
  
  searchInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
      const searchTerm = this.value.toLowerCase().trim();
      filterTable(searchTerm);
    }, 300);
  });
}

// Filter table based on search term
function filterTable(searchTerm) {
  const rows = document.querySelectorAll('#submissionsTableBody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// View and edit submission details
async function viewSubmission(submissionId) {
  try {
    console.log('📋 Fetching submission details:', submissionId);
    
    // Use the API client method
    const response = await apiClient.getStudentSubmission(submissionId);
    
    console.log('📥 Submission details received:', response);
    
    if (response.success) {
      const submission = response.data;
      
      // Fill in the modal with submission data
      document.getElementById('viewSubmissionId').value = submissionId;
      document.getElementById('view-submissionId-display').value = submission.submissionId || 'N/A';
      document.getElementById('view-studentId').value = submission.studentId || '';
      document.getElementById('view-studentName').value = submission.studentName || '';
      document.getElementById('view-level').value = submission.level || '';
      document.getElementById('view-grade').value = submission.grade || '';
      document.getElementById('view-status').value = submission.status || 'Pending';
      document.getElementById('view-severity').value = submission.severity || 'Low';
      document.getElementById('view-concern').value = submission.concern || '';
      document.getElementById('view-date').value = new Date(submission.createdAt).toISOString().split('T')[0];
      document.getElementById('view-notes').value = submission.notes || '';
      
      // Handle category
      const categorySelect = document.getElementById('view-category');
      if (categorySelect) {
        const submissionCategory = submission.category || '';
        
        const categoryContainer = categorySelect.parentElement;
        const existingWarning = categoryContainer.querySelector('.category-warning');
        if (existingWarning) {
          existingWarning.remove();
        }
        
        const categoryExists = availableCategories.some(
          cat => cat.name === submissionCategory
        );
        
        if (categoryExists && submissionCategory) {
          categorySelect.value = submissionCategory;
        } else {
          categorySelect.value = '';
          if (submissionCategory) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'category-warning';
            warningDiv.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 4px;';
            warningDiv.innerHTML = `⚠️ Previous category "${submissionCategory}" no longer exists. You can leave this empty or select a new category.`;
            categoryContainer.appendChild(warningDiv);
          }
        }
      }
      
      // Show edit badges for editable fields
      const badges = ['studentIdEditBadge', 'levelEditBadge', 'gradeEditBadge'];
      badges.forEach(badgeId => {
        const badge = document.getElementById(badgeId);
        if (badge) badge.style.display = 'inline';
      });
      
      // Show modal
      document.getElementById('viewSubmissionModal').style.display = 'block';
      
      // Initialize autocomplete for student ID
      initStudentIdAutocomplete();
    }
  } catch (error) {
    console.error('Failed to load submission details:', error);
    showAlert('Failed to load submission details: ' + error.message, 'error');
  }
}

// Initialize autocomplete for Student ID
function initStudentIdAutocomplete() {
  const studentIdInput = document.getElementById('view-studentId');
  const autocompleteList = document.getElementById('studentIdAutocomplete');
  
  if (!studentIdInput || !autocompleteList) return;
  
  let debounceTimer;
  
  // Remove any existing listeners
  const newInput = studentIdInput.cloneNode(true);
  studentIdInput.parentNode.replaceChild(newInput, studentIdInput);
  
  newInput.addEventListener('input', function() {
    const query = this.value.trim();
    
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      autocompleteList.innerHTML = '';
      autocompleteList.style.display = 'none';
      return;
    }
    
    // Debounce the search
    debounceTimer = setTimeout(async () => {
      try {
        // Search for students using the API client method
        const response = await apiClient.searchStudents(query);
        
        if (response.success && response.data.length > 0) {
          displayAutocompleteResults(response.data);
        } else {
          autocompleteList.innerHTML = '<div class="autocomplete-item no-results">No students found</div>';
          autocompleteList.style.display = 'block';
        }
      } catch (error) {
        console.error('Autocomplete search failed:', error);
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
      }
    }, 300);
  });
  
  // Close autocomplete when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target !== newInput) {
      autocompleteList.style.display = 'none';
    }
  });
}

// Display autocomplete results
function displayAutocompleteResults(students) {
  const autocompleteList = document.getElementById('studentIdAutocomplete');
  
  autocompleteList.innerHTML = students.map(student => `
    <div class="autocomplete-item" onclick="selectStudent('${student._id}', '${student.studentId}', '${student.name}', '${student.level}', '${student.grade}')">
      <div class="autocomplete-id">${student.studentId}</div>
      <div class="autocomplete-name">${student.name}</div>
      <div class="autocomplete-details">${student.level} - ${student.grade}</div>
    </div>
  `).join('');
  
  autocompleteList.style.display = 'block';
}

// Select student from autocomplete
function selectStudent(id, studentId, name, level, grade) {
  // Fill in the form fields
  document.getElementById('view-studentId').value = studentId;
  document.getElementById('view-studentName').value = name;
  document.getElementById('view-level').value = level;
  document.getElementById('view-grade').value = grade;
  
  // Hide autocomplete
  document.getElementById('studentIdAutocomplete').style.display = 'none';
  
  // Show success message
  showAlert('Student information auto-filled', 'success');
}

// Update submission
async function updateSubmission(e) {
  e.preventDefault();
  
  const submissionId = document.getElementById('viewSubmissionId').value;
  
  const formData = {
    studentId: document.getElementById('view-studentId').value.trim() || null,
    studentName: document.getElementById('view-studentName').value.trim(),
    level: document.getElementById('view-level').value || null,
    grade: document.getElementById('view-grade').value.trim() || null,
    status: document.getElementById('view-status').value,
    severity: document.getElementById('view-severity').value,
    notes: document.getElementById('view-notes').value.trim() || null
  };
  
  // Handle category
  const categorySelect = document.getElementById('view-category');
  if (categorySelect) {
    const category = categorySelect.value;
    
    if (category && category !== '') {
      const categoryExists = availableCategories.some(cat => cat.name === category);
      if (!categoryExists) {
        showAlert('Selected category is not valid. Please select a valid category from the dropdown list.', 'error');
        return;
      }
      formData.category = category;
    } else {
      formData.category = null;
    }
  }
  
  try {
    console.log('✏️ Updating submission:', submissionId, 'with data:', formData);
    
    // Use the API client method
    const response = await apiClient.updateStudentSubmission(submissionId, formData);
    
    if (response.success) {
      showAlert('Submission updated successfully', 'success');
      closeViewModal();
      loadSubmissions();
    }
  } catch (error) {
    console.error('Failed to update submission:', error);
    showAlert('Failed to update submission: ' + error.message, 'error');
  }
}

// Delete submission
async function deleteSubmission(submissionId) {
  if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
    return;
  }
  
  try {
    console.log('🗑️ Deleting submission:', submissionId);
    
    // Use the API client method
    const response = await apiClient.deleteStudentSubmission(submissionId);
    
    if (response.success) {
      showAlert('Submission deleted successfully', 'success');
      loadSubmissions();
    }
  } catch (error) {
    console.error('Failed to delete submission:', error);
    showAlert('Failed to delete submission: ' + error.message, 'error');
  }
}

// Close view modal
function closeViewModal() {
  const modal = document.getElementById('viewSubmissionModal');
  if (modal) modal.style.display = 'none';
  
  const autocomplete = document.getElementById('studentIdAutocomplete');
  if (autocomplete) autocomplete.style.display = 'none';
  
  // Clear category warning if exists
  const categorySelect = document.getElementById('view-category');
  if (categorySelect) {
    const categoryContainer = categorySelect.parentElement;
    const warningDiv = categoryContainer.querySelector('.category-warning');
    if (warningDiv) {
      warningDiv.remove();
    }
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  // Remove any existing alerts
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) existingAlert.remove();
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(alert);
  
  // Remove after 3 seconds
  setTimeout(() => {
    alert.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}
// ===============================================
// APPLY URL FILTERS ON PAGE LOAD
// ===============================================

function applyUrlFiltersForSubmissions() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const status = urlParams.get('status');
  const statusFilter = document.getElementById('statusFilter');
  if (status && statusFilter) {
    statusFilter.value = status;
  }
  
  const severity = urlParams.get('severity');
  const severityFilter = document.getElementById('severityFilter');
  if (severity && severityFilter) {
    severityFilter.value = severity;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('StudentSubmissions page loaded');
  
  // Initialize navigation and profile
  initializeNavigation();
  initializeProfileDropdown();
  await loadUserProfile();
  
  // Load categories first, then submissions
  await loadCategories();
  applyUrlFiltersForSubmissions();
  loadSubmissions();
  
  // Check for stale submissions every 5 minutes
  setInterval(checkAndDeleteStaleSubmissions, 5 * 60 * 1000);
  
  // Setup search functionality
  setupSearch();
  
  // Filter listeners
  const statusFilter = document.getElementById('statusFilter');
  const severityFilter = document.getElementById('severityFilter');
  
  if (statusFilter) {
    statusFilter.addEventListener('change', loadSubmissions);
  }
  
  if (severityFilter) {
    severityFilter.addEventListener('change', loadSubmissions);
  }
  
  // Form submit listener
  const updateForm = document.getElementById('updateSubmissionForm');
  if (updateForm) {
    updateForm.addEventListener('submit', updateSubmission);
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelViewModalBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeViewModal);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('viewSubmissionModal');
    if (e.target === modal) {
      closeViewModal();
    }
  });
  
  // Add refresh button functionality if it exists
  const refreshBtn = document.querySelector('[onclick="loadSubmissions()"]');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      console.log('Manual refresh triggered');
      loadSubmissions();
    };
  }
});

// Add CSS animations and styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .autocomplete-container {
    position: relative;
  }
  
  .autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    display: none;
  }
  
  .autocomplete-item {
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .autocomplete-item:hover {
    background-color: #f9fafb;
  }
  
  .autocomplete-item.no-results {
    cursor: default;
    color: #6b7280;
    text-align: center;
  }
  
  .autocomplete-id {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }
  
  .autocomplete-name {
    color: #4b5563;
    margin-bottom: 2px;
  }
  
  .autocomplete-details {
    font-size: 12px;
    color: #9ca3af;
  }
  
  .edit-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #fef3c7;
    color: #92400e;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
  }
  
  .category-warning {
    color: #f59e0b;
    font-size: 12px;
    margin-top: 4px;
    padding: 8px;
    background-color: #fef3c7;
    border-radius: 4px;
    border-left: 3px solid #f59e0b;
  }
  
  .status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
  }
  
  .status.pending {
    color: #fbbf24;
  }
  
  .status.under-review {
    color: #3b82f6;
  }
  
  .status.for-consultation {
    color: #9333ea;
  }
  
  .status.processed,
  .status.complete {
    color: #10b981;
  }
  
  .severity {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    display: inline-block;
  }
  
  .severity.low {
    color: #10b981;
  }
  
  .severity.medium {
    color: #fbbf24;
  }
  
  .severity.high {
    color: #ef4444;
  }
  
  /* Days Remaining Styles */
  .days-remaining {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
    text-transform: uppercase;
  }
  
  .warning-low {
    color: #10b981;
  }
  
  .warning-medium {
    color: #f59e0b;
  }
  
  .warning-high {
    color: #ef4444;
  }
  
  .warning-critical {
    background-color: rgba(239, 68, 68, 0.2);
    color: #dc2626;
    border: 1px solid #ef4444;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  /* Profile Dropdown Styles */
  .dropdown.show .dropdown-content {
    display: block;
  }
`;
document.head.appendChild(style);