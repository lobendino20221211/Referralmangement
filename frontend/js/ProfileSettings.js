// Counselor/Staff ProfileSettings.js

document.addEventListener("DOMContentLoaded", async () => {
  console.log("ProfileSettings.js loaded");

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

  // --------------------------
  // DISPLAY USER PROFILE
  // --------------------------
  function displayUserProfile(user) {
    console.log("Displaying user data:", user);
    
    // Update profile header name and role (top section with photo)
    const profileHeaderName = document.querySelector(".profile-text h3");
    const profileHeaderRole = document.querySelector(".profile-text p");
    
    if (profileHeaderName) {
      // Remove "Welcome back," - just show the name
      profileHeaderName.textContent = user.fullName || user.username || "User";
      console.log("✅ Updated header name:", profileHeaderName.textContent);
    } else {
      console.error("❌ Could not find .profile-text h3");
    }
    
    if (profileHeaderRole) {
      profileHeaderRole.textContent = getRoleDisplayName(user.role);
      console.log("✅ Updated header role:", profileHeaderRole.textContent);
    } else {
      console.error("❌ Could not find .profile-text p");
    }

    // Get all input fields in profile-details
    const inputGroups = document.querySelectorAll(".profile-details .input-group");
    
    console.log(`Found ${inputGroups.length} input groups`);

    // More robust approach: target by label text
    inputGroups.forEach((group, index) => {
      const label = group.querySelector("label");
      const input = group.querySelector("input");
      
      if (!label || !input) {
        console.warn(`⚠️ Input group ${index} missing label or input`);
        return;
      }

      const labelText = label.textContent.trim().toLowerCase();

      // Set input value based on label
      if (labelText.includes("full name") || labelText.includes("name")) {
        input.value = user.fullName || user.username || "";
        console.log(`✅ Set Full Name to: "${input.value}"`);
      } else if (labelText.includes("email")) {
        input.value = user.email || "";
        console.log(`✅ Set Email to: "${input.value}"`);
      }

      // Make read-only with proper styling for visibility
      input.readOnly = true;
      input.setAttribute('readonly', 'readonly');
    });

    // Update profile images - Generate avatar based on name
    const profilePicContainer = document.querySelector(".profile-pic");
    const headerProfileButton = document.getElementById("profileButton");
    const userName = user.fullName || user.username || "User";
    
    if (user.profilePhoto || user.avatar || user.photo) {
      // User has a profile photo - try to load it
      const photoUrl = user.profilePhoto || user.avatar || user.photo;
      
      // Update main profile pic (80px)
      if (profilePicContainer) {
        const fallbackAvatar = generateAvatar(userName, 80);
        profilePicContainer.innerHTML = `
          <img src="${photoUrl}" 
               alt="${userName}" 
               style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #10b981;"
               onerror="this.style.display='none'; this.parentElement.innerHTML='${fallbackAvatar.replace(/'/g, "&#39;")}<div class=\\'status-ring\\'></div>';">
          <div class="status-ring"></div>
        `;
        console.log(`✅ Attempting to load profile image:`, photoUrl);
      }
      
      // Update header profile button (40px)
      if (headerProfileButton) {
        const fallbackAvatar = generateAvatar(userName, 40);
        headerProfileButton.innerHTML = `
          <img src="${photoUrl}" 
               alt="${userName}"
               style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid #10b981;"
               onerror="this.style.display='none'; this.parentElement.innerHTML='${fallbackAvatar.replace(/'/g, "&#39;")}';">
        `;
        console.log(`✅ Updated header profile image`);
      }
    } else {
      // No profile photo - use generated avatar
      console.log(`ℹ️ No profile photo provided, generating avatar with initial: ${userName.charAt(0).toUpperCase()}`);
      
      // Update main profile pic (80px)
      if (profilePicContainer) {
        profilePicContainer.innerHTML = `
          ${generateAvatar(userName, 80)}
          <div class="status-ring"></div>
        `;
        console.log(`✅ Generated main profile avatar`);
      }
      
      // Update header profile button (40px)
      if (headerProfileButton) {
        headerProfileButton.innerHTML = generateAvatar(userName, 40);
        headerProfileButton.style.cursor = 'pointer';
        console.log(`✅ Generated header profile avatar`);
      }
    }
  }

  // --------------------------
  // GET ROLE DISPLAY NAME
  // --------------------------
  function getRoleDisplayName(role) {
    const roleNames = {
      "Admin": "Administrator",
      "Teacher": "Teacher / Adviser",
      "Counselor": "Counselor",
      "Student": "Student"
    };
    return roleNames[role] || role || "User";
  }

  // --------------------------
  // LOAD PROFILE ON PAGE LOAD
  // --------------------------
  loadUserProfile();
});