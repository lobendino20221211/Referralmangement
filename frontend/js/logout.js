// ============================================
// LOGOUT HANDLER - Working with custom-alert.js
// ============================================

function handleLogout(event) {
  event.preventDefault();
  
  // Check if customAlert is loaded
  if (typeof customAlert === 'undefined') {
    console.error('customAlert not loaded yet');
    // Fallback to native confirm
    if (confirm('Are you sure you want to log out?')) {
      showThankYouAndRedirect();
    }
    return;
  }
  
  customAlert.confirm(
    "Are you sure you want to log out?",
    () => {
      // User clicked "Confirm" - show thank you message
      showThankYouAndRedirect();
    },
    "Logout Confirmation"
  );
}

function showThankYouAndRedirect() {
  // Create thank you overlay
  const thankYouHTML = `
    <div id="thankYouOverlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    ">
      <div style="
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 40px 60px;
        border-radius: 16px;
        text-align: center;
        animation: scaleUp 0.5s ease;
        box-shadow: 0 20px 60px rgba(16, 185, 129, 0.3);
      ">
        <div style="
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.2);
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleUp 0.5s ease;
        ">
          <span style="color: #10b981; font-size: 50px; font-weight: bold;">✓</span>
        </div>
        <h2 style="color: #10b981; margin-bottom: 15px; font-size: 32px;">Thank You!</h2>
        <p style="color: #94a3b8; font-size: 18px; margin: 0;">You have been successfully logged out.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 10px;">Redirecting to login page...</p>
      </div>
    </div>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleUp {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', thankYouHTML);
  
  // Clear any session data
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  } catch (e) {
    console.log('Storage clear skipped:', e);
  }
  
  // Redirect to login page after 2 seconds
  setTimeout(() => {
    window.location.href = '../../pages/LoginForm.html';
  }, 2000);
}

// ============================================
// SETUP LOGOUT HANDLERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔐 Logout handler initialized");
  
  // Wait a bit to ensure customAlert is loaded
  setTimeout(() => {
    // Find all logout links - multiple possible patterns
    const logoutSelectors = [
      'a[href="../../pages/LoginForm.html"]',
      'a[href="../pages/LoginForm.html"]',
      'a[href*="LoginForm.html"]'
    ];
    
    let logoutLinksFound = 0;
    
    logoutSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        // Check if it's a logout link (contains logout icon or text)
        const isLogoutLink = link.innerHTML.includes('logout') || 
                            link.textContent.toLowerCase().includes('logout');
        
        if (isLogoutLink) {
          console.log("✅ Logout link found and handler attached");
          link.addEventListener('click', handleLogout);
          logoutLinksFound++;
        }
      });
    });
    
    if (logoutLinksFound === 0) {
      console.warn("⚠️ No logout links found. Check your HTML structure.");
    }

  }, 100); // Small delay to ensure customAlert is loaded
});