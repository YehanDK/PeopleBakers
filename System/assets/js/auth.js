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
