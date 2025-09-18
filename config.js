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

// פונקציה להוספת הודעה - עדכון לתוצאות חיפוש
function addMessage(content, type = 'system') {
    if (type === 'system-notification') {
        // רק הודעות מערכת ספציפיות יעברו לצד ימין
        addSystemNotification(content);
    } else {
        // כל שאר התוצאות (כולל תוצאות חיפוש) במרכז המסך
        const messagesArea = document.getElementById('messagesArea');
        if (!messagesArea) return;
        
        const message = document.createElement('div');
        message.className = 'message ' + type;
        message.innerHTML = content;
        messagesArea.appendChild(message);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

// פונקציה חדשה להוספת הודעות מערכת לצד ימין
function addSystemNotification(content) {
    const systemMessagesList = document.getElementById('systemMessagesList');
    if (!systemMessagesList) return;
    
    const notification = document.createElement('div');
    notification.style.cssText = 'margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; border-left: 3px solid #17a2b8;';
    notification.innerHTML = `<small style="opacity: 0.8;">${new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</small><br>${content}`;
    
    systemMessagesList.appendChild(notification);
    systemMessagesList.scrollTop = systemMessagesList.scrollHeight;
}

// פונקציה לניקוי היסטוריה - עדכון
function clearHistory() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
        messagesArea.innerHTML = '';
    }
    
    addSystemNotification('<strong>🗑️ ההיסטוריה נוקתה!</strong><br>כל חיפושי העבר נמחקו.');
}
