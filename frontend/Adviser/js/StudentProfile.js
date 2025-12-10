// Teacher/Adviser StudentProfile.js - FIXED VERSION WITH WORKING DROPDOWN
document.addEventListener('DOMContentLoaded', async function() {
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== 'Teacher') {
    window.location.href = '../../pages/LoginForm.html';
    return;
  }

  // Display adviser name
  document.getElementById('adviserName').textContent = user.fullName;

  // Setup profile dropdown FIRST
  setupProfileDropdown();
  
  // Load user profile to show avatar
  await loadUserProfile();

  // Elements
  const studentTable = document.getElementById('studentTable');
  const searchInput = document.getElementById('searchInput');
  const levelFilter = document.getElementById('levelFilter');
  const gradeFilter = document.getElementById('gradeFilter');
  const studentCount = document.getElementById('studentCount');
  const bulkUploadBtn = document.getElementById('bulkUploadBtn');
  const uploadModal = document.getElementById('uploadModal');
  const resultsModal = document.getElementById('resultsModal');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const confirmUploadBtn = document.getElementById('confirmUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  let allStudents = [];
  let selectedFile = null;

  // Grade mappings for each level
  const gradeMappings = {
    'Elementary': [1, 2, 3, 4, 5, 6],
    'JHS': [7, 8, 9, 10],
    'SHS': [11, 12]
  };

  // --------------------------
  // SETUP PROFILE DROPDOWN
  // --------------------------
  function setupProfileDropdown() {
    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    
    console.log('Setting up profile dropdown...', { profileButton, profileDropdown });
    
    if (profileButton && profileDropdown) {
      // Toggle dropdown when clicking profile button
      profileButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Profile button clicked!');
        
        // Toggle the 'active' class (matching the CSS)
        profileDropdown.classList.toggle("active");
        console.log('Dropdown classes:', profileDropdown.className);
      });
    
      // Close dropdown when clicking outside
      document.addEventListener("click", (event) => {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
          profileDropdown.classList.remove("active");
        }
      });
    
      // Prevent dropdown from closing when clicking inside dropdown content
      const dropdownContent = profileDropdown.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }
    } else {
      console.error('Profile button or dropdown not found!');
    }
  }

  // --------------------------
  // LOAD USER PROFILE
  // --------------------------
  async function loadUserProfile() {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No auth token found");
        // Still generate avatar from localStorage user
        if (user && user.fullName) {
          displayUserProfile(user);
        }
        return;
      }

      console.log("Fetching user profile...");
      
      const response = await apiClient.getUserProfile();
      
      console.log("Profile Response:", response);

      if (response.success && response.data) {
        displayUserProfile(response.data);
      } else {
        console.error("Failed to load profile:", response.message);
        // Fallback to localStorage user
        if (user && user.fullName) {
          displayUserProfile(user);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Fallback to localStorage user
      if (user && user.fullName) {
        displayUserProfile(user);
      }
    }
  }

  // --------------------------
  // DISPLAY USER PROFILE
  // --------------------------
  function displayUserProfile(userData) {
    const profileButton = document.getElementById("profileButton");
    
    if (profileButton) {
      const name = userData.fullName || userData.username || 'User';
      // Generate avatar with smaller size (40px for header)
      profileButton.innerHTML = generateAvatar(name, 40);
      profileButton.style.cursor = 'pointer';
    }
  }

  // --------------------------
  // GENERATE AVATAR WITH INITIAL
  // --------------------------
  function generateAvatar(name, size = 80) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const fontSize = size === 80 ? 50 : 20;
    
    return `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
        border-radius: 50%;
        font-size: ${fontSize}px;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
      ">
        ${initial}
      </div>
    `;
  }

  // Populate grade filter based on level
  function populateGradeFilter(level) {
    // Clear current options except "All Grades"
    gradeFilter.innerHTML = '<option value="">All Grades</option>';
    
    if (level && gradeMappings[level]) {
      const grades = gradeMappings[level];
      grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = `Grade ${grade}`;
        option.textContent = `Grade ${grade}`;
        gradeFilter.appendChild(option);
      });
      gradeFilter.disabled = false;
    } else {
      // If no level selected, show all possible grades
      gradeFilter.disabled = false;
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(grade => {
        const option = document.createElement('option');
        option.value = `Grade ${grade}`;
        option.textContent = `Grade ${grade}`;
        gradeFilter.appendChild(option);
      });
    }
  }

  // Initialize grade filter with all grades
  populateGradeFilter('');

  // Level filter change handler
  levelFilter.addEventListener('change', function() {
    const selectedLevel = this.value;
    
    // Reset grade filter to "All Grades"
    gradeFilter.value = '';
    
    // Populate grade options based on selected level
    populateGradeFilter(selectedLevel);
    
    // Apply filters
    filterStudents();
  });

  // Load students
  async function loadStudents() {
    try {
      console.log('📚 Loading students for teacher:', user.fullName);
      
      const response = await apiClient.get('/students');
      
      console.log('📥 Students response:', response);
      
      if (response.success) {
        allStudents = response.data || [];
        displayStudents(allStudents);
        updateStudentCount(allStudents.length);
      } else {
        console.error('Failed to load students:', response.error);
        showCustomAlert(response.error || 'Failed to load students', 'error');
        studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Failed to load students</td></tr>';
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showCustomAlert('Error loading students: ' + error.message, 'error');
      studentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Error loading students</td></tr>';
    }
  }

  // Display students in table
  function displayStudents(students) {
    if (students.length === 0) {
      studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #6b7280;">No students found. Click "Bulk Upload Students" to add your students.</td></tr>';
      return;
    }

    studentTable.innerHTML = students.map(student => {
      const fullName = student.fullName || 
        `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName : ''}`;
      
      return `
        <tr>
          <td>${student.studentId || 'N/A'}</td>
          <td>${fullName}</td>
          <td>${student.level || 'N/A'}</td>
          <td>${student.grade || 'N/A'}</td>
          <td>${student.contactNumber || 'N/A'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action btn-add-referral" onclick="openAddReferralModal('${student._id}', '${student.studentId}', '${fullName.replace(/'/g, "\\'")}', '${student.level}', '${student.grade}')">
                <span class="material-symbols-outlined">add_circle</span>
                Add Referral
              </button>
              <button class="btn-action btn-view-referrals" onclick="openViewReferralsModal('${student.studentId}', '${fullName.replace(/'/g, "\\'")}')">
                <span class="material-symbols-outlined">visibility</span>
                View Referrals
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update student count
  function updateStudentCount(count) {
    studentCount.textContent = count;
  }

  // Normalize grade format for comparison
  function normalizeGrade(grade) {
    if (!grade) return '';
    // Convert to string and extract number
    const gradeStr = String(grade).trim();
    const match = gradeStr.match(/\d+/);
    return match ? match[0] : gradeStr;
  }

  // Filter students
  function filterStudents() {
    const search = searchInput.value.toLowerCase();
    const level = levelFilter.value;
    const grade = gradeFilter.value;

    const filtered = allStudents.filter(student => {
      const fullName = student.fullName || 
        `${student.firstName} ${student.lastName}`;
      
      const matchesSearch = !search || 
        student.studentId?.toLowerCase().includes(search) ||
        student.firstName?.toLowerCase().includes(search) ||
        student.lastName?.toLowerCase().includes(search) ||
        fullName.toLowerCase().includes(search);
      
      const matchesLevel = !level || student.level === level;
      
      // Normalize both filter value and student grade for comparison
      const matchesGrade = !grade || 
        normalizeGrade(student.grade) === normalizeGrade(grade);

      return matchesSearch && matchesLevel && matchesGrade;
    });

    displayStudents(filtered);
    updateStudentCount(filtered.length);
  }

  // Event listeners for filters
  searchInput.addEventListener('input', filterStudents);
  gradeFilter.addEventListener('change', filterStudents);

  // Bulk Upload Modal
  bulkUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'block';
    resetUploadModal();
  });

  // Close modals
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      uploadModal.style.display = 'none';
      resultsModal.style.display = 'none';
    });
  });

  cancelUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    resetUploadModal();
  });

  closeResultsBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
  });

  // Click outside to close
  window.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
      uploadModal.style.display = 'none';
      resetUploadModal();
    }
    if (e.target === resultsModal) {
      resultsModal.style.display = 'none';
    }
  });

  // Drop zone functionality
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#10b981';
    dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Handle file selection
  function handleFileSelect(file) {
    console.log('🔎 File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      showCustomAlert('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.', 'error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showCustomAlert('File is too large. Maximum size is 10MB.', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    confirmUploadBtn.disabled = false;
    
    console.log('✅ File validated successfully');
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Upload file
  confirmUploadBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showCustomAlert('Please select a file first', 'error');
      return;
    }

    console.log('📤 Starting upload for file:', selectedFile.name);

    // Create FormData
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Show progress
      confirmUploadBtn.disabled = true;
      cancelUploadBtn.disabled = true;
      uploadProgress.style.display = 'block';
      progressBar.style.width = '30%';
      progressText.textContent = 'Uploading file...';

      console.log('📡 Sending request to /students/bulk-upload');

      // Use apiClient upload method
      const response = await apiClient.upload('/students/bulk-upload', formData);

      console.log('📥 Upload response:', response);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Upload failed');
      }

      progressBar.style.width = '100%';
      progressText.textContent = 'Processing complete!';

      // Close upload modal after a short delay
      setTimeout(() => {
        uploadModal.style.display = 'none';
        resetUploadModal();
        
        // Show results
        displayUploadResults(response);
        
        // Reload students
        loadStudents();
      }, 500);

    } catch (error) {
      console.error('❌ Upload error:', error);
      showCustomAlert(error.message || 'Failed to upload file', 'error');
      resetUploadModal();
    }
  });

  // Display upload results
  function displayUploadResults(response) {
    console.log('📊 Displaying results:', response);
    
    const summary = response.summary || { inserted: 0, duplicates: 0, errors: 0, totalRows: 0 };
    const duplicates = response.duplicates || [];
    const errors = response.errors || [];
    
    let html = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #10b981; margin-top: 0;">📊 Upload Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${summary.inserted}</div>
            <div style="color: #10b981; font-size: 0.9rem;">✅ Added</div>
          </div>
          <div style="background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(251, 191, 36, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #fbbf24;">${summary.duplicates}</div>
            <div style="color: #fbbf24; font-size: 0.9rem;">⚠️ Duplicates</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${summary.errors}</div>
            <div style="color: #ef4444; font-size: 0.9rem;">❌ Errors</div>
          </div>
          <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.3);">
            <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${summary.totalRows}</div>
            <div style="color: #3b82f6; font-size: 0.9rem;">📋 Total Rows</div>
          </div>
        </div>
      </div>
    `;

    // Show duplicates
    if (duplicates.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #fbbf24; margin-top: 0;">⚠️ Duplicates Found (${duplicates.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
            ${duplicates.map(d => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #fbbf24;">Row ${d.row}:</strong> ${d.name} (${d.studentId}) - ${d.reason}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Show errors
    if (errors.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: #ef4444; margin-top: 0;">❌ Errors (${errors.length})</h4>
          <div style="max-height: 200px; overflow-y: auto; background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
            ${errors.map(e => `
              <div style="margin-bottom: 0.5rem; color: #e0e0e0;">
                <strong style="color: #ef4444;">Row ${e.row}:</strong> ${e.error}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Success message
    if (summary.inserted > 0) {
      html += `
        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <p style="margin: 0; color: #10b981;">
            ✅ Successfully added ${summary.inserted} student${summary.inserted !== 1 ? 's' : ''} to your class!
          </p>
        </div>
      `;
    }

    document.getElementById('resultsContent').innerHTML = html;
    resultsModal.style.display = 'block';
  }

  // Reset upload modal
  function resetUploadModal() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadProgress.style.display = 'none';
    progressBar.style.width = '0%';
    confirmUploadBtn.disabled = true;
    cancelUploadBtn.disabled = false;
    
    // Reset drop zone styling
    dropZone.style.borderColor = '#333';
    dropZone.style.background = 'rgba(26, 26, 26, 0.5)';
  }

  // Initial load
  console.log('🚀 Initializing student profile page...');
  loadStudents();

  // --------------------------
  // REFERRAL MODAL FUNCTIONS
  // --------------------------
  
  console.log('🔧 Setting up referral modals...');
  
  // Add Referral Modal
  const referralModal = document.getElementById('referralModal');
  const closeReferralModal = document.getElementById('closeReferralModal');
  const cancelReferralBtn = document.getElementById('cancelReferralBtn');
  const referralForm = document.getElementById('referralForm');

  console.log('Modal elements:', {
    referralModal: !!referralModal,
    closeReferralModal: !!closeReferralModal,
    cancelReferralBtn: !!cancelReferralBtn,
    referralForm: !!referralForm
  });

  // View Referrals Modal
  const viewReferralsModal = document.getElementById('viewReferralsModal');
  const closeViewReferralsModal = document.getElementById('closeViewReferralsModal');
  const closeViewReferralsBtn = document.getElementById('closeViewReferralsBtn');

  // Close modal handlers
  if (closeReferralModal) {
    closeReferralModal.onclick = () => {
      referralModal.style.display = 'none';
      referralForm.reset();
    };
  }

  if (cancelReferralBtn) {
    cancelReferralBtn.onclick = () => {
      referralModal.style.display = 'none';
      referralForm.reset();
    };
  }

  if (closeViewReferralsModal) {
    closeViewReferralsModal.onclick = () => {
      viewReferralsModal.style.display = 'none';
    };
  }

  if (closeViewReferralsBtn) {
    closeViewReferralsBtn.onclick = () => {
      viewReferralsModal.style.display = 'none';
    };
  }

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === referralModal) {
      referralModal.style.display = 'none';
      referralForm.reset();
    }
    if (event.target === viewReferralsModal) {
      viewReferralsModal.style.display = 'none';
    }
  };

  // Open Add Referral Modal
  window.openAddReferralModal = (studentDbId, studentId, studentName, level, grade) => {
    console.log('📝 Opening add referral modal for:', studentName);
    
    // Populate form with student info
    document.getElementById('ref-studentId').value = studentId;
    document.getElementById('ref-studentName').value = studentName;
    document.getElementById('ref-studentIdDisplay').value = studentId;
    document.getElementById('ref-level').value = level;
    document.getElementById('ref-grade').value = grade;
    document.getElementById('ref-levelDisplay').value = level;
    document.getElementById('ref-gradeDisplay').value = grade;
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('ref-dateOfInterview').value = today;
    
    // Show modal
    referralModal.style.display = 'block';
  };

  // Open View Referrals Modal
  window.openViewReferralsModal = async (studentId, studentName) => {
    console.log('👁️ Opening view referrals modal for:', studentName);
    
    // Set student name in header
    document.getElementById('viewRef-studentName').textContent = studentName;
    
    // Show modal
    viewReferralsModal.style.display = 'block';
    
    // Load referrals for this student
    await loadStudentReferrals(studentId);
  };

  // Load referrals for a specific student
  async function loadStudentReferrals(studentId) {
    const container = document.getElementById('referralsListContainer');
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">Loading referrals...</p>';
    
    try {
      console.log('📥 Loading referrals for student:', studentId);
      
      // Use teacher's authorized endpoint and filter by studentId on frontend
      const response = await apiClient.getMyReferrals();
      
      if (response.success) {
        const allReferrals = response.data || [];
        // Filter referrals for this specific student
        const referrals = allReferrals.filter(ref => ref.studentId === studentId);
        console.log(`✅ Loaded ${referrals.length} referrals for student ${studentId}`);
        
        if (referrals.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
              <span class="material-symbols-outlined" style="font-size: 48px; color: #333;">assignment</span>
              <p>No referrals found for this student.</p>
            </div>
          `;
          return;
        }
        
        // Display referrals
        container.innerHTML = referrals.map(referral => {
          // Fix date timezone issue - parse date string directly
          const dateString = referral.referralDate || referral.createdAt;
          let formattedDate;
          
          try {
            // If date is in ISO format (YYYY-MM-DD), parse it without timezone conversion
            if (typeof dateString === 'string' && dateString.includes('-')) {
              const [year, month, day] = dateString.split('T')[0].split('-');
              const date = new Date(year, month - 1, day);
              formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            } else {
              // Fallback to normal date parsing
              const date = new Date(dateString);
              formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            }
          } catch (error) {
            console.error('Date parsing error:', error);
            formattedDate = 'Invalid Date';
          }

          const statusClass = referral.status.toLowerCase().replace(/\s+/g, '-');
          const severityClass = (referral.severity || 'Pending Assessment').toLowerCase().replace(/\s+/g, '-');
          
          // Show severity only if status is NOT "Pending" or "Under Review"
          const shouldShowSeverity = referral.status !== 'Pending' && referral.status !== 'Under Review';

          return `
            <div class="referral-item">
              <div class="referral-header">
                <span class="referral-id">${referral.referralId || 'N/A'}</span>
                <span class="referral-date">${formattedDate}</span>
              </div>
              
              <div class="referral-details">
                <div class="referral-detail">
                  <span class="detail-label">Status</span>
                  <span class="status-badge status-${statusClass}">${referral.status}</span>
                </div>
                ${shouldShowSeverity ? `
                  <div class="referral-detail">
                    <span class="detail-label">Severity</span>
                    <span class="severity-badge severity-${severityClass}">${referral.severity || 'Pending Assessment'}</span>
                  </div>
                ` : ''}
                ${referral.category ? `
                  <div class="referral-detail">
                    <span class="detail-label">Category</span>
                    <span class="detail-value">${referral.category}</span>
                  </div>
                ` : ''}
                <div class="referral-detail">
                  <span class="detail-label">Referred By</span>
                  <span class="detail-value">${referral.referredBy || 'N/A'}</span>
                </div>
              </div>
              
              <div class="referral-reason">
                <strong>Reason:</strong>
                <p>${referral.reason}</p>
              </div>
              
              ${referral.description ? `
                <div class="referral-reason" style="border-left-color: #3b82f6; background: rgba(59, 130, 246, 0.1);">
                  <strong style="color: #3b82f6;">Description:</strong>
                  <p>${referral.description}</p>
                </div>
              ` : ''}
              
              ${referral.notes ? `
                <div class="referral-reason" style="border-left-color: #a78bfa; background: rgba(167, 139, 250, 0.1);">
                  <strong style="color: #a78bfa;">Consultation Notes:</strong>
                  <p>${referral.notes}</p>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
        
      } else {
        throw new Error(response.error || 'Failed to load referrals');
      }
    } catch (error) {
      console.error('❌ Error loading referrals:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
          <p>Failed to load referrals: ${error.message}</p>
        </div>
      `;
    }
  }

  // Handle referral form submission
  if (referralForm) {
    console.log('✅ Attaching submit handler to referral form');
    
    referralForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('📝 Form submitted!');
      
      // Validate required fields
      const studentId = document.getElementById('ref-studentId').value.trim();
      const reason = document.getElementById('ref-reason').value.trim();
      const referralDate = document.getElementById('ref-dateOfInterview').value;
      
      if (!studentId || !reason || !referralDate) {
        alert('Please fill in all required fields');
        return;
      }
      
      const formData = {
        studentName: document.getElementById('ref-studentName').value.trim(),
        studentId: studentId,
        level: document.getElementById('ref-level').value,
        grade: document.getElementById('ref-grade').value,
        referralDate: referralDate,
        reason: reason,
        description: document.getElementById('ref-description').value.trim() || undefined,
        referredBy: user.fullName || user.username
      };

      console.log('📤 Submitting new referral:', formData);

      try {
        // Show loading state
        const submitBtn = referralForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Creating...';
        
        const response = await apiClient.post('/referrals', formData);
        
        console.log('📥 Response:', response);
        
        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        if (response.success) {
          console.log('✅ Referral created successfully!');
          
          // Close modal first
          referralModal.style.display = 'none';
          referralForm.reset();
          
          // Show success message using custom alert
          if (typeof customAlert !== 'undefined' && customAlert.success) {
            customAlert.success('Referral has been created successfully!', 'Success!');
          } else {
            // Fallback to native alert
            alert('✅ Referral created successfully! 🎉');
          }
        } else {
          throw new Error(response.error || response.message || 'Failed to create referral');
        }
      } catch (error) {
        console.error('❌ Error creating referral:', error);
        
        // Restore button
        const submitBtn = referralForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="material-symbols-outlined">add</span>Submit Referral';
        }
        
        // Show error message using custom alert
        const errorMsg = error.message || 'Failed to create referral';
        if (typeof customAlert !== 'undefined' && customAlert.error) {
          customAlert.error(errorMsg, 'Error!');
        } else {
          // Fallback to native alert
          alert('❌ Error: ' + errorMsg);
        }
      }
    });
  } else {
    console.error('❌ Referral form not found!');
  }
});

// Add this function to StudentProfile.js after the filterStudents() function

// Check if we should auto-filter to a specific student (from Home page navigation)
function checkAutoFilterStudent() {
  const filterDataStr = sessionStorage.getItem('filterToStudent');
  
  if (filterDataStr) {
    try {
      const { studentName, studentId } = JSON.parse(filterDataStr);
      
      console.log('🎯 Auto-filtering to student:', studentName, studentId);
      
      // Clear the flag so it doesn't auto-filter again
      sessionStorage.removeItem('filterToStudent');
      
      // Apply the filter
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        // Set the search input to the student name
        searchInput.value = studentName;
        
        // Add visual indicator that this is a filtered view
        searchInput.style.borderColor = '#10b981';
        searchInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
        
        // Trigger the filter
        filterStudents();
        
        // Scroll to top to see the filtered result
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Show a brief notification
        setTimeout(() => {
          if (typeof customAlert !== 'undefined' && customAlert.info) {
            customAlert.info(`Showing results for: ${studentName}`, 'Filtered View');
          }
        }, 300);
        
        // Reset border after 2 seconds
        setTimeout(() => {
          searchInput.style.borderColor = '';
          searchInput.style.boxShadow = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error parsing filter data:', error);
      sessionStorage.removeItem('filterToStudent');
    }
  }
}

// IMPORTANT: Make sure loadStudents() returns a Promise
// If it doesn't already, wrap the end of the function with a return statement

// Then update the initialization section to:
// Initial load
console.log('🚀 Initializing student profile page...');

// Load students first, then apply auto-filter if needed
loadStudents();

// Wait a moment for students to load, then check for auto-filter
setTimeout(() => {
  checkAutoFilterStudent();
}, 300);