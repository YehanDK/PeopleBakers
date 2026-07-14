// API definitions
//

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
    updateStatus: (order_id, status) => API.call('orders', 'updateStatus', 'POST', { order_id, status }),
};

// TODO : Restock API
// TODO : Leave API
// TODO : salary API
