// קובץ הגדרות ומשתנים כלליים

const CONFIG = {
    githubUser: 'print-imall',
    githubRepo: 'company-chat',
    excelFile: 'products.xlsx',
    imageBaseUrl: 'https://ce08731b-43c2-4f80-a021-ec2952b28cdc.netlify.app/',
    imageFormat: 'direct'
};

// משתנים גלובליים
let productsData = [];
let selectedMalls = new Set();
let allMalls = [];
let savedSearches = JSON.parse(localStorage.getItem('companySearches') || '[]');
let currentSearchResults = [];

// אלמנטים בעמוד
const elements = {
    messagesArea: null,
    searchInput: null,
    searchBtn: null,
    statsCard: null,
    productCount: null
};

// פונקציה לעדכון סטטוס
function updateStatus(status, text) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) return;
    
    statusIndicator.className = 'status-indicator ' + status;
    let icon = '⏳';
    if (status === 'ready') icon = '✅';
    else if (status === 'error') icon = '❌';
    
    statusIndicator.innerHTML = '<span>' + icon + '</span><span>' + text + '</span>';
}

// פונקציה להוספת הודעה
function addMessage(content, type = 'system') {
    if (!elements.messagesArea) return;
    
    const message = document.createElement('div');
    message.className = 'message ' + type;
    message.innerHTML = content;
    elements.messagesArea.appendChild(message);
    elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
}

// פונקציה לניקוי היסטוריה
function clearHistory() {
    if (!elements.messagesArea) return;
    
    const systemMessages = elements.messagesArea.querySelectorAll('.message.system');
    const firstSystemMessage = systemMessages[0];
    elements.messagesArea.innerHTML = '';
    
    if (firstSystemMessage) { 
        elements.messagesArea.appendChild(firstSystemMessage);
    }
    
    addMessage('<strong>🗑️ ההיסטוריה נוקתה!</strong><br>כל חיפושי העבר נמחקו.');
}