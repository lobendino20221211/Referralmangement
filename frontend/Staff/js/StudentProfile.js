// Counselor/Staff StudentProfile.js - Dynamic Grade Filter Based on Level
document.addEventListener('DOMContentLoaded', async function() {
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== 'Counselor') {
    window.location.href = '../../pages/LoginForm.html';
    return;
  }

  // Elements - Adviser View
  const adviserTable = document.getElementById('adviserTable');
  const adviserSearchInput = document.getElementById('adviserSearchInput');
  const adviserDepartmentFilter = document.getElementById('adviserDepartmentFilter');
  const adviserCount = document.getElementById('adviserCount');
  const adviserListSection = document.getElementById('adviserListSection');

  // Elements - Student View
  const studentTable = document.getElementById('studentTable');
  const studentSearchInput = document.getElementById('studentSearchInput');
  const adviserFilter = document.getElementById('adviserFilter');
  const levelFilter = document.getElementById('levelFilter');
  const gradeFilter = document.getElementById('gradeFilter');
  const studentCount = document.getElementById('studentCount');
  const studentListSection = document.getElementById('studentListSection');

  // View toggle buttons
  const adviserViewBtn = document.getElementById('adviserViewBtn');
  const studentViewBtn = document.getElementById('studentViewBtn');

  // Modal elements
  const adviserStudentsModal = document.getElementById('adviserStudentsModal');
  const modalAdviserName = document.getElementById('modalAdviserName');
  const modalStudentTable = document.getElementById('modalStudentTable');
  const modalSearchInput = document.getElementById('modalSearchInput');
  const modalLevelFilter = document.getElementById('modalLevelFilter');
  const modalGradeFilter = document.getElementById('modalGradeFilter');
  const modalStudentCount = document.getElementById('modalStudentCount');
  const closeModalBtn = document.getElementById('closeModalBtn');

  let allAdvisers = [];
  let allStudents = [];
  let currentAdviserStudents = [];
  let currentView = 'adviser'; // 'adviser' or 'student'

  // ============================================
  // UTILITY: Grade ranges by level
  // ============================================
  const GRADE_RANGES = {
    'Elementary': { start: 1, end: 6 },
    'JHS': { start: 7, end: 10 },
    'Junior High School': { start: 7, end: 10 },
    'SHS': { start: 11, end: 12 },
    'Senior High School': { start: 11, end: 12 }
  };

  // ============================================
  // UTILITY: Normalize grade value for comparison
  // ============================================
  function normalizeGrade(grade) {
    if (!grade) return '';
    const gradeStr = String(grade).trim();
    // Extract just the number (handles "Grade 12", "12", " 12 ", etc.)
    const match = gradeStr.match(/\d+/);
    return match ? match[0] : gradeStr;
  }

  // ============================================
  // UTILITY: Populate Grade Filter Based on Level
  // ============================================
  function populateGradeFilter(selectElement, selectedLevel = '') {
    if (!selectElement) return;
    
    let gradeOptions = [];
    
    if (selectedLevel && GRADE_RANGES[selectedLevel]) {
      // Populate based on selected level
      const { start, end } = GRADE_RANGES[selectedLevel];
      gradeOptions = Array.from({length: end - start + 1}, (_, i) => start + i);
    } else {
      // Show all grades 1-12 when no level is selected
      gradeOptions = Array.from({length: 12}, (_, i) => i + 1);
    }
    
    selectElement.innerHTML = '<option value="">All Grades</option>' +
      gradeOptions.map(grade => 
        `<option value="${grade}">${grade}</option>`
      ).join('');
  }

  // ============================================
  // ADVISER FUNCTIONS
  // ============================================

  // Load advisers with student counts
  async function loadAdvisers() {
    try {
      const response = await apiClient.getAdvisers();
      
      if (response.success) {
        allAdvisers = response.data;
        displayAdvisers(allAdvisers);
        updateAdviserCount(allAdvisers.length);
        populateAdviserFilter();
        populateDepartmentFilter();
      } else {
        console.error('Failed to load advisers:', response);
        showCustomAlert('Failed to load advisers', 'error');
      }
    } catch (error) {
      console.error('Error loading advisers:', error);
      adviserTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Error loading advisers</td></tr>';
    }
  }

  // Display advisers in table
  function displayAdvisers(advisers) {
    if (advisers.length === 0) {
      adviserTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #6b7280;">No advisers found</td></tr>';
      return;
    }

    adviserTable.innerHTML = advisers.map(adviser => `
      <tr>
        <td><strong>${adviser.fullName}</strong></td>
        <td>${adviser.email || 'N/A'}</td>
        <td>${adviser.department || 'N/A'}</td>
        <td>
          <span style="background: #ffffffff; color: #106034ff; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 500;">
            ${adviser.studentCount || 0} student${adviser.studentCount !== 1 ? 's' : ''}
          </span>
        </td>
        <td>
          <button class="view-students-btn" data-adviser="${adviser.fullName}" style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle;">visibility</span>
            View Students
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to view buttons
    document.querySelectorAll('.view-students-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const adviserName = e.currentTarget.getAttribute('data-adviser');
        await loadAdviserStudents(adviserName);
      });
    });
  }

  // Update adviser count
  function updateAdviserCount(count) {
    adviserCount.textContent = count;
  }

  // Populate department filter
  function populateDepartmentFilter() {
    if (!adviserDepartmentFilter) return;
    
    const departments = [...new Set(allAdvisers
      .map(a => a.department)
      .filter(d => d && d !== 'N/A')
    )].sort();
    
    adviserDepartmentFilter.innerHTML = '<option value="">All Departments</option>' +
      departments.map(dept => 
        `<option value="${dept}">${dept}</option>`
      ).join('');
  }

  // Filter advisers
  function filterAdvisers() {
    const search = adviserSearchInput.value.toLowerCase();
    const department = adviserDepartmentFilter ? adviserDepartmentFilter.value : '';

    const filtered = allAdvisers.filter(adviser => {
      const matchesSearch = adviser.fullName.toLowerCase().includes(search) ||
             (adviser.email && adviser.email.toLowerCase().includes(search));
      
      const matchesDepartment = !department || adviser.department === department;

      return matchesSearch && matchesDepartment;
    });

    displayAdvisers(filtered);
    updateAdviserCount(filtered.length);
  }

  // Event listener for adviser search and filters
  adviserSearchInput.addEventListener('input', filterAdvisers);
  if (adviserDepartmentFilter) {
    adviserDepartmentFilter.addEventListener('change', filterAdvisers);
  }

  // ============================================
  // MODAL FUNCTIONS (Adviser Students)
  // ============================================

  // Load students for a specific adviser (modal)
  async function loadAdviserStudents(adviserName) {
    try {
      modalAdviserName.textContent = adviserName;
      adviserStudentsModal.style.display = 'block';
      modalStudentTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading students...</td></tr>';

      const response = await apiClient.getStudentsByAdviser(adviserName);
      
      if (response.success) {
        currentAdviserStudents = response.data;
        displayModalStudents(currentAdviserStudents);
        updateModalStudentCount(currentAdviserStudents.length);
        
        // Populate modal grade filter (all grades initially)
        populateGradeFilter(modalGradeFilter);
      } else {
        console.error('Failed to load students for adviser:', response);
        modalStudentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Failed to load students</td></tr>';
      }
    } catch (error) {
      console.error('Error loading adviser students:', error);
      modalStudentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Error loading students</td></tr>';
    }
  }

  // Display students in modal
  function displayModalStudents(students) {
    if (students.length === 0) {
      modalStudentTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #6b7280;">This adviser has no students yet</td></tr>';
      return;
    }

    modalStudentTable.innerHTML = students.map(student => `
      <tr>
        <td>${student.studentId || 'N/A'}</td>
        <td>${student.fullName || `${student.lastName || ''}, ${student.firstName || ''}${student.middleName ? ' ' + student.middleName : ''}`}</td>
        <td>${student.level || 'N/A'}</td>
        <td>${student.grade || 'N/A'}</td>
        <td>${student.contactNumber || 'N/A'}</td>
      </tr>
    `).join('');
  }

  // Update modal student count
  function updateModalStudentCount(count) {
    modalStudentCount.textContent = count;
  }

  // Filter modal students
  function filterModalStudents() {
    const search = modalSearchInput.value.toLowerCase();
    const level = modalLevelFilter.value;
    const grade = modalGradeFilter.value;

    const filtered = currentAdviserStudents.filter(student => {
      const matchesSearch = !search || 
        (student.studentId && student.studentId.toLowerCase().includes(search)) ||
        (student.firstName && student.firstName.toLowerCase().includes(search)) ||
        (student.lastName && student.lastName.toLowerCase().includes(search)) ||
        (student.fullName && student.fullName.toLowerCase().includes(search));
      
      const matchesLevel = !level || student.level === level;
      
      // Normalize grade for comparison
      const matchesGrade = !grade || normalizeGrade(student.grade) === normalizeGrade(grade);

      return matchesSearch && matchesLevel && matchesGrade;
    });

    displayModalStudents(filtered);
    updateModalStudentCount(filtered.length);
  }

  // Event listeners for modal filters
  modalSearchInput.addEventListener('input', filterModalStudents);
  
  // Modal level filter - update grade options when level changes
  modalLevelFilter.addEventListener('change', function() {
    const selectedLevel = this.value;
    
    // Reset grade filter value
    modalGradeFilter.value = '';
    
    // Repopulate grade filter based on selected level
    populateGradeFilter(modalGradeFilter, selectedLevel);
    
    // Apply filters
    filterModalStudents();
  });
  
  modalGradeFilter.addEventListener('change', filterModalStudents);

  // ============================================
  // STUDENT VIEW FUNCTIONS (All Students)
  // ============================================

  // Load all students (for student view)
  async function loadAllStudents() {
    try {
      console.log('Loading all students...');
      studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading students...</td></tr>';
      
      const response = await apiClient.getAllStudentsForCounselor();
      
      console.log('Students API response:', response);
      
      if (response.success && response.data) {
        allStudents = response.data;
        console.log('Loaded students:', allStudents);
        displayStudents(allStudents);
        updateStudentCount(allStudents.length);
        
        // Populate grade filter for student view (all grades initially)
        populateGradeFilter(gradeFilter);
      } else {
        console.error('Invalid response format:', response);
        studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #ef4444;">No students found or invalid response</td></tr>';
        showCustomAlert('Failed to load students', 'error');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #ef4444;">Error loading students: ' + error.message + '</td></tr>';
    }
  }

  // Display all students in table
  function displayStudents(students) {
    console.log('Displaying students:', students);
    
    if (!students || students.length === 0) {
      studentTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #6b7280;">No students found</td></tr>';
      return;
    }

    studentTable.innerHTML = students.map(student => `
      <tr>
        <td>${student.studentId || 'N/A'}</td>
        <td>${student.fullName || `${student.lastName || ''}, ${student.firstName || ''}${student.middleName ? ' ' + student.middleName : ''}`}</td>
        <td>${student.level || 'N/A'}</td>
        <td>${student.grade || 'N/A'}</td>
        <td>${student.adviser || 'Unassigned'}</td>
        <td>${student.contactNumber || 'N/A'}</td>
      </tr>
    `).join('');
  }

  // Update student count
  function updateStudentCount(count) {
    studentCount.textContent = count;
  }

  // Populate adviser filter dropdown
  function populateAdviserFilter() {
    adviserFilter.innerHTML = '<option value="">All Advisers</option>' +
      allAdvisers.map(adviser => 
        `<option value="${adviser.fullName}">${adviser.fullName}</option>`
      ).join('');
  }

  // Filter all students
  function filterStudents() {
    const search = studentSearchInput.value.toLowerCase();
    const adviser = adviserFilter.value;
    const level = levelFilter.value;
    const grade = gradeFilter.value;

    const filtered = allStudents.filter(student => {
      const matchesSearch = !search || 
        (student.studentId && student.studentId.toLowerCase().includes(search)) ||
        (student.firstName && student.firstName.toLowerCase().includes(search)) ||
        (student.lastName && student.lastName.toLowerCase().includes(search)) ||
        (student.fullName && student.fullName.toLowerCase().includes(search));
      
      const matchesAdviser = !adviser || student.adviser === adviser;
      const matchesLevel = !level || student.level === level;
      
      // Normalize grade for comparison
      const matchesGrade = !grade || normalizeGrade(student.grade) === normalizeGrade(grade);

      return matchesSearch && matchesAdviser && matchesLevel && matchesGrade;
    });

    displayStudents(filtered);
    updateStudentCount(filtered.length);
  }

  // Event listeners for student filters
  studentSearchInput.addEventListener('input', filterStudents);
  adviserFilter.addEventListener('change', filterStudents);
  
  // Level filter - update grade options when level changes
  levelFilter.addEventListener('change', function() {
    const selectedLevel = this.value;
    
    // Reset grade filter value
    gradeFilter.value = '';
    
    // Repopulate grade filter based on selected level
    populateGradeFilter(gradeFilter, selectedLevel);
    
    // Apply filters
    filterStudents();
  });
  
  gradeFilter.addEventListener('change', filterStudents);

  // ============================================
  // VIEW TOGGLE
  // ============================================

  // View toggle functionality
  adviserViewBtn.addEventListener('click', () => {
    currentView = 'adviser';
    adviserViewBtn.classList.add('active');
    studentViewBtn.classList.remove('active');
    adviserListSection.style.display = 'block';
    studentListSection.style.display = 'none';
  });

  studentViewBtn.addEventListener('click', async () => {
    currentView = 'student';
    studentViewBtn.classList.add('active');
    adviserViewBtn.classList.remove('active');
    studentListSection.style.display = 'block';
    adviserListSection.style.display = 'none';
    
    await loadAllStudents();
  });

  // ============================================
  // MODAL CONTROLS
  // ============================================

  // Modal close functionality
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      adviserStudentsModal.style.display = 'none';
    });
  });

  closeModalBtn.addEventListener('click', () => {
    adviserStudentsModal.style.display = 'none';
  });

  // Click outside to close modal
  window.addEventListener('click', (e) => {
    if (e.target === adviserStudentsModal) {
      adviserStudentsModal.style.display = 'none';
    }
  });

  // ============================================
  // PROFILE DROPDOWN
  // ============================================

  // Profile dropdown
  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');

  if (profileButton && profileDropdown) {
    profileButton.addEventListener('click', function(e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
      if (!profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('active');
      }
    });
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  await loadAdvisers();
});