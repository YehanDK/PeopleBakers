const API_BASE = 'modules/';

const API = {
    async call(module, action, method = 'GET', data = null) {
        const url = `${API_BASE}api_handler.php?module=${module}&action=${action}`;
        const options = {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        //*****somthing wrong**** */
        if (data) {
            if (method === 'POST' || method === 'PUT') {
                options.body = JSON.stringify(data);
            } else {
                const params = new URLSearchParams(data).toString();
                const separator = url.includes('?') ? '&' : '?';
                return fetch(`${url}${separator}${params}`, options).then(async (response) => {
                    const text = await response.text();
                    try {
                        const result = JSON.parse(text);
                        if (!result.success) {
                            console.error(`API Error (${module}/${action}):`, result.message);
                        }
                        return result;
                    } catch (e) {
                        console.error('Response is not JSON:', text.substring(0, 200));
                        return { success: false, message: 'Server returned invalid response: ' + text.substring(0, 100) };
                    }
                }).catch((error) => {
                    console.error(`Fetch Error (${module}/${action}):`, error);
                    return { success: false, message: 'Network error: ' + error.message };
                });
            }
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();

            try {
                const result = JSON.parse(text);
                if (!result.success) {
                    console.error(`API Error (${module}/${action}):`, result.message);
                }
                return result;
            } catch (e) {
                console.error('Response is not JSON:', text.substring(0, 200));
                return { success: false, message: 'Server returned invalid response: ' + text.substring(0, 100) };
            }
        } catch (error) {
            console.error(`Fetch Error (${module}/${action}):`, error);
            return { success: false, message: 'Network error: ' + error.message };
        }
    }
};

// TODO : employee API
const EmployeeAPI = {
    login: (username, password) => API.call('employees', 'login', 'POST', { username, password }),
    list: () => API.call('employees', 'list'),
    get: (id) => API.call('employees', 'get', 'GET', { id }),
    create: (data) => API.call('employees', 'create', 'POST', data),
    update: (data) => API.call('employees', 'update', 'POST', data),
    delete: (id) => API.call('employees', 'delete', 'POST', { id }),
};

const CustomerAPI = {
    login: (email, password) => API.call('customers', 'login', 'POST', { email, password }),
    register: (data) => API.call('customers', 'register', 'POST', data),
    update: (data) => API.call('customers', 'update', 'POST', data)
};

const InventoryAPI = {
    list: () => API.call('inventory', 'list'),
    get: (id) => API.call('inventory', 'get', 'GET', { id }),
    create: (data) => API.call('inventory', 'create', 'POST', data),
    update: (data) => API.call('inventory', 'update', 'POST', data),
    delete: (id) => API.call('inventory', 'delete', 'POST', { id }),
    alerts: () => API.call('inventory', 'alerts'),
};

const OrdersAPI = {
    list: (type) => API.call('orders', 'list', 'GET', { type }),
    get: (id) => API.call('orders', 'get', 'GET', { id }),
    create: (data) => API.call('orders', 'create', 'POST', data),
    update: (data) => API.call('orders', 'update', 'POST', data),
    updateStatus: (order_id, status) => API.call('orders', 'updateStatus', 'POST', { order_id, status }),
    updateCakeStatus: (order_id, status) => API.call('orders', 'updateCakeStatus', 'POST', { order_id, status }),
    delete: (id) => API.call('orders', 'delete', 'POST', { id }),
};

//  Restock APi
const RestockAPI = {
    list: () => API.call('restock', 'list'),
    create: (data) => API.call('restock', 'create', 'POST', data),
    update: (data) => API.call('restock', 'update', 'POST', data),
    delete: (id) => API.call('restock', 'delete', 'POST', { id }),
    suppliers: () => API.call('restock', 'suppliers'),
};
// TODO : Leave API
const LeaveAPI = {
    list: (employee_id) => API.call('leave', 'list', 'GET', { employee_id }),
    create: (data) => API.call('leave', 'create', 'POST', data),
    updateStatus: (leave_id, status) => API.call('leave', 'updateStatus', 'POST', { leave_id, status }),
};
// TODO : salary API
const SalaryAPI = {
    list: (employee_id) => API.call('salary', 'list', 'GET', { employee_id }),
    create: (data) => API.call('salary', 'create', 'POST', data),
    delete: (id) => API.call('salary', 'delete', 'POST', { id }),
};

// Custom Cake Order workflow (sales assistant requests -> supervisor approves -> order created)
const CustomAPI = {
    create: (data) => API.call('custom', 'create', 'POST', data),
    list: () => API.call('orders', 'list', 'GET', { type: 'custom' }),
    
    // Reuses the existing 'updateStatus' endpoint to set the Order status to 'Approved'
    approve: (custom_order_id, approved_by, price) => API.call('orders', 'updateStatus', 'POST', { order_id: custom_order_id, status: 'Approved' }),
    
    // Reuses the existing 'updateStatus' endpoint to set the Order status to 'Rejected'
    reject: (custom_order_id) => API.call('orders', 'updateStatus', 'POST', { order_id: custom_order_id, status: 'Rejected' }),
    
    // Reuses the existing 'delete' endpoint
    delete: (custom_order_id) => API.call('orders', 'delete', 'POST', { id: custom_order_id })
};

// expense record api
const ExpensesAPI = {
    list: () => API.call('expenses', 'list', 'GET'),
    create: (data) => API.call('expenses', 'create', 'POST', data),
    delete: (id) => API.call('expenses', 'delete', 'POST', { id })
};
