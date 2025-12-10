// Fixed Category.js with proper profile avatar loading

document.addEventListener("DOMContentLoaded", async () => {
  // Load user profile first
  await loadUserProfile();
  
  // Setup profile dropdown after avatar is created
  setupProfileDropdown();
  
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

  // Initialize category management
  initializeCategoryManagement();
});

// Load user profile and display avatar
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

// ====================================
// CATEGORY MANAGEMENT
// ====================================

let categoryToDelete = null;

function initializeCategoryManagement() {
  // Load categories
  loadCategories();

  // Add category button
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
  }

  // Add category form
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', handleAddCategory);
  }

  // Edit category form
  const editCategoryForm = document.getElementById('editCategoryForm');
  if (editCategoryForm) {
    editCategoryForm.addEventListener('submit', handleEditCategory);
  }

  // Modal close buttons
  setupModalControls();

  // Character counters
  setupCharacterCounters();
}

function setupModalControls() {
  // Add modal
  const closeAddModal = document.getElementById('closeAddModal');
  const cancelAddBtn = document.getElementById('cancelAddBtn');
  if (closeAddModal) closeAddModal.addEventListener('click', closeAddCategoryModal);
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeAddCategoryModal);

  // Edit modal
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (closeEditModal) closeEditModal.addEventListener('click', closeEditCategoryModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditCategoryModal);

  // Delete modal
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteCategoryModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteCategoryModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeleteCategory);

  // Click outside to close
  const addModal = document.getElementById('addCategoryModal');
  const editModal = document.getElementById('editCategoryModal');
  const deleteModal = document.getElementById('deleteCategoryModal');

  window.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddCategoryModal();
    if (e.target === editModal) closeEditCategoryModal();
    if (e.target === deleteModal) closeDeleteCategoryModal();
  });
}

function setupCharacterCounters() {
  const inputs = [
    { id: 'categoryName', max: 50 },
    { id: 'categoryDescription', max: 200 },
    { id: 'editCategoryName', max: 50 },
    { id: 'editCategoryDescription', max: 200 }
  ];

  inputs.forEach(({ id, max }) => {
    const element = document.getElementById(id);
    if (element) {
      const counter = document.createElement('div');
      counter.className = 'char-counter';
      element.parentNode.appendChild(counter);

      const updateCounter = () => {
        const length = element.value.length;
        counter.textContent = `${length}/${max} characters`;
        
        if (length > max * 0.9) counter.classList.add('warning');
        else counter.classList.remove('warning');
        
        if (length === max) counter.classList.add('danger');
        else counter.classList.remove('danger');
      };

      element.addEventListener('input', updateCounter);
      updateCounter();
    }
  });
}

// Load all categories
async function loadCategories() {
  try {
    const response = await apiClient.getCategories();
    
    console.log('Categories response:', response); // Debug log
    
    if (response.success) {
      // Handle different response structures
      const categories = response.data || response.categories || [];
      displayCategories(categories);
    } else {
      showError(response.error || 'Failed to load categories');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showError('Error loading categories');
  }
}

// Display categories in grid
function displayCategories(categories) {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  if (!categories || categories.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">category</span>
        <h3>No Categories Yet</h3>
        <p>Start by adding your first incident category</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map(category => `
    <div class="category-card">
      <div class="category-info">
        <div class="category-name">
          <span class="material-symbols-outlined">label</span>
          ${escapeHtml(category.name)}
        </div>
        <div class="category-description">
          ${category.description ? escapeHtml(category.description) : '<em>No description provided</em>'}
        </div>
        <div class="category-meta">
          <span>
            <span class="material-symbols-outlined">schedule</span>
            ${formatDate(category.createdAt)}
          </span>
          ${category.usageCount !== undefined ? `
            <span>
              <span class="material-symbols-outlined">article</span>
              ${category.usageCount} referrals
            </span>
          ` : ''}
        </div>
      </div>
      <div class="category-actions">
        <button class="btn-edit" onclick="openEditCategoryModal('${category._id}')">
          <span class="material-symbols-outlined">edit</span>
          Edit
        </button>
        <button class="btn-delete-category" onclick="openDeleteCategoryModal('${category._id}', '${escapeHtml(category.name)}')">
          <span class="material-symbols-outlined">delete</span>
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Show error in grid
function showError(message) {
  const grid = document.getElementById('categoriesGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="loading-message" style="color: #ef4444;">
        ${message}
      </div>
    `;
  }
}

// Open add category modal
function openAddCategoryModal() {
  const modal = document.getElementById('addCategoryModal');
  const form = document.getElementById('addCategoryForm');
  if (form) form.reset();
  if (modal) modal.style.display = 'block';
}

// Close add category modal
function closeAddCategoryModal() {
  const modal = document.getElementById('addCategoryModal');
  if (modal) modal.style.display = 'none';
}

// Handle add category
async function handleAddCategory(e) {
  e.preventDefault();

  const name = document.getElementById('categoryName').value.trim();
  const description = document.getElementById('categoryDescription').value.trim();

  if (!name) {
    showAlert('Category name is required', 'error');
    return;
  }

  try {
    const response = await apiClient.createCategory({
      name,
      description: description || undefined
    });

    console.log('Create category response:', response); // Debug log

    if (response.success) {
      showAlert('Category added successfully!', 'success');
      closeAddCategoryModal();
      loadCategories();
    } else {
      showAlert(response.error || response.message || 'Failed to add category', 'error');
    }
  } catch (error) {
    console.error('Error adding category:', error);
    showAlert('Error adding category. Please try again.', 'error');
  }
}

// Open edit category modal
async function openEditCategoryModal(categoryId) {
  try {
    const response = await apiClient.getCategoryById(categoryId);
    
    console.log('Get category response:', response); // Debug log
    
    if (response.success) {
      const category = response.data || response.category;
      document.getElementById('editCategoryId').value = category._id;
      document.getElementById('editCategoryName').value = category.name;
      document.getElementById('editCategoryDescription').value = category.description || '';
      
      const modal = document.getElementById('editCategoryModal');
      if (modal) modal.style.display = 'block';
    } else {
      showAlert('Failed to load category details', 'error');
    }
  } catch (error) {
    console.error('Error loading category:', error);
    showAlert('Error loading category details', 'error');
  }
}

// Close edit category modal
function closeEditCategoryModal() {
  const modal = document.getElementById('editCategoryModal');
  if (modal) modal.style.display = 'none';
}

// Handle edit category
async function handleEditCategory(e) {
  e.preventDefault();

  const id = document.getElementById('editCategoryId').value;
  const name = document.getElementById('editCategoryName').value.trim();
  const description = document.getElementById('editCategoryDescription').value.trim();

  if (!name) {
    showAlert('Category name is required', 'error');
    return;
  }

  try {
    const response = await apiClient.updateCategory(id, {
      name,
      description: description || undefined
    });

    console.log('Update category response:', response); // Debug log

    if (response.success) {
      showAlert('Category updated successfully!', 'success');
      closeEditCategoryModal();
      loadCategories();
    } else {
      showAlert(response.error || response.message || 'Failed to update category', 'error');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    showAlert('Error updating category. Please try again.', 'error');
  }
}

// Open delete category modal
function openDeleteCategoryModal(categoryId, categoryName) {
  categoryToDelete = categoryId;
  
  const message = document.getElementById('deleteCategoryMessage');
  if (message) {
    message.innerHTML = `Are you sure you want to delete the category <strong>"${categoryName}"</strong>?`;
  }

  const modal = document.getElementById('deleteCategoryModal');
  if (modal) modal.style.display = 'block';
}

// Close delete category modal
function closeDeleteCategoryModal() {
  const modal = document.getElementById('deleteCategoryModal');
  if (modal) modal.style.display = 'none';
  categoryToDelete = null;
}

// Confirm delete category
async function confirmDeleteCategory() {
  if (!categoryToDelete) return;

  try {
    const response = await apiClient.deleteCategory(categoryToDelete);

    console.log('Delete category response:', response); // Debug log

    if (response.success) {
      showAlert('Category deleted successfully', 'success');
      closeDeleteCategoryModal();
      loadCategories();
    } else {
      showAlert(response.error || response.message || 'Failed to delete category', 'error');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    showAlert('Error deleting category. Please try again.', 'error');
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
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

// Make functions globally accessible
window.openEditCategoryModal = openEditCategoryModal;
window.openDeleteCategoryModal = openDeleteCategoryModal;