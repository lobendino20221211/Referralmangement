//Teacher/Adviser Home.js - ENHANCED WITH DIRECT REFERRAL VIEW

document.addEventListener("DOMContentLoaded", async () => {
  // ========== RESPONSIVE SIDEBAR FUNCTIONALITY ==========
  const sidebarToggle = document.getElementById('sidebarToggle');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.querySelector('.main-content');

  // Function to open sidebar
  function openSidebar() {
    sidebar.classList.add('active');
    if (sidebarOverlay) {
      sidebarOverlay.classList.add('active');
    }
  }

  // Function to close sidebar
  function closeSidebar() {
    sidebar.classList.remove('active');
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('active');
    }
  }

  // Toggle sidebar on hamburger click (for mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (sidebar.classList.contains('active')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Toggle sidebar on menu button click
  if (menuToggle) {
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (sidebar.classList.contains('active')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Close sidebar when clicking overlay
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar when clicking on main content (mobile only)
  if (mainContent) {
    mainContent.addEventListener('click', function() {
      if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });
  }

  // Close sidebar when clicking outside (mobile only)
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && 
          !sidebarToggle?.contains(e.target) && 
          !menuToggle?.contains(e.target)) {
        closeSidebar();
      }
    }
  });

  // Handle window resize - close sidebar when expanding to desktop
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 768) {
        closeSidebar();
      }
    }, 250);
  });

  // ========== NAVIGATION ACTIVE STATE ==========
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    if (itemHref === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
    
    // Close sidebar when nav item is clicked on mobile
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // ========== PROFILE DROPDOWN SETUP ==========
  setupProfileDropdown();
  
  // ========== LOAD USER PROFILE ==========
  await loadUserProfile();
  
  // ========== LOAD REFERRALS ==========
  loadRecentReferrals();
});

// --------------------------
// SETUP PROFILE DROPDOWN
// --------------------------
function setupProfileDropdown() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    // Toggle dropdown when clicking profile button
    profileButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!profileDropdown.contains(event.target)) {
        profileDropdown.classList.remove("show");
      }
    });

    // Prevent dropdown from closing when clicking inside dropdown content
    const dropdownContent = profileDropdown.querySelector('.dropdown-content');
    if (dropdownContent) {
      dropdownContent.addEventListener("click", (e) => {
        // Allow links to work normally, just prevent event from bubbling up
        e.stopPropagation();
      });
    }
  }
}

// --------------------------
// LOAD USER PROFILE (SINGLE CALL)
// --------------------------
async function loadUserProfile() {
  try {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.error("No auth token found");
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please login first");
      } else {
        alert("Please login first");
      }
      setTimeout(() => {
        window.location.href = "../../pages/LoginForm.html";
      }, 2000);
      return;
    }

    console.log("Fetching user profile...");
    
    // Use API Client
    const response = await apiClient.getUserProfile();
    
    console.log("Profile Response:", response);

    if (response.success && response.data) {
      displayUserProfile(response.data);
    } else {
      console.error("Failed to load profile:", response.message);
      if (typeof customAlert !== 'undefined') {
        customAlert.error(response.message || "Failed to load profile");
      } else {
        alert(response.message || "Failed to load profile");
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Error loading profile: " + error.message);
    } else {
      alert("Error loading profile: " + error.message);
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

  // Update welcome message if exists
  const welcomeTitle = document.getElementById("welcomeTitle");
  if (welcomeTitle) {
    const name = userData.fullName || userData.username || 'User';
    welcomeTitle.textContent = `Welcome back, ${name}`;
  }
}

// --------------------------
// GENERATE AVATAR WITH INITIAL (NO SHADOW)
// --------------------------
function generateAvatar(name, size = 80) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size === 80 ? 50 : 24;
  
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

// Load recent referrals
async function loadRecentReferrals() {
  try {
    const response = await apiClient.get('/referrals/recent');
    
    if (response.success) {
      displayRecentReferrals(response.data);
    } else {
      console.error('Failed to load recent referrals');
    }
  } catch (error) {
    console.error('Error loading recent referrals:', error);
    const tbody = document.getElementById('studentTable');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error loading referrals</td></tr>';
    }
  }
}

// Display recent referrals in table with clickable rows that open specific referral details
function displayRecentReferrals(referrals) {
  const tbody = document.getElementById('studentTable');
  if (!tbody) return;

  if (referrals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No referrals yet</td></tr>';
    return;
  }

  tbody.innerHTML = referrals.map(referral => {
    // Store the complete referral data
    const referralData = JSON.stringify({
      referralId: referral.referralId,
      studentId: referral.studentId,
      studentName: referral.studentName,
      status: referral.status,
      severity: referral.severity,
      category: referral.category,
      reason: referral.reason,
      description: referral.description,
      referralDate: referral.referralDate || referral.createdAt,
      referredBy: referral.referredBy,
      notes: referral.notes,
      level: referral.level,
      grade: referral.grade
    }).replace(/"/g, '&quot;');
    
    return `
      <tr style="cursor: pointer; transition: background-color 0.2s;" 
          data-referral='${referralData}'
          onclick="viewReferralDetails(this.getAttribute('data-referral'))">
        <td>${referral.referralId}</td>
        <td>${referral.studentName}</td>
        <td>${new Date(referral.createdAt).toLocaleDateString()}</td>
        <td><span class="btn-view-status status-${referral.status.replace(/\s+/g, '-').toLowerCase()}">${referral.status}</span></td>
      </tr>
    `;
  }).join('');
  
  // Add hover effect to rows
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const referralData = row.getAttribute('data-referral');
    if (referralData) {
      row.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      });
      row.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
      });
    }
  });
}

// View specific referral details - Navigate to My Students and show modal
function viewReferralDetails(referralDataStr) {
  try {
    const referralData = JSON.parse(referralDataStr.replace(/&quot;/g, '"'));
    
    console.log('🎯 Viewing referral details:', referralData);
    
    // Store the referral data in sessionStorage
    sessionStorage.setItem('viewReferralDetails', JSON.stringify(referralData));
    
    // Navigate to StudentProfile page
    window.location.href = '../html/StudentProfile.html';
    
  } catch (error) {
    console.error('Error parsing referral data:', error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error('Failed to load referral details');
    } else {
      alert('Failed to load referral details');
    }
  }
}

// Make function globally accessible
window.viewReferralDetails = viewReferralDetails;