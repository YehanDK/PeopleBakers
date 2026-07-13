<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Peoples Bakers - Login Page</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <link rel="stylesheet" href="assets/css/styles.css" />
</head>
<body>

  <!-- LOGIN PAGE -->
<div id="loginPage">
  <div class="login-card">
    <div class="logo">
      <img src="assets/images/peoples-bakers-logo.png" alt="Peoples Bakers Logo" style="height: 80px; border-radius: 50%; object-fit: cover;">
      <h1>Peoples <span>Bakers</span></h1>
    </div>

    <div class="login-tabs" style="display:flex; margin-bottom:1.5rem; border-bottom:1px solid var(--border-light);">
      <button id="tabCustomer" style="flex:1; padding:0.8rem; background:none; border:none; border-bottom:2px solid var(--primary); font-weight:600; color:var(--primary); font-size:0.9rem; cursor:pointer; transition:0.2s;">Customer</button>
      <button id="tabStaff" style="flex:1; padding:0.8rem; background:none; border:none; font-weight:600; color:var(--text-gray); font-size:0.9rem; cursor:pointer; transition:0.2s;">Staff Login</button>
    </div>

    <div id="viewCustomerLogin">
      <form id="customerLoginForm">
        <div class="form-group">
          <label><i class="fas fa-envelope"></i> Email Address</label>
          <input type="email" id="customerLoginEmail" placeholder="Enter your registered email" required />
        </div>
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <input type="password" id="customerLoginPassword" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="btn-login">Sign In</button>
        <div id="customerLoginError" class="login-error"></div>
      </form>
      <div class="login-hint" style="text-align:center; margin-top:1.2rem;">
        <span>New to Peoples Bakers? <a href="#" id="linkRegister" style="color:var(--primary); font-weight:600; text-decoration:none;">Create an Account</a></span>
      </div>
    </div>

    <div id="viewCustomerRegister" style="display:none;">
      <form id="customerRegisterForm">
        <div class="form-group">
          <label><i class="fas fa-user"></i> Full Name</label>
          <input type="text" id="regName" placeholder="e.g. Jane Doe" required />
        </div>
        <div class="form-group">
          <label><i class="fas fa-envelope"></i> Email Address</label>
          <input type="email" id="regEmail" placeholder="jane@example.com" required />
        </div>
        <div class="form-group">
          <label><i class="fas fa-phone"></i> Phone Number</label>
          <input type="text" id="regPhone" placeholder="e.g. 0771234567" />
        </div>
        <div class="form-group">
          <label><i class="fas fa-map-marker-alt"></i> Delivery Address</label>
          <input type="text" id="regAddress" placeholder="Enter your delivery neighborhood/street" />
        </div>
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Choose Password</label>
          <input type="password" id="regPassword" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn-login" style="background:var(--green);">Create Account</button>
        <div id="regError" class="login-error"></div>
      </form>
      <div class="login-hint" style="text-align:center; margin-top:1.2rem;">
        <span><a href="#" id="linkBackToLogin" style="color:var(--text-gray); text-decoration:none;"><i class="fas fa-arrow-left me-1"></i> Back to Sign In</a></span>
      </div>
    </div>

    <div id="viewStaffLogin" style="display:none;">
      <form id="loginForm">
        <div class="form-group">
          <label><i class="fas fa-user"></i> Username</label>
          <input type="text" id="loginUsername" placeholder="Enter your username" required />
        </div>
        <div class="form-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <input type="password" id="loginPassword" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="btn-login" style="background:var(--primary-dark);">Staff Sign In</button>
        <div id="loginError" class="login-error">Invalid username or password</div>
      </form>
      <div class="login-hint">
        <strong>Sign in with your employee account.</strong><br />
        <span style="display:block;font-size:0.75rem;margin-top:0.3rem;color:var(--text-gray);">Use the username and password assigned to your role in the database.</span>
      </div>
    </div>

  </div>
</div>

  <!-- APP -->
  <div id="app">
    <header class="app-header">
      <div class="brand">
        <svg viewBox="0 0 60 60" fill="none" width="32" height="32">
          <rect x="4" y="10" width="52" height="40" rx="10" fill="#6b3fa0" />
          <path d="M18 28L24 20L30 28L36 20L42 28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="24" cy="38" r="4" fill="#f9c80e" />
          <circle cx="36" cy="38" r="4" fill="#f9c80e" />
          <rect x="8" y="8" width="44" height="6" rx="3" fill="#f9c80e" />
        </svg>
        <span>Peoples<span>Bakers</span></span>
      </div>
      <div class="user-info">
        <span id="userNameDisplay" style="font-weight:500;">Loading user...</span>
        <span class="role-badge" id="userRoleDisplay">Employee</span>
        
        <div class="profile-dropdown">
          <button class="profile-btn" id="profileBtn">
            <i class="fas fa-user-circle"></i>
            <i class="fas fa-chevron-down" style="font-size:0.6rem;color:var(--text-gray);"></i>
          </button>
          <div class="profile-dropdown-menu" id="profileMenu">
            <button class="menu-item" data-page="profile-dashboard"><i class="fas fa-id-card"></i> Profile Dashboard</button>
            <button class="menu-item" data-page="my-profile"><i class="fas fa-user"></i> My Profile</button>
            <button class="menu-item" data-page="change-password"><i class="fas fa-key"></i> Change Password</button>
            <button class="menu-item" data-page="leave-request"><i class="fas fa-paper-plane"></i> Leave Request</button>
            <button class="menu-item" data-page="leave-status"><i class="fas fa-clipboard-list"></i> Leave Status</button>
            <div class="menu-divider"></div>
            <button class="menu-item" id="logoutFromProfile"><i class="fas fa-sign-out-alt" style="color:var(--red);"></i> Logout</button>
          </div>
        </div>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar" id="sidebar">
        <ul class="sidebar-menu" id="sidebarMenu"></ul>
      </aside>

      <main class="main-content" id="mainContent">
        <div class="page-title" id="pageTitle">Dashboard</div>
        <div id="pageContent"></div>
      </main>
    </div>
  </div>

  <!-- ALL MODALS (same as before) -->

  <!-- ============================================================ -->
  <!-- SCRIPTS - Load in correct order -->
  <!-- ============================================================ -->

  <!-- 1. API CLIENT -->
  <script src="assets/js/api_client.js"></script>

  <!-- 2. AUTHENTICATION -->
  <script src="assets/js/auth.js"></script>

  <!-- 3. loads online store ui -->
  <script src="assets/js/onlineStore.js"></script>

  <!-- 4. APP (must load last) -->
  <script src="assets/js/app.js"></script>

</body>
</html>