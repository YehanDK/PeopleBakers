// user authenticatin logic

let currentUser = null;
let employees = [];
let inventoryItems = [];
// TODO : restockRecords 
// TODO : suppliers
let leaveRequests = [];
let restockRecords = [];
let suppliers = [];
// TODO : leaveRequests
let onlineOrders = [];
let inStoreOrders = [];
let customCakeOrders = [];
let customCakeRequests = [];
let customers = [];
let stockAlerts = [];
let instoreCart = [];
let inStoreOrderCounter = 1;
let customCakeCounter = 1;

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('peoplesBakersUser');
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
    
    // Reset to default Customer Login tab view on logout
    const tabCustomer = document.getElementById('tabCustomer');
    if (tabCustomer) tabCustomer.click();
}

async function loadAppData() {
    try {
        if (typeof InventoryAPI !== 'undefined') {
            const inventoryResponse = await InventoryAPI.list();
            if (inventoryResponse.success) {
                inventoryItems = (inventoryResponse.data || []).map(item => ({
                    ...item,
                    product_id: item.product_id || item.id,
                    name: item.name || '',
                    price: Number(item.price || 0),
                    stock: Number(item.stock_qty || item.stock || 0),
                    stock_qty: Number(item.stock_qty || item.stock || 0),
                    category: item.category_name || item.category || 'General',
                    category_id: item.category_id || null,
                }));
            }

            const alertsResponse = await InventoryAPI.alerts();
            if (alertsResponse.success) {
                stockAlerts = alertsResponse.data || [];
            }
        }


        if (typeof RestockAPI !== 'undefined') {
            const restockResponse = await RestockAPI.list();
            if (restockResponse.success) {
                restockRecords = (restockResponse.data || []).map(record => ({
                    ...record,
                    id: String(record.restock_id ?? record.id ?? ''),
                    product_id: record.product_id || null,
                    supplier_id: record.supplier_id || null,
                    item: record.product_name || record.item || '',
                    supplier: record.supplier_name || record.supplier || '',
                    qty: Number(record.quantity || record.qty || 0),
                    unitCost: Number(record.unit_cost || record.unitCost || 0),
                    date: record.restock_date || record.date || '',
                    notes: record.notes || '',
                }));
            }

            const suppliersResponse = await RestockAPI.suppliers();
            if (suppliersResponse.success) {
                suppliers = suppliersResponse.data || [];
            }
        }
        // TODO : employees api
        if (typeof EmployeeAPI !== 'undefined') {
            const employeesResponse = await EmployeeAPI.list();
            if (employeesResponse.success) {
                employees = (employeesResponse.data || []).map(employee => ({
                    ...employee,
                    id: String(employee.employee_id ?? employee.id ?? ''),
                    employee_id: String(employee.employee_id ?? employee.id ?? ''),
                    name: employee.name || '',
                    username: employee.username || ''
                }));
            }
        }
        // TODO : Leave API
        if (typeof LeaveAPI !== 'undefined') {
            const leaveResponse = await LeaveAPI.list();
            if (leaveResponse.success) {
                leaveRequests = leaveResponse.data || [];
            }
        }

        if (typeof OrdersAPI !== 'undefined') {
            const ordersResponse = await OrdersAPI.list('all');
            if (ordersResponse.success) {
                const orders = (ordersResponse.data || []).map(order => ({
                    ...order,
                    id: order.order_id || order.id,
                    customer: order.customer_name || order.customer || 'Guest Customer',
                    total: Number(order.total_amount || order.total || 0),
                    status: order.status || 'Pending',
                    date: order.order_date || order.date || '',
                    order_type: order.order_type || order.type || '',
                    items: Array.isArray(order.items) ? order.items.map(item => ({
                        ...item,
                        name: item.product_name || item.name || '',
                        qty: Number(item.quantity || item.qty || 0),
                        price: Number(item.price_at_time || item.price || 0),
                    })) : []
                }));

                onlineOrders = orders.filter(order => (order.order_type || '').toLowerCase() === 'online');
                inStoreOrders = orders.filter(order => (order.order_type || '').toLowerCase() === 'instore');
                customCakeRequests = orders.filter(order => (order.order_type || '').toLowerCase() === 'custom').map(order => ({
                    ...order,
                    customer: order.customer_name || order.customer || 'Guest Customer',
                    design: order.design_details || order.description || 'Custom cake request',
                    phone: order.phone || 'N/A',
                    description: order.description || order.design_details || 'No description provided',
                    date: order.date || order.order_date || ''
                }));
                customCakeCounter = Math.max(1, customCakeRequests.length + 1);
                inStoreOrderCounter = Math.max(1, inStoreOrders.length + 1);
            }
        }
    } catch (error) {
        console.error('Failed to load app data:', error);
    }
}

// TODO :employee login 
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    try {
        const response = await EmployeeAPI.login(username, password);

        if (!response.success) {
            errorEl.style.display = 'block';
            errorEl.textContent = response.message || 'Invalid username or password';
            return;
        }

        errorEl.style.display = 'none';
        currentUser = response.data;

        const roleMap = {
            'salesassistant': 'Sales Assistant',
            'deliveryemployee': 'Delivery Employee',
            'inventorymanager': 'Inventory Manager',
            'employeemanager': 'Employee Manager',
            'companymanager': 'Company Manager',
            'financemanager': 'Finance Manager',
            'salessupervisor': 'Sales Supervisor'
        };
        currentUser.displayRole = roleMap[currentUser.role] || currentUser.role;

        localStorage.setItem('peoplesBakersUser', JSON.stringify(currentUser));

        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        await loadAppData();
        renderApp();
    } catch (error) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Network error: ' + error.message;
    }
});

const savedUser = localStorage.getItem('peoplesBakersUser');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        loadAppData().then(() => renderApp());
    } catch (e) {
        localStorage.removeItem('peoplesBakersUser');
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
} else {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

document.getElementById('logoutFromProfile').addEventListener('click', function() {
    document.getElementById('profileMenu').classList.remove('active');
    handleLogout();
});


// Login page tab switching logic
const tabCustomer = document.getElementById('tabCustomer');
const tabStaff = document.getElementById('tabStaff');

const viewCustomerLogin = document.getElementById('viewCustomerLogin');
const viewCustomerRegister = document.getElementById('viewCustomerRegister');
const viewStaffLogin = document.getElementById('viewStaffLogin');

const linkRegister = document.getElementById('linkRegister');
const linkBackToLogin = document.getElementById('linkBackToLogin');

// Helper function to clear alert blocks and form inputs upon tab adjustments
function resetFormViews() {
    ['customerLoginForm', 'customerRegisterForm', 'loginForm'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    });
    ['customerLoginError', 'regError', 'loginError'].forEach(errId => {
        const errEl = document.getElementById(errId);
        if (errEl) errEl.style.display = 'none';
    });
}

if (tabCustomer && tabStaff) {
    // Handle Switch to Customer Login Track
    tabCustomer.addEventListener('click', function() {
        resetFormViews();
        
        // Apply Active highlighting to Customer tab link
        tabCustomer.style.borderBottom = '2px solid var(--primary)';
        tabCustomer.style.color = 'var(--primary)';
        tabStaff.style.borderBottom = 'none';
        tabStaff.style.color = 'var(--text-gray)';

        // Toggle Panel Containers
        viewCustomerLogin.style.display = 'block';
        viewCustomerRegister.style.display = 'none';
        viewStaffLogin.style.display = 'none';
    });

    // Handle Switch to Staff Login Track
    tabStaff.addEventListener('click', function() {
        resetFormViews();
        
        // Apply Active highlighting to Staff tab link
        tabStaff.style.borderBottom = '2px solid var(--primary)';
        tabStaff.style.color = 'var(--primary)';
        tabCustomer.style.borderBottom = 'none';
        tabCustomer.style.color = 'var(--text-gray)';

        // Toggle Panel Containers
        viewStaffLogin.style.display = 'block';
        viewCustomerLogin.style.display = 'none';
        viewCustomerRegister.style.display = 'none';
    });
}

// Customer internal link: Toggle from Sign In to Create Account
if (linkRegister) {
    linkRegister.addEventListener('click', function(e) {
        e.preventDefault();
        resetFormViews();
        viewCustomerLogin.style.display = 'none';
        viewCustomerRegister.style.display = 'block';
    });
}

// Customer internal link: Toggle from Create Account back to Sign In
if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        resetFormViews();
        viewCustomerRegister.style.display = 'none';
        viewCustomerLogin.style.display = 'block';
    });
}


// customer login authentication
const customerLoginForm = document.getElementById('customerLoginForm');

if (customerLoginForm) {
    customerLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('customerLoginEmail').value.trim();
        const password = document.getElementById('customerLoginPassword').value.trim();
        const errorEl = document.getElementById('customerLoginError');
        
        try {
            const response = await CustomerAPI.login(email, password);
            if (!response.success) {
                errorEl.style.display = 'block';
                errorEl.textContent = response.message || 'Invalid email or password.';
                return;
            }
            errorEl.style.display = 'none';
            
            // Assign the active session state
            currentUser = response.data;
            currentUser.displayRole = 'Valued Customer';
            
            // Save locally for session persistence loop
            localStorage.setItem('peoplesBakersUser', JSON.stringify(currentUser));
            
            // Swap display screens and mount workspace controls
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            
            await loadAppData();
            currentTab = 'online-store'; // Set default view route
            renderApp();
            
        } catch (error) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Network error: ' + error.message;
        }
    });
}

// customer account creation logic
const customerRegisterForm = document.getElementById('customerRegisterForm');

if (customerRegisterForm) {
    customerRegisterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Grab values from inputs securely
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const address = document.getElementById('regAddress').value.trim();
        const password = document.getElementById('regPassword').value;
        const errorEl = document.getElementById('regError');
        
        try {
            // Send registration payload through api_client bridge
            const response = await CustomerAPI.register({ 
                name, 
                email, 
                password, 
                phone, 
                address 
            });
            
            if (!response.success) {
                errorEl.style.display = 'block';
                errorEl.textContent = response.message || 'Registration failed.';
                return;
            }
            
            // Clean up elements and display completion confirmation
            errorEl.style.display = 'none';
            customerRegisterForm.reset();
            showToast('Account created successfully! Please sign in.');
            
            // Redirect the viewport safely back to the Sign-In interface view
            document.getElementById('viewCustomerRegister').style.display = 'none';
            document.getElementById('viewCustomerLogin').style.display = 'block';
            
        } catch (error) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Network error: ' + error.message;
        }
    });
}