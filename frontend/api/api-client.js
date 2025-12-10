// ============================================
// COMPLETE API-CLIENT.JS - With Student Submissions + All Endpoints
// ============================================

const API_BASE_URL = "http://localhost:3000/api";

class APIClient {
  constructor() {
    this.token = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
    console.log("✅ APIClient initialized");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token); localStorage.setItem("authToken", token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  }

  getHeaders(isFileUpload = false) {
    const headers = {};
    
    if (!isFileUpload) {
      headers["Content-Type"] = "application/json";
    }
    
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFileUpload = options.body instanceof FormData;
    
    const config = { 
      ...options, 
      headers: this.getHeaders(isFileUpload) 
    };
    
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log(`📥 Response [${response.status}]:`, data);
      
      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || "Request failed",
          message: data.message || data.error || "Request failed" 
        };
      }
      
      return { 
        success: true, 
        message: data.message || "Success", 
        ...data
      };
    } catch (error) {
      console.error("❌ API request error:", error);
      return { 
        success: false, 
        error: error.message || "Request failed",
        message: error.message || "Request failed" 
      };
    }
  }

  // ============================================
  // GENERIC HTTP METHODS
  // ============================================
  
  async get(endpoint) {
    return this.request(endpoint, {
      method: "GET"
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE"
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }

  // ============================================
  // FILE UPLOAD METHOD
  // ============================================
  
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: "POST",
      body: formData
    });
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  async login(username, password) { 
    return this.post("/auth/login", { username, password }); 
  }
  
  async forgotPassword({ username, email }) { 
    return this.post("/auth/forgot-password", { username, email }); 
  }
  
  // ============================================
  // USER ENDPOINTS
  // ============================================
  
  async getUserProfile() { 
    return this.get("/users/profile"); 
  }
  
  async changePassword(currentPassword, newPassword) { 
    return this.post("/users/change-password", { currentPassword, newPassword }); 
  }
  
  async createUser(userData) { 
    return this.post("/users/create", userData); 
  }
  
  async getAllUsers() { 
    return this.get("/users"); 
  }
  
  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }
  
  async toggleUserStatus(userId, isActive) { 
    return this.put(`/users/${userId}/toggle-status`, { isActive }); 
  }
  
  async adminResetPassword(userId, newPassword) { 
    return this.put(`/users/${userId}/reset-password`, { newPassword }); 
  }
  
  async deleteUser(userId) { 
    return this.delete(`/users/${userId}`); 
  }
  
  // ============================================
  // ADVISER ENDPOINTS
  // ============================================
  
  async getAdvisers() {
    console.log("👨‍🏫 Fetching all advisers...");
    return this.get("/advisers/advisers");
  }
  
  async getStudentsByAdviser(adviserName) {
    console.log("👨‍🎓 Fetching students for adviser:", adviserName);
    return this.get(`/advisers/adviser/${encodeURIComponent(adviserName)}`);
  }
  
  async getAllStudentsForCounselor() {
    console.log("👥 Fetching all students for counselor view...");
    return this.get("/advisers/all-students");
  }
  
  // ============================================
  // STUDENT SUBMISSION ENDPOINTS
  // ============================================
  
  /**
   * Submit a student concern (PUBLIC - no auth required)
   * @param {Object} data - {studentName, concern, nameOption}
   * @returns {Promise} Response with submissionId (format: SUB-YYYYMMDD-###)
   */
  async submitStudentConcern(data) {
    console.log("📝 Submitting student concern...");
    return this.post("/student-submissions/submit", data);
  }
  
  /**
   * Get all student submissions (Counselor/Admin only)
   * @param {Object} filters - {status, severity}
   * @returns {Promise} List of submissions
   */
  async getStudentSubmissions(filters = {}) {
    console.log("📋 Fetching student submissions...");
    const q = new URLSearchParams(filters).toString();
    return this.get(q ? `/student-submissions?${q}` : "/student-submissions");
  }
  
  /**
   * Get single student submission by ID (Counselor/Admin only)
   * @param {string} id - Submission ID
   * @returns {Promise} Submission details
   */
  async getStudentSubmission(id) {
    console.log("📋 Fetching student submission:", id);
    return this.get(`/student-submissions/${id}`);
  }
  
  /**
   * Update student submission status/notes (Counselor/Admin only)
   * @param {string} id - Submission ID
   * @param {Object} data - {studentId, studentName, level, grade, status, severity, notes}
   * @returns {Promise} Updated submission
   */
  async updateStudentSubmission(id, data) {
    console.log("✏️ Updating student submission:", id);
    return this.put(`/student-submissions/${id}`, data);
  }
  
  /**
   * Process student submission into official referral (Counselor/Admin only)
   * This is the KEY method - converts submission to official referral
   * @param {string} id - Submission ID
   * @param {Object} data - {studentId, level, grade, severity, category, notes, referredBy}
   * @returns {Promise} {submission, referral} - Both records returned
   */
  async processStudentSubmission(id, data) {
    console.log("🔄 Processing student submission:", id, "→ Creating official referral");
    return this.post(`/student-submissions/${id}/process`, data);
  }
  
  /**
   * Delete student submission (Admin only)
   * @param {string} id - Submission ID
   * @returns {Promise} Success message
   */
  async deleteStudentSubmission(id) {
    console.log("🗑️ Deleting student submission:", id);
    return this.delete(`/student-submissions/${id}`);
  }
  
  /**
   * Get student submissions statistics (Counselor/Admin only)
   * @returns {Promise} Statistics object with counts
   */
  async getStudentSubmissionStats() {
    console.log("📊 Fetching student submission stats...");
    return this.get("/student-submissions/stats/summary");
  }
  
  // ============================================
  // REFERRAL ENDPOINTS (STAFF REFERRALS ONLY)
  // ============================================
  
  async getReferrals(filters = {}) { 
    const q = new URLSearchParams(filters).toString(); 
    return this.get(q ? `/referrals?${q}` : "/referrals"); 
  }
  
  async getReferralById(id) { 
    return this.get(`/referrals/${id}`); 
  }
  
  async createReferral(referralData) { 
    return this.post("/referrals", referralData); 
  }
  
  async updateReferral(id, referralData) { 
    return this.put(`/referrals/${id}`, referralData); 
  }
  
  async deleteReferral(id) { 
    return this.delete(`/referrals/${id}`); 
  }
  
  async getReferralStats() { 
    return this.get("/referrals/stats"); 
  }

  /**
   * 🆕 Get referrals created by current teacher (TEACHER-SPECIFIC)
   * This endpoint is authorized for teachers to access their own referrals
   * @returns {Promise} List of referrals created by the logged-in teacher
   */
  async getMyReferrals() {
    console.log("📋 Fetching my referrals (teacher-authorized endpoint)...");
    return this.get("/referrals/my-referrals");
  }
  
  // ============================================
  // STUDENT ENDPOINTS
  // ============================================
  
  async getStudents(filters = {}) { 
    const q = new URLSearchParams(filters).toString(); 
    return this.get(q ? `/students?${q}` : "/students"); 
  }
  
  async getStudentById(id) { 
    return this.get(`/students/${id}`); 
  }
  
  async createStudent(studentData) { 
    return this.post("/students", studentData); 
  }
  
  async updateStudent(id, studentData) { 
    return this.put(`/students/${id}`, studentData); 
  }
  
  async deleteStudent(id) { 
    return this.delete(`/students/${id}`); 
  }
  
  async addConsultation(studentId, consultationData) { 
    return this.post(`/students/${studentId}/consultation`, consultationData); 
  }
  
  async getStudentStats() { 
    return this.get("/students/stats/overview"); 
  }

  /**
   * 🆕 Search students for autocomplete (NEW METHOD)
   * Used for auto-filling student information in submission forms
   * @param {string} query - Search query (student ID or name)
   * @returns {Promise} List of matching students with {_id, studentId, name, level, grade}
   */
  async searchStudents(query) {
    console.log("🔍 Searching students:", query);
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    return this.get(`/students/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================
  // CATEGORY ENDPOINTS
  // ============================================
  
  async getCategories() {
    console.log("📋 Fetching categories...");
    return this.get("/categories");
  }
  
  async getCategoryById(id) {
    console.log("📋 Fetching category:", id);
    return this.get(`/categories/${id}`);
  }
  
  async createCategory(categoryData) {
    console.log("➕ Creating category:", categoryData);
    return this.post("/categories", categoryData);
  }
  
  async updateCategory(id, categoryData) {
    console.log("✏️ Updating category:", id, categoryData);
    return this.put(`/categories/${id}`, categoryData);
  }
  
  async deleteCategory(id) {
    console.log("🗑️ Deleting category:", id);
    return this.delete(`/categories/${id}`);
  }

  // ============================================
  // BULK UPLOAD & TEMPLATE
  // ============================================
  
  async bulkUploadStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.upload("/students/bulk-upload", formData);
  }
  
  async downloadStudentTemplate() {
    const url = `${API_BASE_URL}/students/download-template`;
    const headers = this.getHeaders();
    
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'student_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, message: 'Template downloaded' };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, message: error.message };
    }
  }
}

// ============================================
// CREATE SINGLETON INSTANCE
// ============================================
const apiClient = new APIClient();

console.log("✅ apiClient loaded. Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient)));

// Export for Node.js (if used in backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiClient;
}

// ✅ CRITICAL FIX: Make available globally in browser
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
  console.log("✅ apiClient attached to window object");
}