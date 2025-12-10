// frontend/js/UserManagement.js

document.addEventListener("DOMContentLoaded", async () => {
  // Load user profile first
  await loadUserProfile();
  
  // Setup profile dropdown after avatar is created
  setupProfileDropdown();
  
  // Load other components
  loadUsers();
  setupSearchFilter();
  setupFormSubmit();
  setupActionDelegation();
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

// Load Users
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Loading users...</td></tr>';

  try {
    const response = await apiClient.getAllUsers();
    if (response.success && response.data.length > 0) {
      displayUsers(response.data);
    } else {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No users found</td></tr>';
    }
  } catch (error) {
    console.error(error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error("Failed to load users");
    }
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Error loading users</td></tr>';
  }
}

// Display Users
function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.fullName}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="badge badge-${(user.role || '').toLowerCase()}">${user.role}</span></td>
      <td>${user.department || 'N/A'}</td>
      <td><span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn-action" data-action="toggleStatus" data-user-id="${user._id}" data-current-status="${user.isActive}" title="${user.isActive ? 'Deactivate' : 'Activate'}">
          <span class="material-symbols-outlined">${user.isActive ? 'block' : 'check_circle'}</span>
        </button>
        <button class="btn-action" data-action="resetPassword" data-user-id="${user._id}" title="Reset Password">
          <span class="material-symbols-outlined">lock_reset</span>
        </button>
        <button class="btn-action delete" data-action="deleteUser" data-user-id="${user._id}" data-user-name="${user.fullName}" title="Delete User">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

// Search Filter
function setupSearchFilter() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll("#usersTableBody tr").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
    });
  });
}

// Form Submit
function setupFormSubmit() {
  const form = document.getElementById("createUserForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      username: document.getElementById("username").value.trim(),
      role: document.getElementById("role").value,
      department: document.getElementById("department").value.trim(),
      password: document.getElementById("temporaryPassword").value,
      requirePasswordChange: true
    };

    if (!formData.fullName || !formData.email || !formData.username || !formData.role || !formData.password) {
      if (typeof customAlert !== 'undefined') {
        customAlert.error("Please fill in all required fields");
      } else {
        alert("Please fill in all required fields");
      }
      return;
    }

    try {
      const response = await apiClient.createUser(formData);
      if (response.success) {
        let successMessage = "User created successfully! A temporary password email was sent.";
        
        // Show additional message if Teacher was created
        if (formData.role === 'Teacher') {
          successMessage += " This teacher is now available as an adviser in the Counselor portal.";
        }
        
        if (typeof customAlert !== 'undefined') {
          customAlert.success(successMessage);
        } else {
          alert(successMessage);
        }
        closeCreateUserModal();
        form.reset();
        await loadUsers();
      } else {
        if (typeof customAlert !== 'undefined') {
          customAlert.error(response.message || "Failed to create user");
        } else {
          alert(response.message || "Failed to create user");
        }
      }
    } catch (error) {
      console.error(error);
      if (typeof customAlert !== 'undefined') {
        customAlert.error(error.message || "Failed to create user");
      } else {
        alert(error.message || "Failed to create user");
      }
    }
  });
}

// Modal Functions
function openCreateUserModal() { 
  document.getElementById("createUserModal").classList.add("show"); 
}

function closeCreateUserModal() { 
  document.getElementById("createUserModal").classList.remove("show"); 
  document.getElementById("createUserForm").reset();
}

// Make functions globally available
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;

// Action Delegation
function setupActionDelegation() {
  const tbody = document.getElementById("usersTableBody");
  tbody.addEventListener("click", async (event) => {
    const btn = event.target.closest(".btn-action");
    if (!btn) return;
    handleUserAction({ currentTarget: btn });
  });
}

// Handle User Actions
async function handleUserAction(event) {
  const btn = event.currentTarget;
  const action = btn.dataset.action;
  const userId = btn.dataset.userId;

  try {
    switch(action) {
      case "toggleStatus":
        const currentStatus = btn.dataset.currentStatus === 'true';
        const statusAction = currentStatus ? "deactivate" : "activate";
        
        if (typeof customAlert !== 'undefined') {
          customAlert.confirm(
            `Are you sure you want to ${statusAction} this user?`,
            async () => {
              const response = await apiClient.toggleUserStatus(userId, !currentStatus);
              if (response.success) {
                customAlert.success(`User ${statusAction}d successfully`);
                await loadUsers();
              } else {
                customAlert.error(response.message || response.error || "Failed");
              }
            },
            "Confirm Action"
          );
        } else {
          if (confirm(`Are you sure you want to ${statusAction} this user?`)) {
            const response = await apiClient.toggleUserStatus(userId, !currentStatus);
            if (response.success) {
              alert(`User ${statusAction}d successfully`);
              await loadUsers();
            } else {
              alert(response.message || response.error || "Failed");
            }
          }
        }
        break;

      case "resetPassword":
        const newPassword = prompt("Enter new temporary password (min 6 characters):");
        if (!newPassword || newPassword.length < 6) {
          if (typeof customAlert !== 'undefined') {
            customAlert.error("Password must be at least 6 characters");
          } else {
            alert("Password must be at least 6 characters");
          }
          return;
        }
        const resetResponse = await apiClient.adminResetPassword(userId, newPassword);
        if (resetResponse.success) {
          if (typeof customAlert !== 'undefined') {
            customAlert.success("Password reset successfully. Email sent to user.");
          } else {
            alert("Password reset successfully. Email sent to user.");
          }
          await loadUsers();
        } else {
          if (typeof customAlert !== 'undefined') {
            customAlert.error(resetResponse.message || "Failed to reset password");
          } else {
            alert(resetResponse.message || "Failed to reset password");
          }
        }
        break;

      case "deleteUser":
        const userName = btn.dataset.userName;
        
        if (typeof customAlert !== 'undefined') {
          customAlert.show({
            type: 'warning',
            title: 'Delete User',
            message: `Delete "${userName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
              const delResponse = await apiClient.deleteUser(userId);
              if (delResponse.success) {
                customAlert.success("User deleted successfully");
                await loadUsers();
              } else {
                customAlert.error(delResponse.message || "Failed to delete user");
              }
            }
          });
        } else {
          if (confirm(`Delete "${userName}"? This action cannot be undone.`)) {
            const delResponse = await apiClient.deleteUser(userId);
            if (delResponse.success) {
              alert("User deleted successfully");
              await loadUsers();
            } else {
              alert(delResponse.message || "Failed to delete user");
            }
          }
        }
        break;
    }
  } catch (error) {
    console.error(error);
    if (typeof customAlert !== 'undefined') {
      customAlert.error(error.message || "An unexpected error occurred");
    } else {
      alert(error.message || "An unexpected error occurred");
    }
  }
}

// Export functions globally for use in other scripts (like logout.js)
// Use the customAlert system if available
window.showAlert = function(title, msg, type="success") {
  if (typeof customAlert !== 'undefined') {
    if (type === 'success') {
      customAlert.success(msg, title);
    } else if (type === 'error') {
      customAlert.error(msg, title);
    } else if (type === 'warning') {
      customAlert.warning(msg, title);
    } else {
      customAlert.info(msg, title);
    }
  } else {
    alert(`${title}: ${msg}`);
  }
};

window.showConfirm = function(title, msg, onConfirm, isDanger=false) {
  if (typeof customAlert !== 'undefined') {
    customAlert.confirm(msg, onConfirm, title);
  } else {
    if (confirm(`${title}: ${msg}`)) {
      onConfirm();
    }
  }
};

// Close modal on outside click
window.onclick = (e) => {
  if (e.target === document.getElementById("createUserModal")) {
    closeCreateUserModal();
  }
};