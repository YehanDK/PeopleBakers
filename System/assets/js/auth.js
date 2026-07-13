// user authenticatin logic

let currentUser = null;
// TODO : employees
let inventoryItems = [];
// TODO : restockRecords 
// TODO : suppliers
// TODO : leaveRequests
let onlineOrders = [];
// TODO : inStoreOrders
let customCakeOrders = [];
let customCakeRequests = [];
let customers = [];
// TODO : stockAlerts = [];
let instoreCart = [];
// TODO : inStoreOrderCounter = 1;
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


        // TODO : restock api
        // TODO : employees api
        // TODO : Leave API

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
