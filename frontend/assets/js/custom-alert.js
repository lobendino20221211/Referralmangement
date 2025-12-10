// Custom Alert System
class CustomAlert {
  constructor() {
    this.createOverlay()
  }

  createOverlay() {
    // Check if overlay already exists
    if (document.getElementById('customAlertOverlay')) return

    const overlay = document.createElement('div')
    overlay.id = 'customAlertOverlay'
    overlay.className = 'custom-alert-overlay'
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <div class="custom-alert-icon" id="alertIcon">
          <span class="material-symbols-outlined" id="alertIconSymbol">check_circle</span>
        </div>
        <h3 class="custom-alert-title" id="alertTitle">Success</h3>
        <p class="custom-alert-message" id="alertMessage">Operation completed successfully!</p>
        <div class="custom-alert-actions" id="alertActions">
          <button class="custom-alert-btn primary" id="alertOkBtn">OK</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close()
      }
    })

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('show')) {
        this.close()
      }
    })
  }

  show(options = {}) {
    const {
      type = 'success', // success, error, warning, info
      title = 'Success',
      message = 'Operation completed successfully!',
      confirmText = 'OK',
      cancelText = null,
      onConfirm = null,
      onCancel = null
    } = options

    const overlay = document.getElementById('customAlertOverlay')
    const icon = document.getElementById('alertIcon')
    const iconSymbol = document.getElementById('alertIconSymbol')
    const titleEl = document.getElementById('alertTitle')
    const messageEl = document.getElementById('alertMessage')
    const actionsEl = document.getElementById('alertActions')

    // Set icon based on type
    icon.className = `custom-alert-icon ${type}`
    const icons = {
      success: '✓',
      error: 'X',
      warning: '!',
      info: 'i'
    }
    iconSymbol.textContent = icons[type] || icons.info

    // Set content
    titleEl.textContent = title
    messageEl.textContent = message

    // Set up buttons
    actionsEl.innerHTML = ''

    if (cancelText) {
      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'custom-alert-btn secondary'
      cancelBtn.textContent = cancelText
      cancelBtn.onclick = () => {
        this.close()
        if (onCancel) onCancel()
      }
      actionsEl.appendChild(cancelBtn)
    }

    const confirmBtn = document.createElement('button')
    confirmBtn.className = `custom-alert-btn ${type === 'error' ? 'danger' : 'primary'}`
    confirmBtn.textContent = confirmText
    confirmBtn.onclick = () => {
      this.close()
      if (onConfirm) onConfirm()
    }
    actionsEl.appendChild(confirmBtn)

    // Show overlay
    overlay.classList.add('show')
    document.body.style.overflow = 'hidden'

    // Auto focus on confirm button
    setTimeout(() => confirmBtn.focus(), 100)
  }

  close() {
    const overlay = document.getElementById('customAlertOverlay')
    overlay.classList.remove('show')
    document.body.style.overflow = ''
  }

  // Helper methods
  success(message, title = 'Success!') {
    this.show({
      type: 'success',
      title,
      message
    })
  }

  error(message, title = 'Error!') {
    this.show({
      type: 'error',
      title,
      message
    })
  }

  warning(message, title = 'Warning!') {
    this.show({
      type: 'warning',
      title,
      message
    })
  }

  info(message, title = 'Info') {
    this.show({
      type: 'info',
      title,
      message
    })
  }

  confirm(message, onConfirm, title = 'Confirm Action') {
    this.show({
      type: 'warning',
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm
    })
  }
}

// Create global instance
const customAlert = new CustomAlert()