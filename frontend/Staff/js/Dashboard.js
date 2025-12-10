// Dashboard.js - UPDATED STATUS CHART TO LINE GRAPH

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 Dashboard.js loaded");

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

await loadUserProfile();
  setupProfileDropdown();

  // Load categories first
  await loadCategories();

  // Load referral statistics
  loadReferralStats();

  // Load recent referrals
  loadRecentReferrals();
  loadRecentStudentSubmissions();

  // Load charts
  loadStatusChart(); // 🆕 NOW A LINE CHART
  loadSeverityChart();
  loadGradeChart();
  loadCategoryChart();
  loadQuarterlyChart();

  // Filter change listeners
  document.getElementById("statusFilter")?.addEventListener("change", loadStatusChart);
  document.getElementById("statusTimeFilter")?.addEventListener("change", handleStatusTimeFilterChange);
  document.getElementById("priorityFilter")?.addEventListener("change", loadSeverityChart);
  document.getElementById("categoryFilter")?.addEventListener("change", loadCategoryChart);
  document.getElementById("categoryTimeFilter")?.addEventListener("change", loadCategoryChart);
  document.getElementById("categoryMonthFilter")?.addEventListener("change", loadCategoryChart);
  document.getElementById("categoryQuarterFilter")?.addEventListener("change", loadCategoryChart);

  // ========== MAKE STAT CARDS CLICKABLE ==========
  setupStatCardNavigation();
function setupStatCardNavigation() {
  // Get all stat cards
  const statCards = document.querySelectorAll('.stat-card');
  
  statCards.forEach((card, index) => {
    // Make cards clickable with hover effects
    card.style.cursor = 'pointer';
    card.style.transition = 'transform 0.2s, box-shadow 0.2s';
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '';
    });
    
    // Add click handler based on card position (index)
    card.addEventListener('click', () => {
      let targetPage = '';
      let filterParams = new URLSearchParams();
      
      switch(index) {
        case 0: // Total Referrals
          targetPage = 'Referral.html';
          // No filters - show all
          break;
          
        case 1: // Elementary
          targetPage = 'Referral.html';
          filterParams.set('level', 'Elementary');
          break;
          
        case 2: // Junior High School
          targetPage = 'Referral.html';
          filterParams.set('level', 'JHS');
          break;
          
        case 3: // Senior High School
          targetPage = 'Referral.html';
          filterParams.set('level', 'SHS');
          break;
          
        case 4: // Student Pending
          targetPage = 'StudentSubmissions.html';
          filterParams.set('status', 'Pending');
          break;
          
        case 5: // Referral Pending
          targetPage = 'Referral.html';
          filterParams.set('status', 'Pending');
          break;
      }
      
      // Navigate to the target page with filters
      const url = targetPage + (filterParams.toString() ? '?' + filterParams.toString() : '');
      window.location.href = url;
    });
  });
}

// Handle stat card clicks and navigate with filters
function handleStatCardClick(statLabel) {
  console.log('Stat card clicked:', statLabel);
  
  // Determine which page and filters to apply
  let targetPage = '';
  let filterParams = new URLSearchParams();
  
  switch(statLabel) {
    case 'Total Referrals':
      targetPage = 'Referral.html';
      // No filters - show all
      break;
      
    case 'Elementary':
      targetPage = 'Referral.html';
      filterParams.set('level', 'Elementary');
      break;
      
    case 'Junior High School':
      targetPage = 'Referral.html';
      filterParams.set('level', 'JHS');
      break;
      
    case 'Senior High School':
      targetPage = 'Referral.html';
      filterParams.set('level', 'SHS');
      break;
      
    case 'Student Pending':
      targetPage = 'StudentSubmissions.html';
      filterParams.set('status', 'Pending');
      break;
      
    case 'Referral Pending':
      targetPage = 'Referral.html';
      filterParams.set('status', 'Pending');
      break;
      
    default:
      console.warn('Unknown stat card:', statLabel);
      return;
  }
  
  // Navigate to the target page with filters
  const url = targetPage + (filterParams.toString() ? '?' + filterParams.toString() : '');
  window.location.href = url;
}

// Call this function after the DOM is loaded and stats are displayed
document.addEventListener('DOMContentLoaded', () => {
  // Wait for stats to be loaded, then setup click handlers
  setTimeout(() => {
    setupStatCardFilters();
  }, 1000);
});

  // ========== LOAD CATEGORIES FOR FILTERS ==========
  async function loadCategories() {
    try {
      const response = await apiClient.getCategories();
      
      if (response.success) {
        const categories = response.data || response.categories || [];
        populateCategoryFilter(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Populate category filter dropdown
  function populateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!categoryFilter) return;
    
    // Keep the "All Categories" option
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories from backend
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
      });
    }
  }

  // ========== LOAD RECENT REFERRALS ==========
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
      const tbody = document.getElementById('recentReferralsTable');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading referrals</td></tr>';
      }
    }
  }

  // Display recent referrals in table
  function displayRecentReferrals(referrals) {
    const tbody = document.getElementById('recentReferralsTable');
    if (!tbody) return;

    if (referrals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No recent referrals</td></tr>';
      return;
    }

    tbody.innerHTML = referrals.map(referral => `
      <tr>
        <td>${referral.referralId}</td>
        <td>${referral.studentName}</td>
        <td>${referral.level}</td>
        <td>${referral.grade}</td>
        <td>${new Date(referral.createdAt).toLocaleDateString()}</td>
        <td><span class="status-badge status-${referral.status.replace(/\s+/g, '-').toLowerCase()}">${referral.status}</span></td>
        <td><span class="severity-badge severity-${referral.severity.toLowerCase()}">${referral.severity}</span></td>
      </tr>
    `).join('');
  }

  async function loadRecentStudentSubmissions() {
    try {
      const response = await apiClient.getStudentSubmissions();
      
      if (response.success) {
        const allSubmissions = response.data || [];
        
        const sortedSubmissions = allSubmissions.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.dateSubmitted || 0);
          const dateB = new Date(b.createdAt || b.dateSubmitted || 0);
          return dateB - dateA;
        });
        
        const recentSubmissions = sortedSubmissions.slice(0, 5);
        
        displayRecentStudentSubmissions(recentSubmissions);
      } else {
        console.error('Failed to load recent student submissions');
        const tbody = document.getElementById('recentStudentTable');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load student submissions</td></tr>';
        }
      }
    } catch (error) {
      console.error('Error loading recent student submissions:', error);
      const tbody = document.getElementById('recentStudentTable');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading student submissions</td></tr>';
      }
    }
  }

  function displayRecentStudentSubmissions(submissions) {
    const tbody = document.getElementById('recentStudentTable');
    if (!tbody) return;

    if (!submissions || submissions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No Recent Student Submissions</td></tr>';
      return;
    }

    tbody.innerHTML = submissions.map(submission => `
      <tr style="cursor: pointer;" onclick="window.location.href='../html/StudentSubmissions.html?id=${submission.submissionId || submission.id}'">
        <td>${submission.submissionId || submission.id || 'N/A'}</td>
        <td>${submission.studentName || 'Unknown'}</td>
        <td>${submission.level || 'N/A'}</td>
        <td>${submission.grade || 'N/A'}</td>
        <td>${new Date(submission.createdAt || submission.dateSubmitted).toLocaleDateString()}</td>
        <td><span class="status-badge status-${(submission.status || 'pending').replace(/\s+/g, '-').toLowerCase()}">${submission.status || 'Pending'}</span></td>
        <td><span class="severity-badge severity-${(submission.severity || 'medium').toLowerCase()}">${submission.severity || 'Medium'}</span></td>
      </tr>
    `).join('');
  }

  // ========== LOAD REFERRAL STATISTICS ==========
  async function loadReferralStats() {
    try {
      const response = await apiClient.getReferralStats();
      
      if (response.success) {
        const stats = response.data;
        
        document.getElementById("totalReferrals").textContent = stats.total || 0;
        document.getElementById("elementaryCount").textContent = stats.byLevel.elementary || 0;
        document.getElementById("juniorHighCount").textContent = stats.byLevel.juniorHigh || 0;
        document.getElementById("seniorHighCount").textContent = stats.byLevel.seniorHigh || 0;
      }

      await loadStudentPendingCount();
      await loadReferralPendingCount();

    } catch (error) {
      console.error("Error loading referral stats:", error);
      document.getElementById("totalReferrals").textContent = "Error";
    }
  }

  async function loadStudentPendingCount() {
    try {
      const response = await apiClient.get('/student-submissions');
      
      if (response.success) {
        const submissions = response.data || [];
        const pendingCount = submissions.filter(sub => sub.status === 'Pending').length;
        
        const studentPendingElement = document.querySelectorAll('.stat-value')[4];
        if (studentPendingElement) {
          studentPendingElement.textContent = pendingCount;
        }
      }
    } catch (error) {
      console.error("Error loading student pending count:", error);
      const studentPendingElement = document.querySelectorAll('.stat-value')[4];
      if (studentPendingElement) {
        studentPendingElement.textContent = "0";
      }
    }
  }

  async function loadReferralPendingCount() {
    try {
      const response = await apiClient.getReferrals({ status: 'Pending' });
      
      if (response.success) {
        const pendingReferrals = response.data || [];
        
        const referralPendingElement = document.querySelectorAll('.stat-value')[5];
        if (referralPendingElement) {
          referralPendingElement.textContent = pendingReferrals.length;
        }
      }
    } catch (error) {
      console.error("Error loading referral pending count:", error);
      const referralPendingElement = document.querySelectorAll('.stat-value')[5];
      if (referralPendingElement) {
        referralPendingElement.textContent = "0";
      }
    }
  }

  // ========== 🆕 LOAD STATUS LINE CHART (REPLACES PIE CHART) ==========
  let statusChart = null;
  
  function handleStatusTimeFilterChange() {
    loadStatusChart();
  }
  
  async function loadStatusChart() {
    try {
      const levelFilter = document.getElementById("statusFilter")?.value;
      const timeFilter = document.getElementById("statusTimeFilter")?.value || 'daily';
      
      const filters = levelFilter && levelFilter !== "all" ? { level: levelFilter } : {};
      const response = await apiClient.getReferrals(filters);
      
      if (response.success) {
        const referrals = response.data;
        
        // Aggregate data based on time filter
        const aggregatedData = aggregateReferralsByTime(referrals, timeFilter);
        
        const ctx = document.getElementById("statusPieChart")?.getContext("2d");
        if (!ctx) return;
        
        if (statusChart) {
          statusChart.destroy();
        }

        // Create line chart with 3 lines: Total Cases, Pending, Complete
        statusChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: aggregatedData.labels,
            datasets: [
              {
                label: "Total Cases",
                data: aggregatedData.total,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(59, 130, 246, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
              },
              {
                label: "Pending",
                data: aggregatedData.pending,
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                borderColor: "rgba(251, 191, 36, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(251, 191, 36, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
              },
              {
                label: "Complete",
                data: aggregatedData.complete,
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(16, 185, 129, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
              mode: 'index',
              intersect: false
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                },
                title: {
                  display: true,
                  text: 'Number of Referrals',
                  color: '#e0e0e0'
                }
              },
              x: {
                ticks: { 
                  color: '#e0e0e0',
                  maxRotation: 45,
                  minRotation: 45
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#e0e0e0',
                  padding: 15,
                  font: { size: 12 },
                  usePointStyle: true
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y}`;
                  }
                }
              },
              title: {
                display: true,
                text: `Referral Status Trends (${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})`,
                color: '#e0e0e0',
                font: {
                  size: 16,
                  weight: 'normal'
                },
                padding: { bottom: 15 }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading status chart:", error);
    }
  }

  // ========== AGGREGATE REFERRALS BY TIME PERIOD ==========
  function aggregateReferralsByTime(referrals, timeFilter) {
    const now = new Date();
    let labels = [];
    let totalData = [];
    let pendingData = [];
    let completeData = [];
    
    if (timeFilter === 'daily') {
      // Last 30 days
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const dayReferrals = referrals.filter(ref => {
          const refDate = new Date(ref.createdAt).toISOString().split('T')[0];
          return refDate === dateStr;
        });
        
        totalData.push(dayReferrals.length);
        pendingData.push(dayReferrals.filter(r => r.status === 'Pending').length);
        completeData.push(dayReferrals.filter(r => r.status === 'Complete').length);
      }
    } else if (timeFilter === 'weekly') {
      // Last 12 weeks
      const weeks = 12;
      for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        labels.push(`${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        
        const weekReferrals = referrals.filter(ref => {
          const refDate = new Date(ref.createdAt);
          return refDate >= weekStart && refDate <= weekEnd;
        });
        
        totalData.push(weekReferrals.length);
        pendingData.push(weekReferrals.filter(r => r.status === 'Pending').length);
        completeData.push(weekReferrals.filter(r => r.status === 'Complete').length);
      }
    } else if (timeFilter === 'monthly') {
      // Last 12 months
      const months = 12;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        
        const monthReferrals = referrals.filter(ref => {
          const refDate = new Date(ref.createdAt);
          return refDate.getMonth() === date.getMonth() && 
                 refDate.getFullYear() === date.getFullYear();
        });
        
        totalData.push(monthReferrals.length);
        pendingData.push(monthReferrals.filter(r => r.status === 'Pending').length);
        completeData.push(monthReferrals.filter(r => r.status === 'Complete').length);
      }
    }
    
    return {
      labels,
      total: totalData,
      pending: pendingData,
      complete: completeData
    };
  }

  // ========== LOAD SEVERITY PIE CHART ==========
  let severityChart = null;
  async function loadSeverityChart() {
    try {
      const filter = document.getElementById("priorityFilter")?.value;
      const filters = filter && filter !== "all" ? { level: filter } : {};
      
      const response = await apiClient.getReferrals(filters);
      
      if (response.success) {
        const referrals = response.data;
        
        const severityCounts = {
          'Low': 0,
          'Medium': 0,
          'High': 0
        };
        
        referrals.forEach(ref => {
          if (severityCounts.hasOwnProperty(ref.severity)) {
            severityCounts[ref.severity]++;
          }
        });

        const ctx = document.getElementById("priorityPieChart")?.getContext("2d");
        if (!ctx) return;
        
        if (severityChart) {
          severityChart.destroy();
        }

        severityChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: Object.keys(severityCounts),
            datasets: [{
              data: Object.values(severityCounts),
              backgroundColor: [
                "rgba(16, 185, 129, 0.8)",
                "rgba(251, 191, 36, 0.8)",
                "rgba(239, 68, 68, 0.8)"
              ],
              borderColor: [
                "rgba(16, 185, 129, 1)",
                "rgba(251, 191, 36, 1)",
                "rgba(239, 68, 68, 1)"
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: '#e0e0e0',
                  padding: 15,
                  font: { size: 12 }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading severity chart:", error);
    }
  }

  // ========== HELPER FUNCTIONS FOR DATE FILTERING ==========
  function filterReferralsByTimeRange(referrals, timeFilter, monthFilter, quarterFilter) {
    if (timeFilter === 'all') return referrals;

    const now = new Date();
    
    if (timeFilter === 'month' && monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number);
      return referrals.filter(ref => {
        const date = new Date(ref.createdAt);
        return date.getFullYear() === year && date.getMonth() === month - 1;
      });
    }
    
    if (timeFilter === 'quarter' && quarterFilter) {
      const [year, quarter] = quarterFilter.split('-Q').map(Number);
      return referrals.filter(ref => {
        const date = new Date(ref.createdAt);
        const refQuarter = Math.floor(date.getMonth() / 3) + 1;
        return date.getFullYear() === year && refQuarter === quarter;
      });
    }
    
    return referrals;
  }

  function generateMonthOptions() {
    const select = document.getElementById('categoryMonthFilter');
    if (!select) return;

    const now = new Date();
    const months = [];
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({ value: `${year}-${month}`, label: monthName });
    }
    
    select.innerHTML = months.map(m => 
      `<option value="${m.value}">${m.label}</option>`
    ).join('');
  }

  function generateQuarterOptions() {
    const select = document.getElementById('categoryQuarterFilter');
    if (!select) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const quarters = [];
    
    // Generate last 8 quarters (2 years)
    for (let i = 0; i < 8; i++) {
      let year = currentYear;
      let quarter = currentQuarter - i;
      
      while (quarter <= 0) {
        quarter += 4;
        year -= 1;
      }
      
      quarters.push({ 
        value: `${year}-Q${quarter}`, 
        label: `Q${quarter} ${year}` 
      });
    }
    
    select.innerHTML = quarters.map(q => 
      `<option value="${q.value}">${q.label}</option>`
    ).join('');
  }

  // Initialize month and quarter dropdowns
  generateMonthOptions();
  generateQuarterOptions();

  // Handle time filter changes to show/hide month and quarter selects
  const categoryTimeFilter = document.getElementById('categoryTimeFilter');
  const monthFilterContainer = document.getElementById('monthFilterContainer');
  const quarterFilterContainer = document.getElementById('quarterFilterContainer');

  if (categoryTimeFilter) {
    categoryTimeFilter.addEventListener('change', (e) => {
      const value = e.target.value;
      
      if (monthFilterContainer) {
        monthFilterContainer.style.display = value === 'month' ? 'block' : 'none';
      }
      if (quarterFilterContainer) {
        quarterFilterContainer.style.display = value === 'quarter' ? 'block' : 'none';
      }
      
      loadCategoryChart();
    });
    
    // Initial state
    if (monthFilterContainer) monthFilterContainer.style.display = 'none';
    if (quarterFilterContainer) quarterFilterContainer.style.display = 'none';
  }

  // ========== LOAD INCIDENT CATEGORY BAR CHART ==========
let categoryChart = null;
async function loadCategoryChart() {
  try {
    const categoryFilter = document.getElementById("categoryFilter")?.value;
    const timeFilter = document.getElementById("categoryTimeFilter")?.value || 'all';
    const monthFilter = document.getElementById("categoryMonthFilter")?.value;
    const quarterFilter = document.getElementById("categoryQuarterFilter")?.value;
    
    // Fetch both referrals and student submissions
    const [referralsResponse, submissionsResponse] = await Promise.all([
      apiClient.get('/referrals'),
      apiClient.get('/student-submissions')
    ]);
    
    let allData = [];
    
    // Combine data from both sources
    if (referralsResponse.success) {
      allData = [...referralsResponse.data];
    }
    
    if (submissionsResponse.success) {
      allData = [...allData, ...submissionsResponse.data];
    }
    
    console.log('📊 Total combined data:', allData.length);
    
    // Apply time filtering
    allData = filterReferralsByTimeRange(allData, timeFilter, monthFilter, quarterFilter);
    
    // Count categories
    const categoryCounts = {};
    allData.forEach(item => {
      const categoryName = 
  item.category?.name ||  // If category is an object with name
  item.category;          // If category is a string
// ✅ Now only looks at the 'category' field
      
      if (categoryName && categoryName !== 'undefined') {
        // Apply category filter
        if (!categoryFilter || categoryFilter === 'all' || categoryName === categoryFilter) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      }
    });

    const ctx = document.getElementById("categoryChart")?.getContext("2d");
    if (!ctx) return;
    
    if (categoryChart) {
      categoryChart.destroy();
    }

    if (Object.keys(categoryCounts).length === 0) {
      displayEmptyCategoryChart(ctx);
      return;
    }

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const colorPalette = [
      "rgba(239, 68, 68, 0.8)", "rgba(251, 191, 36, 0.8)",
      "rgba(16, 185, 129, 0.8)", "rgba(59, 130, 246, 0.8)",
      "rgba(147, 51, 234, 0.8)", "rgba(236, 72, 153, 0.8)",
      "rgba(249, 115, 22, 0.8)", "rgba(20, 184, 166, 0.8)",
      "rgba(139, 92, 246, 0.8)", "rgba(34, 197, 94, 0.8)"
    ];

    const colors = sortedCategories.map((_, i) => colorPalette[i % colorPalette.length]);
    const borderColors = colors.map(color => color.replace('0.8', '1'));

    let chartTitle = 'Top Incident Categories (Referrals + Student Submissions)';
    if (categoryFilter && categoryFilter !== 'all') {
      chartTitle = `${categoryFilter} - ${chartTitle}`;
    }
    if (timeFilter === 'month' && monthFilter) {
      const [year, month] = monthFilter.split('-');
      const date = new Date(year, month - 1);
      chartTitle += ` (${date.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
    } else if (timeFilter === 'quarter' && quarterFilter) {
      chartTitle += ` (${quarterFilter})`;
    }

    categoryChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedCategories.map(([name]) => name),
        datasets: [{
          label: "Number of Incidents",
          data: sortedCategories.map(([, count]) => count),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#e0e0e0',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            title: {
              display: true,
              text: 'Number of Incidents',
              color: '#e0e0e0'
            }
          },
          y: {
            ticks: {
              color: '#e0e0e0',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: function(context) {
                const value = context.parsed.x || 0;
                const total = sortedCategories.reduce((sum, [, count]) => sum + count, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `Incidents: ${value} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: chartTitle,
            color: '#e0e0e0',
            font: {
              size: 14,
              weight: 'normal'
            },
            padding: { bottom: 10 }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error loading incident category chart:", error);
  }
}



  // ========== LOAD GRADE LEVEL BAR CHART ==========
  let gradeChart = null;
  async function loadGradeChart() {
    try {
      const response = await apiClient.getReferrals();
      
      if (response.success) {
        const referrals = response.data;
        
        const gradeCounts = {};
        referrals.forEach(ref => {
          gradeCounts[ref.grade] = (gradeCounts[ref.grade] || 0) + 1;
        });

        const sortedGrades = Object.keys(gradeCounts).sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)) || 0;
          const numB = parseInt(b.match(/\d+/)) || 0;
          return numA - numB;
        });

        const ctx = document.getElementById("gradeChart")?.getContext("2d");
        if (!ctx) return;
        
        if (gradeChart) {
          gradeChart.destroy();
        }

        gradeChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: sortedGrades,
            datasets: [{
              label: "Number of Referrals",
              data: sortedGrades.map(grade => gradeCounts[grade]),
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: { color: '#e0e0e0' },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#e0e0e0' }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff'
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading grade chart:", error);
    }
  }

  // ========== LOAD QUARTERLY TRENDS LINE CHART ==========
  let quarterlyChart = null;
  async function loadQuarterlyChart() {
    try {
      const response = await apiClient.getReferrals();
      
      if (response.success) {
        const referrals = response.data;
        
        const monthCounts = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        referrals.forEach(ref => {
          const date = new Date(ref.createdAt);
          const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA - dateB;
        }).slice(-12);

        const ctx = document.getElementById("monthlyChart")?.getContext("2d");
        if (!ctx) return;
        
        if (quarterlyChart) {
          quarterlyChart.destroy();
        }

        quarterlyChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: sortedMonths,
            datasets: [{
              label: "Referrals",
              data: sortedMonths.map(month => monthCounts[month]),
              backgroundColor: "rgba(147, 51, 234, 0.1)",
              borderColor: "rgba(147, 51, 234, 1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "rgba(147, 51, 234, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e0e0e0',
                  stepSize: 1
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: { color: '#e0e0e0' },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#e0e0e0' }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff'
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading quarterly chart:", error);
    }
  }
});



// Configuration
const AI_API_BASE = 'http://localhost:3000/api/ai-prescriptions';

// ========== INITIALIZE AI PRESCRIPTION FEATURE ==========
document.addEventListener('DOMContentLoaded', () => {
  setupAIPrescriptionButton();
});

// Setup the "View Analytics" button to open AI Prescription Modal
function setupAIPrescriptionButton() {
  const viewCategoriesBtn = document.getElementById('viewCategoriesBtn');
  if (viewCategoriesBtn) {
    viewCategoriesBtn.addEventListener('click', openAIPrescriptionModal);
  }
}

// ========== OPEN AI PRESCRIPTION MODAL ==========
async function openAIPrescriptionModal() {
  try {
    // Get current filter values from the incident categories chart
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    const timeFilter = document.getElementById('categoryTimeFilter')?.value;
    const monthFilter = document.getElementById('categoryMonthFilter')?.value;
    const quarterFilter = document.getElementById('categoryQuarterFilter')?.value;
    
    // Get the top incident category
    const topCategory = await getTopIncidentCategory();
    
    // Build context string based on filters
    let contextInfo = '';
    if (categoryFilter && categoryFilter !== 'all') {
      contextInfo += `Category: ${categoryFilter}\n`;
    }
    if (timeFilter === 'month' && monthFilter) {
      const [year, month] = monthFilter.split('-');
      const date = new Date(year, month - 1);
      contextInfo += `Time Period: ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}\n`;
    } else if (timeFilter === 'quarter' && quarterFilter) {
      contextInfo += `Time Period: ${quarterFilter}\n`;
    }
    
    // Pre-fill issue description
    let issueDescription = '';
    if (topCategory) {
      issueDescription = `High number of incidents related to "${topCategory.name}" (${topCategory.count} cases).\n\n`;
      if (contextInfo) {
        issueDescription += contextInfo;
      }
      issueDescription += `\nThis trend requires immediate attention and strategic intervention.`;
    }

    let topReferral = loadTopReferral();

    
    // Create and show the modal
    createAIPrescriptionModal(issueDescription, topCategory);
    
  } catch (error) {
    console.error('Error opening AI Prescription modal:', error);
    showAIError('Failed to open AI Prescription modal. Please try again.');
  }
}

// ========== CREATE MODAL HTML ==========
async function createAIPrescriptionModal(issueDescription, topCategory) {
  // Remove existing modal if any
  const existingModal = document.getElementById('aiPrescriptionModal');
  if (existingModal) {
    existingModal.remove();
  }

  const topReferral = await loadTopReferral();
  
  const modalHTML = `
    <div id="aiPrescriptionModal" class="ai-prescription-modal">
      <div class="ai-prescription-modal-content">
        <div class="ai-prescription-modal-header">
          <div class="header-content">
            <h1>📅 Weekly AI Solution Prescriber</h1>
            <h2 id="topReferral">🔥 Top Referral: ${topReferral.category} (${topReferral.count  } mentions)</h2>
            <p>Analyze trending student issues and get actionable solutions</p>
            <div class="badge">⏰ One Prescription Per Week</div>
          </div>
        </div>
        
        <div class="ai-prescription-form-container">
          <form id="aiPrescribeForm">
            <div class="form-group">
              <label for="aiIssue">Trending Student Issue This Week *</label>
              <textarea 
                id="aiIssue" 
                name="issue" 
                placeholder="Describe the trending issue among students this week...&#10;&#10;Examples:&#10;• High number of behavioral referrals&#10;• Increased anxiety/stress reports&#10;• Academic performance concerns&#10;• Attendance issues"
                required
                rows="8"
                readonly
              >${issueDescription || ''}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" onclick="closeAIPrescriptionModal()">
              Close Prescription
            </button>
          </form>
        </div>
        
        <div id="aiLoadingOverlay" class="loading-overlay" style="display: none;">
          <div class="loading-card">
            <div class="loading-spinner large"></div>
            <p>Analyzing issue and generating solutions...</p>
            <p class="loading-subtext">This may take a few seconds</p>
          </div>
        </div>
        
        <div id="aiResultsContainer" class="ai-results-container" style="display: none;">
          <div class="ai-results-header">
            <h2>✅ Prescription Generated</h2>
            <button class="btn-secondary" onclick="closeAIPrescriptionResults()">
              <span class="material-symbols-outlined">arrow_back</span>
              Create New Prescription
            </button>
          </div>
          <div id="aiResultsContent"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Initialize modal functionality
  initializeAIPrescriptionModal();
}

// ========== INITIALIZE MODAL FUNCTIONALITY ==========
function initializeAIPrescriptionModal() {
  // Check availability
  checkAIAvailability();
  
  // Setup form submission
  const form = document.getElementById('aiPrescribeForm');
  if (form) {
    form.addEventListener('submit', handleAIPrescribe);
  }
  
  // Close on outside click
  const modal = document.getElementById('aiPrescriptionModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAIPrescriptionModal();
      }
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape' && document.getElementById('aiPrescriptionModal')) {
      closeAIPrescriptionModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

// ========== GET TOP INCIDENT CATEGORY ==========
async function getTopIncidentCategory() {
  try {
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    const timeFilter = document.getElementById('categoryTimeFilter')?.value;
    const monthFilter = document.getElementById('categoryMonthFilter')?.value;
    const quarterFilter = document.getElementById('categoryQuarterFilter')?.value;
    
    // Fetch both referrals and student submissions
    const [referralsResponse, submissionsResponse] = await Promise.all([
      apiClient.get('/referrals'),
      apiClient.get('/student-submissions')
    ]);
    
    let allData = [];
    
    // Add referrals data
    if (referralsResponse.success) {
      allData = [...referralsResponse.data];
    }
    
    // Add student submissions data
    if (submissionsResponse.success) {
      allData = [...allData, ...submissionsResponse.data];
    }
    
    console.log('📊 Combined data count:', allData.length);
    
    // Apply time filtering
    allData = filterReferralsByTimeRange(allData, timeFilter, monthFilter, quarterFilter);
    
    // Count categories from both sources
    const categoryCounts = {};
    
    allData.forEach(item => {
      // Try multiple possible category field names
      const categoryName = 
        item.incidentCategory?.name || 
        item.category?.name || 
        item.incidentCategory || 
        item.category ||
        item.reason; // Some might have "reason" as category
      
      if (categoryName && categoryName !== 'undefined') {
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      }
    });
    
    console.log('📊 Category counts:', categoryCounts);
    
    // Apply category filter if needed
    let filteredCategories = Object.entries(categoryCounts);
    
    if (categoryFilter && categoryFilter !== 'all') {
      filteredCategories = filteredCategories.filter(([name]) => name === categoryFilter);
    }
    
    // Get top category
    const sortedCategories = filteredCategories.sort((a, b) => b[1] - a[1]);
    
    if (sortedCategories.length > 0) {
      return {
        name: sortedCategories[0][0],
        count: sortedCategories[0][1],
        source: 'combined' // Indicate this is from both sources
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting top category:', error);
    return null;
  }
}

// ========== CHECK AVAILABILITY ==========
async function checkAIAvailability() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${AI_API_BASE}/check-availability`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    updateAIStatusBanner(data);

    if (!data.allowed) {
      const submitBtn = document.getElementById('aiSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    showAIError('Failed to check availability. Please try again.');
  }
}

// ========== UPDATE STATUS BANNER ==========
function updateAIStatusBanner(data) {
  const banner = document.getElementById('aiStatusBanner');
  if (!banner) return;
  
  if (data.allowed) {
    banner.className = 'status-banner available';
    banner.innerHTML = `
      <h2>✅ Ready to Prescribe</h2>
      <p>You can create a prescription for this week!</p>
      <p class="status-date">Week of ${new Date().toLocaleDateString()}</p>
    `;
  } else {
    const lastDate = new Date(data.lastPrescriptionDate);
    const nextDate = new Date(data.nextAvailableDate);
    
    banner.className = 'status-banner blocked';
    banner.innerHTML = `
      <h2>🛑 Weekly Limit Reached</h2>
      <p>A prescription has already been created this week</p>
      <p class="status-info">
        Last prescription: ${lastDate.toLocaleString()}<br>
        Next available: ${nextDate.toLocaleDateString()}
      </p>
    `;
  }
}

// ========== HANDLE FORM SUBMISSION ==========
async function handleAIPrescribe(e) {
  e.preventDefault();

  const issue = document.getElementById('aiIssue').value.trim();
  
  if (!issue) {
    showAIError('Please describe the trending issue.');
    return;
  }
  
  const context = {
    affectedGrade: document.getElementById('aiAffectedGrade').value.trim(),
    numberOfCases: document.getElementById('aiNumberOfCases').value.trim(),
    trend: document.getElementById('aiTrend').value.trim(),
    category: document.getElementById('aiCategory').value.trim()
  };

  // Remove empty context fields
  Object.keys(context).forEach(key => {
    if (!context[key]) delete context[key];
  });

  showAILoading();

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${AI_API_BASE}/prescribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ issue, context })
    });

    const result = await response.json();

    hideAILoading();

    if (result.success) {
      showAIResults(result);
      
      // Show success message
      if (typeof customAlert !== 'undefined') {
        customAlert.success('Weekly prescription created successfully!');
      }
      
      // Refresh dashboard data
      setTimeout(() => {
        loadReferralStats();
        loadRecentReferrals();
      }, 1000);
      
    } else if (result.blocked) {
      showAIError(result.message || 'Weekly limit reached. You can create a new prescription next week.');
    } else {
      showAIError(result.error || 'Failed to create prescription. Please try again.');
    }
  } catch (error) {
    hideAILoading();
    console.error('Error creating prescription:', error);
    showAIError('Network error. Please check your connection and try again.');
  }
}

// ========== RENDER PRESCRIPTION ==========
function renderAIPrescription(p) {
  const date = new Date(p.timestamp);
  const week = p.week || p.weekInfo?.week || 'N/A';
  const year = p.year || p.weekInfo?.year || new Date().getFullYear();
  
  let html = `
    <div class="prescription-card">
      <div class="week-info">
        <strong>📅 Week ${week} (${year})</strong>
        <span class="week-date">Prescribed on ${date.toLocaleString()}</span>
      </div>

      <h2 class="issue-title">📋 ${p.issue}</h2>

      <span class="severity-badge severity-${p.solution.severity}">
        🚨 ${p.solution.severity.toUpperCase()} Severity
      </span>

      <div class="root-cause">
        <strong>🔍 Root Cause:</strong>
        <p>${p.solution.root_cause}</p>
      </div>

      <h3>💡 Solutions</h3>
      ${p.solution.solutions.map((sol, i) => `
        <div class="solution-card">
          <h4>${i + 1}. ${sol.title}</h4>
          <ul class="steps-list">
            ${sol.steps.map(step => `<li>${step}</li>`).join('')}
          </ul>
          <div class="impact">
            <strong>Impact:</strong> ${sol.impact}
          </div>
        </div>
      `).join('')}
  `;

  if (p.solution.quick_wins && p.solution.quick_wins.length > 0) {
    html += `
      <div class="quick-wins">
        <h4>⚡ Quick Wins</h4>
        <ul>
          ${p.solution.quick_wins.map(win => `<li>${win}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

// ========== SHOW RESULTS ==========
function showAIResults(result) {
  const formContainer = document.querySelector('.ai-prescription-form-container');
  const resultsContainer = document.getElementById('aiResultsContainer');
  const resultsContent = document.getElementById('aiResultsContent');
  
  if (!formContainer || !resultsContainer || !resultsContent) return;
  
  formContainer.style.display = 'none';
  resultsContainer.style.display = 'block';
  resultsContent.innerHTML = renderAIPrescription(result);
}

// ========== CLOSE RESULTS AND SHOW FORM ==========
function closeAIPrescriptionResults() {
  const formContainer = document.querySelector('.ai-prescription-form-container');
  const resultsContainer = document.getElementById('aiResultsContainer');
  
  if (!formContainer || !resultsContainer) return;
  
  resultsContainer.style.display = 'none';
  formContainer.style.display = 'block';
  
  // Clear form
  const form = document.getElementById('aiPrescribeForm');
  if (form) {
    form.reset();
  }
  
  // Refresh availability
  checkAIAvailability();
}

// ========== LOADING STATES ==========
function showAILoading() {
  const overlay = document.getElementById('aiLoadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function hideAILoading() {
  const overlay = document.getElementById('aiLoadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ========== CLOSE MODAL ==========
function closeAIPrescriptionModal() {
  const modal = document.getElementById('aiPrescriptionModal');
  if (modal) {
    modal.remove();
  }
}

// ========== ERROR HANDLING ==========
function showAIError(message) {
  if (typeof customAlert !== 'undefined') {
    customAlert.error(message);
  } else {
    alert(message);
  }
}

// ========== MAKE FUNCTIONS GLOBALLY ACCESSIBLE ==========
window.closeAIPrescriptionModal = closeAIPrescriptionModal;
window.closeAIPrescriptionResults = closeAIPrescriptionResults;
window.openAIPrescriptionModal = openAIPrescriptionModal;

async function loadTopReferral() {

    const [referralsResponse, submissionsResponse] = await Promise.all([
      apiClient.get('/referrals'),
      apiClient.get('/student-submissions')
    ]);
    
    let allData = [];
    
    // Combine data from both sources
    if (referralsResponse.success) {
      allData = [...referralsResponse.data];
    }
    
    if (submissionsResponse.success) {
      allData = [...allData, ...submissionsResponse.data];
    }

    const categoryCounts = {};
    allData.forEach(item => {
      const category = item.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    let topCategory = null;
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    }

    return { 
      category: topCategory,
      count: maxCount 
    };
}