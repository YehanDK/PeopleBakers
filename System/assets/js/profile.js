function renderMyProfile() {
  const user = currentUser;
  const employeeId = user?.employee_id || user?.id || 'N/A';
  const fullName = user?.name || 'Not available';
  const role = user?.displayRole || 'Employee';
  const email = user?.email || `${user?.username || 'unknown'}@peoplesbakers.local`;
  const phone = user?.phone || 'Not provided';
  const address = user?.address || 'Not provided';

  return `
    <div class="card"><h3>My Profile</h3>
      <div class="form-row">
        <div class="form-group"><label>Employee ID</label><input value="${employeeId}" disabled style="background:#f0ebf7;color:#555;" /></div>
        <div class="form-group"><label>Full Name</label><input value="${fullName}" disabled style="background:#f0ebf7;color:#555;" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Role</label><input value="${role}" disabled style="background:#f0ebf7;color:#555;" /></div>
        <div class="form-group"><label>Email</label><input value="${email}" disabled style="background:#f0ebf7;color:#555;" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Phone</label><input value="${phone}" disabled style="background:#f0ebf7;color:#555;" /></div>
        <div class="form-group"><label>Address</label><input value="${address}" disabled style="background:#f0ebf7;color:#555;" /></div>
      </div>
    </div>
  `;
}

function renderChangePassword() {
  return `
    <div class="card"><h3>Change Password</h3>
      <div class="form-group"><label>Current Password</label><input type="password" id="currentPasswordInput"  /></div>
      <div class="form-group"><label>New Password</label><input type="password" id="newPasswordInput"  /></div>
      <div class="form-group"><label>Confirm Password</label><input type="password" id="confirmPasswordInput"  /></div>
      <button class="btn" onclick="handleChangePassword()">Update Password</button>
    </div>
  `;
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('currentPasswordInput').value;
  const newPassword = document.getElementById('newPasswordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Please fill in all password fields.');
    return;
  }
  if (newPassword !== confirmPassword) {
    alert('New password and confirmation do not match.');
    return;
  }
  const response = await EmployeeAPI.update({
    employee_id: currentUser?.employee_id || currentUser?.id,
    current_password: currentPassword,
    password: newPassword,
  });

  if (!response.success) {
    alert(response.message || 'Failed to update password');
    return;
  }

  document.getElementById('currentPasswordInput').value = '';
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmPasswordInput').value = '';
  showToast('Password updated successfully.');
}

function renderLeaveRequest() {
  return `
    <div class="card"><h3>Request Leave</h3>
      <div class="form-row">
        <div class="form-group"><label>From Date</label><input type="date" id="leaveFromDate" /></div>
        <div class="form-group"><label>To Date</label><input type="date" id="leaveToDate" /></div>
      </div>
      <div class="form-group"><label>Leave Type</label>
        <select id="leaveType"><option>Vacation</option><option>Sick</option><option>Personal</option></select>
      </div>
      <div class="form-group"><label>Reason</label><input id="leaveReason"  /></div>
      <button class="btn" onclick="submitLeaveRequest()">Submit Request</button>
    </div>
  `;
}

async function submitLeaveRequest() {
  const fromDate = document.getElementById('leaveFromDate').value;
  const toDate = document.getElementById('leaveToDate').value;
  const type = document.getElementById('leaveType').value;
  const reason = document.getElementById('leaveReason').value || 'Requested leave';
  
  if (!fromDate || !toDate) {
    alert('Please select dates for your leave request.');
    return;
  }

  const response = await LeaveAPI.create({
    employee_id: currentUser?.employee_id || currentUser?.id,
    type,
    from_date: fromDate,
    to_date: toDate,
    reason
  });

  if (!response.success) {
    alert(response.message || 'Failed to submit leave request');
    return;
  }

  await loadAppData();
  showToast('Leave request submitted successfully!');
  renderTab('leave-status');
}

function renderLeaveStatus() {
  const currentEmployeeName = currentUser?.name || '';
  const currentEmployeeId = currentUser?.employee_id || currentUser?.id || null;

  const userLeaves = leaveRequests.filter(l => {
    const employeeName = l.employee_name || l.employee || l.name || '';
    return employeeName === currentEmployeeName || (currentEmployeeId && l.employee_id && Number(l.employee_id) === Number(currentEmployeeId));
  });
  let rows = userLeaves.map(l =>
    `<tr><td>${l.from_date || l.fromDate}</td><td>${l.to_date || l.toDate}</td><td>${l.type}</td><td><span class="badge ${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-orange'}">${l.status}</span></td></tr>`
  ).join('');
  if (!rows) {
    rows = `<tr><td colspan="4" class="text-muted" style="text-align:center;">No leave requests found.</td></tr>`;
  }
  return `
    <div class="card"><h3>My Leave Requests</h3>
      <table><tr><th>From</th><th>To</th><th>Type</th><th>Status</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

function renderProfileDashboard() {
  const currentEmployeeName = currentUser?.name || '';
  const currentEmployeeId = currentUser?.employee_id || currentUser?.id || null;

  const userLeaves = leaveRequests.filter(l => {
    const employeeName = l.employee_name || l.employee || l.name || '';
    return employeeName === currentEmployeeName || (currentEmployeeId && l.employee_id && Number(l.employee_id) === Number(currentEmployeeId));
  });
  return `
    <div class="card">
      <h3>Profile Dashboard</h3>
      <div class="grid-3" style="margin-top:1rem;">
        <div class="stat-card"><div class="num">${userLeaves.filter(l=>l.status==='Pending').length}</div><div class="label">Pending Leaves</div></div>
        <div class="stat-card"><div class="num">${userLeaves.filter(l=>l.status==='Approved').length}</div><div class="label">Approved Leaves</div></div>
        <div class="stat-card"><div class="num">${userLeaves.length}</div><div class="label">Total Requests</div></div>
      </div>
      <div class="card-header"><h3>Recent Activity</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Event</th><th>Time</th></tr>
        <tr><td>Profile viewed</td><td>${new Date().toLocaleTimeString()}</td></tr>
        <tr><td>Last login</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
    </div>
  `;
}