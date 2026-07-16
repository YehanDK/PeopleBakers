let selectedEmpIndex = null;

async function loadEmployees() {
    const response = await EmployeeAPI.list();
    if (response.success) {
        employees = (response.data || []).map(employee => ({
            ...employee,
            id: String(employee.employee_id ?? employee.id ?? ''),
            employee_id: String(employee.employee_id ?? employee.id ?? ''),
            salary: employee.salary || 0,
            basic_salary: Number(employee.basic_salary || 0),
            payment_date: employee.payment_date || 'N/A',
        }));
    }
    return employees;
}

async function renderManageEmployee() {
    await loadEmployees();
    let rows = employees.map((emp, index) =>
        `<tr>
            <td><span class="employee-id">${emp.employee_id || emp.id}</span></td>
            <td>${emp.name}</td>
            <td>${emp.role}</td>
            <td>${emp.phone || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-yellow" onclick="editEmployee(${index})"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
    ).join('');

    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-user-gear" style="color:var(--primary);margin-right:0.5rem;"></i> Manage Employees</h3>
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                    <input class="search-box" placeholder="Search employees..." id="manageEmpSearch" oninput="filterManageEmployees()" />
                </div>
            </div>
            <table>
                <tr><th>Emp ID</th><th>Name</th><th>Role</th><th>Phone</th><th>Actions</th></tr>
                <tbody id="manageEmpBody">${rows}</tbody>
            </table>
        </div>
        <div class="card">
            <h3>Update Employee Details</h3>
            <p class="text-muted">Select an employee to update their role, salary, address, or phone.</p>
            <div class="form-group"><label>Select Employee</label>
                <select id="empSelect" onchange="loadEmployeeDetails()">
                    <option value="">Select an employee</option>
                    ${employees.map((emp, i) => `<option value="${i}">${emp.employee_id || emp.id} - ${emp.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Role</label><select id="updateRole"><option value="salesassistant">Sales Assistant</option><option value="deliveryemployee">Delivery Employee</option><option value="inventorymanager">Inventory Manager</option><option value="employeemanager">Employee Manager</option><option value="financemanager">Finance Manager</option><option value="salessupervisor">Sales Supervisor</option></select></div>
                <div class="form-group"><label>Phone</label><input id="updatePhone" placeholder="(555) 000-0000" /></div>
            </div>
            <div class="form-group"><label>Address</label><input id="updateAddress" placeholder="Address" /></div>
            <button class="btn" onclick="updateEmployee()">Update Employee</button>
        </div>
    `;
}

async function renderAddNewEmployee() {
    return `
        <div class="card">
            <h3><i class="fas fa-user-plus" style="color:var(--primary);margin-right:0.5rem;"></i> Add New Employee</h3>
            <form id="addEmployeeInlineForm">
                <div class="form-row">
                    <div class="form-group"><label>Full Name <span style="color:var(--danger);">*</span></label><input id="newEmpName" placeholder="John Doe" required /></div>
                    <div class="form-group"><label>Email <span style="color:var(--danger);">*</span></label><input type="email" id="newEmpEmail" placeholder="john@peoplesbakers.com" required /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Phone <span style="color:var(--danger);">*</span></label><input id="newEmpPhone" placeholder="(555) 000-0000" required /></div>
                    <div class="form-group"><label>Role <span style="color:var(--danger);">*</span></label>
                        <select id="newEmpRole">
                            <option value="salesassistant">Sales Assistant</option>
                            <option value="deliveryemployee">Delivery Employee</option>
                            <option value="inventorymanager">Inventory Manager</option>
                            <option value="employeemanager">Employee Manager</option>
                            <option value="financemanager">Finance Manager</option>
                            <option value="salessupervisor">Sales Supervisor</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Username <span style="color:var(--danger);">*</span></label><input id="newEmpUsername" placeholder="john.d" required /></div>
                    <div class="form-group"><label>Password <span style="color:var(--danger);">*</span></label><input type="password" id="newEmpPassword" placeholder="Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢Ã¢â¬Â¢" required /></div>
                </div>
                <div class="form-group"><label>Address</label><input id="newEmpAddress" placeholder="123 Main St, NYC" /></div>
                <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> Add Employee</button>
            </form>
        </div>
    `;
}

async function handleAddEmployeeInline(e) {
    e.preventDefault();
    const name = document.getElementById('newEmpName').value.trim();
    const email = document.getElementById('newEmpEmail').value.trim();
    const phone = document.getElementById('newEmpPhone').value.trim();
    const role = document.getElementById('newEmpRole').value;
    const username = document.getElementById('newEmpUsername').value.trim();
    const password = document.getElementById('newEmpPassword').value.trim();
    const address = document.getElementById('newEmpAddress').value.trim();

    if (!name || !email || !phone || !username || !password) {
        alert('Please fill in all required fields.');
        return;
    }

    const response = await EmployeeAPI.create({
        name, email, phone, role, username, password, address: address || 'N/A'
    });

    if (response.success) {
        showToast(`Employee ${name} added successfully!`);
        await loadEmployees();
        renderTab('manage-employee');
    } else {
        alert(response.message || 'Failed to add employee');
    }
}

async function loadEmployeeDetails() {
    const index = parseInt(document.getElementById('empSelect').value);
    if (isNaN(index) || index < 0) return;
    selectedEmpIndex = index;
    const emp = employees[index];
    document.getElementById('updateRole').value = emp.role || 'salesassistant';
    document.getElementById('updateAddress').value = emp.address || '';
    document.getElementById('updatePhone').value = emp.phone || '';
}

async function updateEmployee() {
    if (selectedEmpIndex < 0 || selectedEmpIndex >= employees.length) return;
    const emp = employees[selectedEmpIndex];
    const data = {
        employee_id: emp.employee_id || emp.id,
        role: document.getElementById('updateRole').value,
        address: document.getElementById('updateAddress').value || emp.address,
        phone: document.getElementById('updatePhone').value || emp.phone,
    };
    
    const response = await EmployeeAPI.update(data);
    if (response.success) {
        showToast(`Employee ${emp.name} updated successfully!`);
        await loadEmployees();
        renderTab('manage-employee');
    } else {
        alert(response.message || 'Failed to update employee');
    }
}

async function deleteEmployee(index) {
    const emp = employees[index];
    if (!confirm(`Delete employee ${emp.name}?`)) return;
    
    const response = await EmployeeAPI.delete(emp.employee_id || emp.id);
    if (response.success) {
        showToast(`Employee ${emp.name} deleted.`);
        await loadEmployees();
        renderTab('manage-employee');
    } else {
        alert(response.message || 'Failed to delete employee');
    }
}

function editEmployee(index) {
    selectedEmpIndex = index;
    const emp = employees[index];
    document.getElementById('empSelect').value = index;
    loadEmployeeDetails();
    document.querySelector('.card:last-child').scrollIntoView({ behavior: 'smooth' });
}

function filterManageEmployees() {
    const search = document.getElementById('manageEmpSearch').value.toLowerCase();
    const filtered = employees.filter(emp =>
        String(emp.employee_id || emp.id).toLowerCase().includes(search) ||
        emp.name.toLowerCase().includes(search) ||
        emp.role.toLowerCase().includes(search)
    );
    const tbody = document.getElementById('manageEmpBody');
    tbody.innerHTML = filtered.map((emp, index) => {
        const origIndex = employees.indexOf(emp);
        return `<tr>
            <td><span class="employee-id">${emp.employee_id || emp.id}</span></td>
            <td>${emp.name}</td>
            <td>${emp.role}</td>
            <td>${emp.phone || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-yellow" onclick="editEmployee(${origIndex})"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${origIndex})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-muted text-center py-2">No employees found matching your search.</td></tr>';
}

async function renderViewEmployees() {
    await loadEmployees();
    let rows = employees.map(emp =>
        `<tr>
            <td><span class="employee-id">${emp.employee_id || emp.id}</span></td>
            <td>${emp.name}</td>
            <td>${emp.role}</td>
            <td>${emp.email}</td>
        </tr>`
    ).join('');

    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-users" style="color:var(--primary);margin-right:0.5rem;"></i> Employee List</h3>
                <input class="search-box" placeholder="Search employees..." id="viewEmpSearch" oninput="filterViewEmployees()" />
            </div>
            <table>
                <tr><th>Emp ID</th><th>Name</th><th>Role</th><th>Email</th></tr>
                <tbody id="viewEmpBody">${rows}</tbody>
            </table>
        </div>
    `;
}

function filterViewEmployees() {
    const search = document.getElementById('viewEmpSearch').value.toLowerCase();
    const filtered = employees.filter(emp =>
        String(emp.employee_id || emp.id).toLowerCase().includes(search) ||
        emp.name.toLowerCase().includes(search) ||
        emp.role.toLowerCase().includes(search)
    );
    const tbody = document.getElementById('viewEmpBody');
    tbody.innerHTML = filtered.map(emp =>
        `<tr>
            <td><span class="employee-id">${emp.employee_id || emp.id}</span></td>
            <td>${emp.name}</td>
            <td>${emp.role}</td>
            <td>${emp.email}</td>
        </tr>`
    ).join('') || '<tr><td colspan="4" class="text-muted text-center py-2">No employees found matching your search.</td></tr>';
}

async function renderLeaveManagement() {
    const response = await LeaveAPI.list();
    const leaveRequests = response.success ? response.data : [];
    
    let rows = leaveRequests.map(l => `
        <tr>
            <td>${l.employee_name || l.employee_id}</td>
            <td>${l.from_date}</td>
            <td>${l.to_date}</td>
            <td>${l.type}</td>
            <td>${l.reason || 'N/A'}</td>
            <td><span class="badge ${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-orange'}">${l.status}</span></td>
            <td>
                ${l.status === 'Pending' ? `
                    <button class="btn btn-sm btn-success" onclick="approveLeave(${l.leave_id})"><i class="fas fa-check"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="rejectLeave(${l.leave_id})"><i class="fas fa-times"></i></button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-calendar-check" style="color:var(--primary);margin-right:0.5rem;"></i> Leave Management</h3>
            </div>
            <table>
                <tr><th>Employee</th><th>From</th><th>To</th><th>Type</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                <tbody>${rows || '<tr><td colspan="7" class="text-muted text-center py-2">No leave requests found.</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

async function approveLeave(id) {
    const response = await LeaveAPI.updateStatus(id, 'Approved');
    if (response.success) {
        showToast('Leave request approved.');
        renderTab('leave-mgmt');
    } else {
        alert(response.message || 'Failed to approve leave');
    }
}

async function rejectLeave(id) {
    const response = await LeaveAPI.updateStatus(id, 'Rejected');
    if (response.success) {
        showToast('Leave request rejected.');
        renderTab('leave-mgmt');
    } else {
        alert(response.message || 'Failed to reject leave');
    }
}