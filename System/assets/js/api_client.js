// API definitions
//

// employee API

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

// TODO : Restock APi
// TODO : Leave API
