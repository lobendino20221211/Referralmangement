// Simplified Dashboard.js - User Accounts & Categories Only

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 Simplified Dashboard.js loaded");

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

  // Load user profile first
  await loadUserProfile();
  
  // Setup profile dropdown after avatar is created
  setupProfileDropdown();

  // Load statistics
  loadUserAccountStats();
  loadCategoryCount();

  console.log("✅ Dashboard initialized successfully");
});

// Load user profile and display welcome message + avatar
async function loadUserProfile() {
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const welcomeTitle = document.getElementById("welcomeTitle");
      if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userProfile.data.fullName || userProfile.data.username}`;
      }
      
      // Generate avatar for profile button
      const profileButton = document.getElementById("profileButton");
      if (profileButton) {
        const fullName = userProfile.data.fullName || userProfile.data.username || "User";
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        // Apply styling to profile button
        profileButton.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: 2px solid rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        `;
        profileButton.textContent = initials;
        console.log("✅ Avatar created with initials:", initials);
        
        // Hover effect
        profileButton.addEventListener('mouseenter', () => {
          profileButton.style.transform = 'scale(1.1)';
          profileButton.style.borderColor = '#10b981';
        });
        profileButton.addEventListener('mouseleave', () => {
          profileButton.style.transform = 'scale(1)';
          profileButton.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        });
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    // Set default avatar if profile fails to load
    const profileButton = document.getElementById("profileButton");
    if (profileButton) {
      profileButton.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        border: 2px solid rgba(16, 185, 129, 0.3);
        transition: all 0.3s ease;
      `;
      profileButton.textContent = "U";
    }
  }
}

// Setup profile dropdown functionality
function setupProfileDropdown() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
      console.log("🔵 Profile dropdown toggled");
    });

    window.addEventListener("click", (event) => {
      if (!event.target.closest("#profileDropdown")) {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// ========== LOAD USER ACCOUNT STATISTICS ==========
async function loadUserAccountStats() {
  try {
    // Fetch all users
    const response = await apiClient.get('/users');
    
    if (response.success) {
      const users = response.data || [];
      
      // Count users by role
      const roleCounts = {
        admin: 0,
        counselor: 0,
        teacher: 0
      };
      
      users.forEach(user => {
        const role = user.role?.toLowerCase();
        if (roleCounts.hasOwnProperty(role)) {
          roleCounts[role]++;
        }
      });
      
      // Update stat cards with animation
      updateStatCard("adminCount", roleCounts.admin);
      updateStatCard("counselorCount", roleCounts.counselor);
      updateStatCard("teacherCount", roleCounts.teacher);
      
      console.log("✅ User stats loaded:", roleCounts);
    } else {
      console.error("❌ Failed to load user stats");
      setErrorStats();
    }
  } catch (error) {
    console.error("❌ Error loading user account stats:", error);
    setErrorStats();
  }
}

// ========== LOAD CATEGORY COUNT ==========
async function loadCategoryCount() {
  try {
    const response = await apiClient.getCategories();
    
    if (response.success) {
      const categories = response.data || response.categories || [];
      const categoryCount = categories.length;
      
      // Update category count stat card with animation
      updateStatCard("categoryCount", categoryCount);
      
      console.log("✅ Category count loaded:", categoryCount);
    } else {
      console.error("❌ Failed to load category count");
      document.getElementById("categoryCount").textContent = "0";
    }
  } catch (error) {
    console.error("❌ Error loading category count:", error);
    document.getElementById("categoryCount").textContent = "0";
  }
}

// ========== HELPER: UPDATE STAT CARD WITH ANIMATION ==========
function updateStatCard(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Animate the number counting up
  const duration = 1000; // 1 second
  const startValue = 0;
  const endValue = value;
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = endValue;
    }
  }
  
  requestAnimationFrame(animate);
}

// ========== HELPER: SET ERROR STATE FOR STATS ==========
function setErrorStats() {
  document.getElementById("adminCount").textContent = "0";
  document.getElementById("counselorCount").textContent = "0";
  document.getElementById("teacherCount").textContent = "0";
}