// Counselor/Staff Referral.js - GROUPED BY STUDENT VIEW

document.addEventListener("DOMContentLoaded", async () => {
  // Highlight active nav item
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

  // Profile dropdown functionality
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

  // Load user profile and display welcome message
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const welcomeTitle = document.getElementById("welcomeTitle");
      if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userProfile.data.fullName || userProfile.data.username}`;
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
});

// ====================================
// COUNSELOR/STAFF REFERRAL MANAGEMENT - GROUPED BY STUDENT
// ====================================

// DOM Elements
let searchInput, levelFilter, severityFilter, statusFilter, gradeFilter;
let viewReferralModal, closeViewModalBtn, cancelViewModalBtn;
let viewAllReferralsModal, allReferralsTable;
let deleteConfirmModal, confirmDeleteBtn, cancelDeleteBtn;
let referralToDelete = null;

// Store loaded categories for validation
let availableCategories = [];

// Store all students for auto-fill
let allStudents = [];

// Store all referrals (ungrouped)
let allReferrals = [];

// Store grouped referrals by student
let groupedReferrals = [];

// ====================================
// INITIALIZE
// ====================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Counselor Referral page (Grouped View)...');
  
  initializeElements();
  setupEventListeners();
  
  // Load categories FIRST, then students, then referrals
  loadCategories()
    .then(() => loadAllStudents())
    .then(() => {
      console.log('✅ Categories and students loaded');
      console.log('📊 Total students available:', allStudents.length);
      
      loadReferrals();
    })
    .catch(error => {
      console.error('❌ Initialization error:', error);
    });
  
  // Auto-refresh every 30 seconds
  setInterval(loadReferrals, 30000);
});

// Initialize DOM elements
function initializeElements() {
  searchInput = document.getElementById('searchInput');
  levelFilter = document.getElementById('levelFilter');
  severityFilter = document.getElementById('severityFilter');
  statusFilter = document.getElementById('statusFilter');
  gradeFilter = document.getElementById('gradeFilter');
  
  viewReferralModal = document.getElementById('viewReferralModal');
  closeViewModalBtn = document.getElementById('closeViewModalBtn');
  cancelViewModalBtn = document.getElementById('cancelViewModalBtn');
  
  viewAllReferralsModal = document.getElementById('viewAllReferralsModal');
  allReferralsTable = document.getElementById('allReferralsTable');
  
  deleteConfirmModal = document.getElementById('deleteConfirmModal');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
}

// Setup event listeners
function setupEventListeners() {
  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (cancelViewModalBtn) {
    cancelViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  
  window.addEventListener('click', function(event) {
    if (event.target === viewReferralModal) {
      closeViewModal();
    }
    if (event.target === deleteConfirmModal) {
      closeDeleteModal();
    }
    if (event.target === viewAllReferralsModal) {
      closeAllReferralsModal();
    }
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(renderGroupedReferrals, 300));
  }
  
  if (levelFilter) {
    levelFilter.addEventListener('change', renderGroupedReferrals);
  }
  
  if (severityFilter) {
    severityFilter.addEventListener('change', renderGroupedReferrals);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', renderGroupedReferrals);
  }
  
  if (gradeFilter) {
    gradeFilter.addEventListener('change', renderGroupedReferrals);
  }
  
  const updateForm = document.getElementById('updateStatusForm');
  if (updateForm) {
    updateForm.addEventListener('submit', handleStatusUpdate);
  }
  
  const statusSelect = document.getElementById('view-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      handleStatusChange(this.value);
    });
  }
}

// ====================================
// LOAD ALL STUDENTS FOR AUTO-FILL
// ====================================
async function loadAllStudents() {
  try {
    console.log('📚 Loading ALL students for counselor auto-fill...');
    
    const response = await apiClient.getAllStudentsForCounselor();
    
    console.log('📥 Students response:', response);
    
    if (response.success && response.data) {
      allStudents = response.data;
      console.log('✅ Loaded', allStudents.length, 'students for auto-fill');
    } else {
      console.error('❌ Failed to load students for auto-fill:', response);
      allStudents = [];
    }
  } catch (error) {
    console.error('❌ Error loading students for auto-fill:', error);
    allStudents = [];
  }
}

// ====================================
// LOAD CATEGORIES DYNAMICALLY
// ====================================
async function loadCategories() {
  try {
    console.log('📚 Loading categories...');
    const response = await apiClient.getCategories();
    
    if (response.success && response.data) {
      availableCategories = response.data;
      console.log('✅ Loaded', availableCategories.length, 'categories');
      
      populateAllCategoryDropdowns();
      
    } else {
      console.error('❌ Failed to load categories:', response);
      availableCategories = [];
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    availableCategories = [];
  }
}

function populateAllCategoryDropdowns() {
  const viewCategorySelect = document.getElementById('view-category');
  
  if (viewCategorySelect) {
    populateCategoryDropdown(viewCategorySelect, false);
    console.log('✅ Populated view-category dropdown');
  }
}

function populateCategoryDropdown(selectElement, isFilterDropdown = false) {
  if (!selectElement) {
    console.warn('⚠️ Select element not found');
    return;
  }
  
  if (isFilterDropdown) {
    selectElement.innerHTML = '<option value="">All Categories</option>';
  } else {
    selectElement.innerHTML = '<option value="">Select Category (Optional)</option>';
  }
  
  availableCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    selectElement.appendChild(option);
  });
}

// ====================================
// LOAD AND GROUP REFERRALS BY STUDENT
// ====================================
async function loadReferrals() {
  try {
    const response = await apiClient.getReferrals();
    
    if (response.success && response.data) {
      allReferrals = response.data;
      console.log('✅ Loaded', allReferrals.length, 'total referrals');
      
      // Group referrals by student
      groupReferralsByStudent();
      
      // Render grouped view
      renderGroupedReferrals();
    } else {
      console.error('Failed to load referrals:', response);
      document.getElementById('referralTable').innerHTML = 
        '<tr><td colspan="9" style="text-align:center; color:#dc2626;">Error loading referrals</td></tr>';
    }
  } catch (error) {
    console.error('Error loading referrals:', error);
    document.getElementById('referralTable').innerHTML = 
      '<tr><td colspan="9" style="text-align:center; color:#dc2626;">Error loading referrals</td></tr>';
  }
}

// Group referrals by studentId, keeping only the latest referral info per student
function groupReferralsByStudent() {
  const studentMap = new Map();
  
  allReferrals.forEach(referral => {
    const studentId = referral.studentId || 'UNKNOWN';
    
    if (!studentMap.has(studentId)) {
      // First referral for this student
      studentMap.set(studentId, {
        studentId: studentId,
        studentName: referral.studentName || 'Unknown',
        level: referral.level || 'N/A',
        grade: referral.grade || 'N/A',
        totalReferrals: 1,
        latestReferral: referral,
        allReferrals: [referral]
      });
    } else {
      // Update existing student entry
      const studentData = studentMap.get(studentId);
      studentData.totalReferrals++;
      studentData.allReferrals.push(referral);
      
      // Check if this referral is more recent
      const currentLatestDate = new Date(studentData.latestReferral.dateOfInterview || studentData.latestReferral.createdAt);
      const newReferralDate = new Date(referral.dateOfInterview || referral.createdAt);
      
      if (newReferralDate > currentLatestDate) {
        studentData.latestReferral = referral;
      }
    }
  });
  
  // Convert map to array and sort by latest date (most recent first)
  groupedReferrals = Array.from(studentMap.values()).sort((a, b) => {
    const dateA = new Date(a.latestReferral.dateOfInterview || a.latestReferral.createdAt);
    const dateB = new Date(b.latestReferral.dateOfInterview || b.latestReferral.createdAt);
    return dateB - dateA;
  });
  
  console.log('📊 Grouped into', groupedReferrals.length, 'unique students');
}

// ====================================
// RENDER GROUPED REFERRALS TABLE
// ====================================
function renderGroupedReferrals() {
  const table = document.getElementById('referralTable');
  const studentCountSpan = document.getElementById('studentCount');
  
  if (!table) {
    console.error('Referral table not found');
    return;
  }
  
  // Get filter values
  const searchTerm = (searchInput?.value || '').toLowerCase();
  const selectedLevel = levelFilter?.value || 'all';
  const selectedGrade = gradeFilter?.value || 'all';
  const selectedStatus = statusFilter?.value || 'all';
  const selectedSeverity = severityFilter?.value || 'all';
  
  // Filter grouped referrals
  const filtered = groupedReferrals.filter(student => {
    const matchesSearch = 
      student.studentName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm);
    
    const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
    const matchesGrade = selectedGrade === 'all' || normalizeGrade(student.grade) === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || student.latestReferral.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || student.latestReferral.severity === selectedSeverity;
    
    return matchesSearch && matchesLevel && matchesGrade && matchesStatus && matchesSeverity;
  });
  
  // Update student count
  if (studentCountSpan) {
    studentCountSpan.textContent = filtered.length;
  }
  
  // Render table rows
  if (filtered.length === 0) {
    table.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#6b7280;">No students with referrals found</td></tr>';
    return;
  }
  
  table.innerHTML = filtered.map(student => {
    const latest = student.latestReferral;
    const formattedDate = formatDate(latest.dateOfInterview || latest.createdAt);
    
    // Hide severity for Pending and Under Review status
    const showSeverity = latest.status !== 'Pending' && latest.status !== 'Under Review';
    const severityDisplay = showSeverity 
      ? `<span class="severity-badge severity-${latest.severity.toLowerCase()}">${latest.severity}</span>`
      : '<span style="color: #6b7280; font-style: italic;">—</span>';
    
    return `
      <tr>
        <td>${student.studentId}</td>
        <td>${student.studentName}</td>
        <td>${student.level}</td>
        <td>${student.grade}</td>
        <td>
          <span class="referral-count-badge">${student.totalReferrals}</span>
        </td>
        <td><span class="status-badge status-${latest.status.toLowerCase().replace(/\s+/g, '-')}">${latest.status}</span></td>
        <td>${severityDisplay}</td>
        <td class="latest-date">${formattedDate}</td>
        <td>
          <button class="action-btn view-btn" onclick="viewAllReferralsForStudent('${student.studentId}', '${student.studentName.replace(/'/g, "\\'")}')">
            <span class="material-symbols-outlined">visibility</span>
            View All Referrals
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ====================================
// VIEW ALL REFERRALS FOR A STUDENT
// ====================================
function viewAllReferralsForStudent(studentId, studentName) {
  console.log('👁️ Viewing all referrals for student:', studentId);
  
  // Find the student's data
  const studentData = groupedReferrals.find(s => s.studentId === studentId);
  
  if (!studentData) {
    showAlert('Student data not found', 'error');
    return;
  }
  
  // Set student name in modal header
  document.getElementById('allRef-studentName').textContent = studentName;
  
  // Sort referrals by date (most recent first)
  const sortedReferrals = [...studentData.allReferrals].sort((a, b) => {
    const dateA = new Date(a.dateOfInterview || a.createdAt);
    const dateB = new Date(b.dateOfInterview || b.createdAt);
    return dateB - dateA;
  });
  
  // Render referrals in modal table
  allReferralsTable.innerHTML = sortedReferrals.map(ref => {
    // Hide severity for Pending and Under Review status
    const showSeverity = ref.status !== 'Pending' && ref.status !== 'Under Review';
    const severityDisplay = showSeverity 
      ? `<span class="severity-badge severity-${ref.severity.toLowerCase()}">${ref.severity}</span>`
      : '<span style="color: #6b7280; font-style: italic;">—</span>';
    
    return `
    <tr>
      <td>${ref.referralId || 'N/A'}</td>
      <td>${formatDate(ref.dateOfInterview || ref.createdAt)}</td>
      <td>${ref.reason || 'N/A'}</td>
      <td><span class="status-badge status-${ref.status.toLowerCase().replace(/\s+/g, '-')}">${ref.status}</span></td>
      <td>${severityDisplay}</td>
      <td>${ref.adviser || 'N/A'}</td>
      <td>
        <button class="action-btn view-btn" onclick="viewReferral('${ref._id}')">
          <span class="material-symbols-outlined">edit</span>
          View/Edit
        </button>
        <button class="action-btn delete-btn" onclick="openDeleteModal('${ref._id}')">
          <span class="material-symbols-outlined">delete</span>
          Delete
        </button>
      </td>
    </tr>
    `;
  }).join('');
  
  // Show modal
  viewAllReferralsModal.style.display = 'block';
}

function closeAllReferralsModal() {
  if (viewAllReferralsModal) {
    viewAllReferralsModal.style.display = 'none';
  }
}

// ====================================
// VIEW SINGLE REFERRAL (FOR EDIT)
// ====================================
async function viewReferral(referralId) {
  console.log('👁️ Viewing referral:', referralId);
  
  try {
    const response = await apiClient.get(`/referrals/${referralId}`);
    
    if (response.success && response.data) {
      const referral = response.data;
      
      // DEBUG: Log the full referral object to see what data we're receiving
      console.log('📋 Full referral data:', referral);
      console.log('📅 dateOfInterview:', referral.dateOfInterview);
      console.log('👤 adviser:', referral.adviser);
      
      // Populate form fields
      document.getElementById('viewReferralId').value = referral._id;
      document.getElementById('view-referralId-display').value = referral.referralId || 'N/A';
      document.getElementById('view-studentId').value = referral.studentId || '';
      document.getElementById('view-studentName').value = referral.studentName || '';
      document.getElementById('view-level').value = referral.level || '';
      document.getElementById('view-grade').value = referral.grade || '';
      
      // Format date for HTML date input (needs YYYY-MM-DD format)
      const dateInput = document.getElementById('view-dateOfInterview');
      if (dateInput) {
        // Try multiple possible date field names
        const dateValue = referral.dateOfInterview || referral.interviewDate || referral.date || referral.createdAt;
        
        if (dateValue) {
          try {
            const date = new Date(dateValue);
            // Check if date is valid
            if (!isNaN(date.getTime())) {
              // Convert to YYYY-MM-DD format for date input
              const formattedDate = date.toISOString().split('T')[0];
              dateInput.value = formattedDate;
              console.log('📅 Date set to:', formattedDate, '(from:', dateValue, ')');
            } else {
              console.error('❌ Invalid date value:', dateValue);
              dateInput.value = '';
            }
          } catch (error) {
            console.error('❌ Error formatting date:', error);
            dateInput.value = '';
          }
        } else {
          dateInput.value = '';
          console.log('⚠️ No date provided. Checked fields: dateOfInterview, interviewDate, date, createdAt');
          console.log('🔍 Available fields in referral:', Object.keys(referral));
        }
      }
      
      // Set adviser field with logging (check multiple possible field names)
      const adviserInput = document.getElementById('view-adviser');
      if (adviserInput) {
        // Try multiple possible field names
        const adviserValue = referral.adviser || referral.referredBy || referral.advisorName || referral.teacher || '';
        adviserInput.value = adviserValue;
        console.log('👤 Adviser set to:', adviserValue);
        if (!adviserValue) {
          console.warn('⚠️ No adviser data in referral object. Checked fields: adviser, referredBy, advisorName, teacher');
          console.log('🔍 Available fields in referral:', Object.keys(referral));
        }
      }
      
      document.getElementById('view-reason').value = referral.reason || '';
      document.getElementById('view-description').value = referral.description || '';
      document.getElementById('view-status').value = referral.status || 'Pending';
      document.getElementById('view-severity').value = referral.severity || 'Low';
      document.getElementById('view-notes').value = referral.notes || '';
      
      // IMPORTANT: Re-populate the category dropdown before setting the value
      // This ensures the dropdown has the latest options
      const categorySelect = document.getElementById('view-category');
      if (categorySelect && availableCategories.length > 0) {
        populateCategoryDropdown(categorySelect, false);
        console.log('✅ Category dropdown re-populated with', availableCategories.length, 'categories');
      }
      
      // Now set the category value after dropdown is populated
      if (categorySelect) {
        categorySelect.value = referral.category || '';
        console.log('📝 Category value set to:', referral.category || '(empty)');
        
        // Verify if the value was set correctly
        if (referral.category && categorySelect.value !== referral.category) {
          console.warn('⚠️ Category value mismatch! Expected:', referral.category, 'Got:', categorySelect.value);
          // Check if category exists in available categories
          const categoryExists = availableCategories.some(cat => cat.name === referral.category);
          if (!categoryExists) {
            console.warn('⚠️ Category not found in available categories:', referral.category);
          }
        }
      }
      
      // Handle editable fields
      const form = document.getElementById('updateStatusForm');
      const isStudentSubmission = !referral.studentId || referral.studentId === '';
      form.dataset.isStudentSubmission = isStudentSubmission;
      
      // Show/hide edit badges
      const editBadges = ['studentIdEditBadge', 'studentNameEditBadge', 'levelEditBadge', 'gradeEditBadge', 'adviserEditBadge'];
      editBadges.forEach(badgeId => {
        const badge = document.getElementById(badgeId);
        if (badge) {
          badge.style.display = isStudentSubmission ? 'inline-block' : 'none';
        }
      });
      
      // Enable/disable fields
      document.getElementById('view-studentId').readOnly = !isStudentSubmission;
      document.getElementById('view-studentName').readOnly = !isStudentSubmission;
      document.getElementById('view-level').disabled = !isStudentSubmission;
      document.getElementById('view-grade').readOnly = !isStudentSubmission;
      document.getElementById('view-adviser').readOnly = !isStudentSubmission;
      
      // Handle status-based notes visibility
      handleStatusChange(referral.status);
      
      // Update grade options based on level
      updateViewGradeOptions(referral.level, referral.grade);
      
      // Close the "All Referrals" modal if open
      closeAllReferralsModal();
      
      // Show view modal
      viewReferralModal.style.display = 'block';
    } else {
      showAlert('Failed to load referral details', 'error');
    }
  } catch (error) {
    console.error('Error loading referral:', error);
    showAlert('Error loading referral details', 'error');
  }
}

function closeViewModal() {
  if (viewReferralModal) {
    viewReferralModal.style.display = 'none';
  }
}

// ====================================
// STATUS CHANGE HANDLER
// ====================================
function handleStatusChange(status) {
  const notesSection = document.getElementById('notesSection');
  const notesTextarea = document.getElementById('view-notes');
  
  console.log('📝 Status changed to:', status);
  
  if (status === 'For Consultation' || status === 'Complete') {
    if (notesSection) {
      notesSection.style.display = 'block';
      console.log('✅ Consultation notes section shown');
    }
    if (notesTextarea) {
      notesTextarea.required = true;
    }
  } else {
    if (notesSection) {
      notesSection.style.display = 'none';
      console.log('❌ Consultation notes section hidden');
    }
    if (notesTextarea) {
      notesTextarea.required = false;
    }
  }
}

// Update grade options in view modal
function updateViewGradeOptions(level, selectedGrade = '') {
  const gradeSelect = document.getElementById('view-grade');
  if (!gradeSelect) return;
  
  gradeSelect.innerHTML = '<option value="">Select grade</option>';
  
  const gradeOptions = {
    'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    'JHS': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    'SHS': ['Grade 11', 'Grade 12']
  };
  
  if (level && gradeOptions[level]) {
    gradeOptions[level].forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = grade;
      gradeSelect.appendChild(option);
    });
    gradeSelect.disabled = false;
    
    if (selectedGrade) {
      const gradeNumber = selectedGrade.replace('Grade ', '');
      const formattedGrade = gradeNumber.includes('Grade') ? gradeNumber : `Grade ${gradeNumber}`;
      gradeSelect.value = formattedGrade;
    }
  } else {
    gradeSelect.disabled = true;
  }
}

// Handle status update
async function handleStatusUpdate(e) {
  e.preventDefault();
  
  const referralId = document.getElementById('viewReferralId').value;
  const status = document.getElementById('view-status').value;
  const notes = document.getElementById('view-notes').value.trim();
  const severity = document.getElementById('view-severity').value;
  const category = document.getElementById('view-category').value;
  
  if ((status === 'For Consultation' || status === 'Complete') && !notes) {
    showAlert('Please add consultation notes before setting this status', 'error');
    return;
  }
  
  if (category && category !== '') {
    const categoryExists = availableCategories.some(cat => cat.name === category);
    if (!categoryExists) {
      showAlert('Selected category is not valid. Please select a valid category from the dropdown list.', 'error');
      return;
    }
  }
  
  const formData = {
    status: status,
    severity: severity,
    notes: notes || undefined
  };
  
  if (category && category !== '') {
    formData.category = category;
  } else {
    formData.category = null;
  }
  
  const form = e.target;
  const isStudentSubmission = form.dataset.isStudentSubmission === 'true';
  
  if (isStudentSubmission) {
    const studentId = document.getElementById('view-studentId').value.trim();
    const studentName = document.getElementById('view-studentName').value.trim();
    const level = document.getElementById('view-level').value;
    const grade = document.getElementById('view-grade').value;
    
    if (!studentName) {
      showAlert('Student name is required', 'error');
      return;
    }
    
    if (!level) {
      showAlert('Level is required', 'error');
      return;
    }
    
    if (!grade) {
      showAlert('Grade is required', 'error');
      return;
    }
    
    formData.studentId = studentId || null;
    formData.studentName = studentName;
    formData.level = level;
    formData.grade = grade;
  } else {
    const studentId = document.getElementById('view-studentId').value.trim();
    if (studentId) {
      formData.studentId = studentId;
    }
  }
  
  try {
    const response = await apiClient.put(`/referrals/${referralId}`, formData);
    
    if (response.success) {
      showAlert('Referral updated successfully!', 'success');
      closeViewModal();
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to update referral', 'error');
    }
  } catch (error) {
    console.error('Error updating referral:', error);
    showAlert('Error updating referral. Please try again.', 'error');
  }
}

// ====================================
// DELETE REFERRAL
// ====================================
function openDeleteModal(referralId) {
  referralToDelete = referralId;
  
  const deleteMessage = document.getElementById('deleteMessage');
  if (deleteMessage) {
    deleteMessage.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 16px;"></i>
        <h3 style="margin: 12px 0; color: #ffffff;">Delete this referral?</h3>
        <p style="color: #6b7280; margin: 8px 0;">
          Are you sure you want to delete this referral? 
          <br>
          <strong>This action cannot be undone.</strong>
        </p>
      </div>
    `;
  }
  
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'block';
  }
}

function closeDeleteModal() {
  referralToDelete = null;
  
  const deleteMessage = document.getElementById('deleteMessage');
  if (deleteMessage) {
    deleteMessage.innerHTML = '';
  }
  
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'none';
  }
}

async function confirmDelete() {
  if (!referralToDelete) return;
  
  try {
    const response = await apiClient.delete(`/referrals/${referralToDelete}`);
    
    if (response.success) {
      showAlert('Referral deleted successfully', 'success');
      closeDeleteModal();
      closeAllReferralsModal(); // Close the all referrals modal too
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to delete referral', 'error');
    }
  } catch (error) {
    console.error('Error deleting referral:', error);
    showAlert('Error deleting referral', 'error');
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showAlert(message, type = 'info') {
  if (typeof customAlert !== 'undefined') {
    switch(type) {
      case 'success':
        customAlert.success(message);
        break;
      case 'error':
        customAlert.error(message);
        break;
      case 'warning':
        customAlert.warning(message);
        break;
      default:
        customAlert.info(message);
    }
    return;
  }
  
  alert(message);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function normalizeGrade(grade) {
  if (!grade) return '';
  const gradeStr = String(grade).trim();
  const match = gradeStr.match(/\d+/);
  return match ? match[0] : gradeStr;
}

// Export functions to window
window.viewReferral = viewReferral;
window.viewAllReferralsForStudent = viewAllReferralsForStudent;
window.openDeleteModal = openDeleteModal;
window.closeViewModal = closeViewModal;
window.closeDeleteModal = closeDeleteModal;
window.closeAllReferralsModal = closeAllReferralsModal;