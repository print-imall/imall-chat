// משתנים גלובליים בסיסיים
let elements = {
    searchInput: document.getElementById('searchInput'),
    messagesArea: document.getElementById('messagesArea'),
    searchBtn: document.getElementById('searchBtn')
};
let currentSearchResults = [];

// פעולה להצגת הודעה (אפשר להחליף לפי איך שאתה מציג הודעות)
function addMessage(html, type = '') {
    if (!elements.messagesArea) return;
    const div = document.createElement('div');
    if (type) div.classList.add('message', type);
    div.innerHTML = html;
    elements.messagesArea.appendChild(div);
    elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
}

// פונקציה שמבצעת את החיפוש
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    addMessage(query, 'user');
    const results = searchProducts(query);

    if (!Array.isArray(results) || results.length === 0) {
        currentSearchResults = [];
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong><br>לא נמצא מוצר התואם לחיפוש "<strong>' + query + '</strong>".</div>');
    } else {
        currentSearchResults = results;
        displayAllProductResults(results);
    }

    elements.searchInput.value = '';
}

// הצגת תוצאות (פשוט)
function displayAllProductResults(items) {
    if (!items || items.length === 0) {
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong></div>');
        return;
    }
    items.forEach(item => displayProductResult(item));
}

// הצגת מוצר בודד
function displayProductResult(item) {
    const product = item.product;
    const html = `
        <div class="product-result">
            <strong>${product['מקט'] || ''}</strong><br>
            ${product['פלטפורמה'] || ''}<br>
            ${product['מתחם'] || ''}<br>
            ${product['מחיר מכירה'] || ''}
        </div>
    `;
    addMessage(html);
}

// חיבור כפתור החיפוש ואירוע Enter
if (elements.searchBtn) {
    elements.searchBtn.addEventListener('click', performSearch);
}
if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}
