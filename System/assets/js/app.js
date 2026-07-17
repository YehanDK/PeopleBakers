// ============================================================
//  APP ENGINE - Main application controller
// ============================================================

let currentTab = 'dashboard';
let isProfilePage = false;

// ROLE CONFIGURATION
const ROLE_CONFIG = {
  customer: {
    label: 'Online Store',
    menu: [
      { id: 'online-store', icon: 'fa-shop', label: 'Online Store' },
      { id: 'custom-cake-request', icon: 'fa-cake-candles', label: 'Custom Cakes' },
      { id: 'order-history', icon: 'fa-clock-rotate-left', label: 'Order History' },
      { id: 'customer-profile', icon: 'fa-user', label: 'My Profile' },
    ],
    renderMap: {
      'online-store': renderOnlineStore,
      'custom-cake-request': renderCustomerCakeRequest,
      'order-history': renderCustomerOrderHistory,
      'customer-profile': renderCustomerProfileTab,
    }
  }, 
  // internal user render maps

  salesassistant: {
    label: 'Sales Assistant',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'online-orders', icon: 'fa-truck', label: 'Online Orders' },
      { id: 'instore-orders', icon: 'fa-store', label: 'In-Store Orders' },
      { id: 'custom-cake', icon: 'fa-cake-candles', label: 'Custom Cakes' },
      { id: 'manual-request', icon: 'fa-pen', label: 'Custom Order Request' },
    ],
    renderMap: {
      'dashboard': renderSalesAssistantDashboard,
      'online-orders': renderOnlineOrders,
      'instore-orders': renderInStoreOrders,
      'custom-cake': renderCustomCakeOrders,
      'manual-request': renderManualRequest,
    }
  },
  deliveryemployee: {
    label: 'Delivery Employee',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'delivery-mgmt', icon: 'fa-truck-fast', label: 'Delivery Management' },
    ],
    renderMap: {
      'dashboard': renderDeliveryEmployeeDashboard,
      'delivery-mgmt': renderDeliveryManagement,
    }
  },
  inventorymanager: {
    label: 'Inventory Manager',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
      { id: 'restock', icon: 'fa-arrows-rotate', label: 'Restock' },
      { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    ],
    renderMap: {
      'dashboard': renderInventoryManagerDashboard,
      'inventory': renderInventoryManagement,
      'restock': renderRestockManagement,
      'notifications': renderStockNotification,
    }
  },
  employeemanager: {
    label: 'Employee Manager',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'add-employee', icon: 'fa-user-plus', label: 'Add Employee' },
      { id: 'manage-employee', icon: 'fa-user-gear', label: 'Manage Employees' },
      { id: 'leave-mgmt', icon: 'fa-calendar-check', label: 'Leave Management' },
    ],
    renderMap: {
      'dashboard': renderEmployeeManagerDashboard,
      'add-employee': renderAddNewEmployee,
      'manage-employee': renderManageEmployee,
      'leave-mgmt': renderLeaveManagement,
    }
  },
  companymanager: {
    label: 'Company Manager',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'view-employees', icon: 'fa-users', label: 'View Employees' },
      { id: 'sales-reports', icon: 'fa-chart-simple', label: 'View Reports' },
    ],
    renderMap: {
      'dashboard': renderCompanyManagerDashboard,
      'view-employees': renderViewEmployees,
      'sales-reports': renderReportUIContainer,
    }
  },
  financemanager: {
    label: 'Finance Manager',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'calc-salary', icon: 'fa-calculator', label: 'Calculate Salary' },
      { id: 'sales-reports', icon: 'fa-chart-simple', label: 'Generate Reports' },
      { id: 'expense-records', icon: 'fa-wallet', label: 'Expense Records' },
    ],
    renderMap: {
      'dashboard': renderFinanceManagerDashboard,
      'calc-salary': renderCalculateSalary,
      'sales-reports': renderReportUIContainer,
      'expense-records': renderExpenseRecords,
    }
  },
  salessupervisor: {
    label: 'Sales Supervisor',
    menu: [
      { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
      { id: 'cake-mgmt', icon: 'fa-cake-candles', label: 'Custom Cake Management' },
      { id: 'view-cake', icon: 'fa-eye', label: 'View Cake Requests' },
    ],
    renderMap: {
      'dashboard': renderSalesSupervisorDashboard,
      'cake-mgmt': renderCustomCakeManagement,
      'view-cake': renderViewCustomCakeRequest,
    }
  }
  
};

// create PROFILE_RENDER_MAP

const PROFILE_RENDER_MAP = {
  'profile-dashboard': renderProfileDashboard,
  'my-profile': renderMyProfile,
  'change-password': renderChangePassword,
  'leave-request': renderLeaveRequest,
  'leave-status': renderLeaveStatus,
};



async function renderApp() {
  if (!currentUser) return;
  const config = ROLE_CONFIG[currentUser.role];
  if (!config) return;

  // Guard: if the active tab doesn't belong to this user's role, fall back to dashboard
  if (!isProfilePage && !config.renderMap[currentTab]) {
    currentTab = 'dashboard';
  }

  document.getElementById('userNameDisplay').textContent = currentUser.name;
  document.getElementById('userRoleDisplay').textContent = config.label;

 
  // show profile dropdown options depend on the user (customer doesn't get employee options)
  const profileMenu = document.getElementById('profileMenu');
  if (profileMenu) {
    const isCustomer = currentUser.role === 'customer';
    
    // Hide or show employee-specific profile buttons safely without breaking listeners
    profileMenu.querySelectorAll('.menu-item[data-page]').forEach(item => {
      item.style.display = isCustomer ? 'none' : 'block';
    });
    
    // Hide or show the contextual menu divider element
    const divider = profileMenu.querySelector('.menu-divider');
    if (divider) {
      divider.style.display = isCustomer ? 'none' : 'block';
    }
  }

  // Render the horizontal navigation/sidebar elements
  const menu = document.getElementById('sidebarMenu');
  menu.innerHTML = config.menu.map(item => `
    <li class="${item.id === currentTab && !isProfilePage ? 'active' : ''}" data-tab="${item.id}">
      <i class="fas ${item.icon}"></i> ${item.label}
    </li>
  `).join('');

  menu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', function() {
      const tab = this.dataset.tab;
      currentTab = tab;
      isProfilePage = false;
      document.querySelectorAll('#sidebarMenu li').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      renderContent();
    });
  });

  await renderContent();
}

function renderTab(tabId) {
  currentTab = tabId;
  isProfilePage = false;
  document.querySelectorAll('#sidebarMenu li').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabId);
  });
  renderContent();
}

async function renderContent() {
  if (!currentUser) return;
  const config = ROLE_CONFIG[currentUser.role];
  if (!config) return;

  // Guard: if the active tab doesn't belong to this user's role, fall back to dashboard
  if (!isProfilePage && !config.renderMap[currentTab]) {
    currentTab = 'dashboard';
  }

  let content;
  let title;

  if (isProfilePage) {
    const renderFn = PROFILE_RENDER_MAP[currentTab] || renderProfileDashboard;
    content = renderFn();
    const titles = {
      'profile-dashboard': 'Profile Dashboard',
      'my-profile': 'My Profile',
      'change-password': 'Change Password',
      'leave-request': 'Leave Request',
      'leave-status': 'Leave Status',
    };
    title = titles[currentTab] || 'Profile';
  } else {
    const renderFn = config.renderMap[currentTab];
    content = renderFn ? renderFn() : '<div class="card"><p class="text-muted">Page content</p></div>';
    const menuItem = config.menu.find(m => m.id === currentTab);
    title = menuItem ? menuItem.label : 'Dashboard';
  }

  const rendered = content instanceof Promise ? await content : content;
  document.getElementById('pageContent').innerHTML = rendered;
  document.getElementById('pageTitle').textContent = title;
}

// ============================================================
//  PROFILE DROPDOWN HANDLERS
// ============================================================
document.getElementById('profileBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  document.getElementById('profileMenu').classList.toggle('active');
});

document.addEventListener('click', function() {
  document.getElementById('profileMenu').classList.remove('active');
});

document.querySelectorAll('#profileMenu .menu-item[data-page]').forEach(item => {
  item.addEventListener('click', function() {
    const page = this.dataset.page;
    currentTab = page;
    isProfilePage = true;
    document.getElementById('profileMenu').classList.remove('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#sidebarMenu li').forEach(l => l.classList.remove('active'));
    renderContent();
  });
});

// ============================================================
//  TOAST HELPER
// ============================================================
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:var(--green);color:white;padding:0.8rem 1.8rem;border-radius:60px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:9999;font-weight:500;';
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}