// מנוע החיפוש וטיפול בתוצאות - רק שליחה בוואטסאפ

// פונקציה לחיפוש מוצרים
function searchProducts(query) {
    if (!query.trim()) return [];
    const searchQuery = query.trim().toLowerCase();
    
    // חיפוש ראשון - רק בעמודה "פלטפורמה"
    let platformResults = productsData.filter(product => {
        const platform = String(product['פלטפורמה'] || '').toLowerCase();
        return platform.includes(searchQuery);
    });
    
    // אם נמצאו תוצאות בפלטפורמה, השתמש בהן
    let results = [];
    if (platformResults.length > 0) {
        results = platformResults.map(product => ({
            product,
            matchType: 'platform',
            score: 10 // ניקוד גבוה לפלטפורמה
        }));
    } else {
        // חיפוש כללי בכל השדות
        const searchTerms = searchQuery.split(/\s+/).filter(t => t.length > 0);
        let scored = productsData.map(product => {
            let score = 0;
            Object.entries(product).forEach(([key, val]) => {
                if (!val) return;
                const fieldValue = String(val).toLowerCase();
                searchTerms.forEach(term => {
                    if (fieldValue.includes(term)) {
                        // ניקוד גבוה יותר לשדות חשובים
                        if (key === 'מקט') score += 5;
                        else if (key === 'מתחם') score += 3;
                        else score += 1;
                    }
                });
            });
            return { product, score, matchType: 'general' };
        }).filter(obj => obj.score > 0);
        
        results = scored;
    }
    
    // מיון תוצאות לפי רלוונטיות
    results = results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // הגבלה ל-30 תוצאות
    return results.slice(0, 30);
}

// פונקציה להדגשת מילים בטקסט
function highlightText(text, searchTerms) {
    if (!text || !searchTerms || searchTerms.length === 0) return text;
    
    let highlightedText = String(text);
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark style="background-color: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    });
    
    return highlightedText;
}

// פונקציה להצגת כל תוצאות החיפוש עם הדגשות
function displayAllProductResults(items) {
    currentSearchResults = items;
    if (items.length > 0) {
        const matchType = items[0].matchType;
        const currentQuery = document.getElementById('searchInput').value.trim();
        const searchTerms = currentQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        
        if (matchType === 'platform') {
            addMessage(`<strong>🎯 נמצאו ${items.length} תוצאות בפלטפורמה:</strong><br>התוצאות מוצגות לפי התאמה מדויקת בשדה "פלטפורמה".`);
        } else {
            addMessage(`<strong>🔍 נמצאו ${items.length} תוצאות בחיפוש כללי:</strong><br>לא נמצאו התאמות בפלטפורמה, מוצגות תוצאות מכל השדות.`);
        }
        
        // הצגת תוצאות עם הדגשות
        items.forEach(item => displayProductResult(item, searchTerms));
    }
}

// פונקציה לביצוע חיפוש
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    if (!query) return;
    
    addMessage(query, 'user');
    const results = searchProducts(query);
    
    if (results.length === 0) {
        currentSearchResults = [];
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong><br>לא נמצא מוצר התואם לחיפוש "<strong>' + query + '</strong>".<br><br><strong>טיפים לחיפוש טוב יותר:</strong><br>• נסה להקליד שם פלטפורמה מדויק<br>• בדוק את האיות<br>• נסה מילים קצרות יותר<br>• נסה לחפש לפי מספר מקט<br>• נסה להסיר כמה מילים</div>');
    } else {
        displayAllProductResults(results);
    }
    
    const saveBtn = document.getElementById('saveSearchBtn');
    if (saveBtn) saveBtn.disabled = results.length === 0;
    searchInput.value = '';
}

function updateSavedSearchesDisplay() {
    const container = document.getElementById('savedSearchesContainer');
    const list = document.getElementById('savedSearchesList');
    
    if (!container || !list) return;
    
    if (savedSearches.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = savedSearches.map(search => `
        <div class="saved-search-item">
            <div class="saved-search-text">
                <strong>"${search.text}"</strong><br>
                <small>${search.date} • ${search.results_count} תוצאות</small>
            </div>
            <div class="saved-search-actions">
                <button class="saved-search-btn search-btn-load" onclick="loadSavedSearch('${search.text}')">טען</button>
                <button class="saved-search-btn search-btn-delete" onclick="deleteSavedSearch(${search.id})">מחק</button>
            </div>
        </div>
    `).join('');
}

function loadSavedSearch(searchText) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = searchText;
        performSearch();
    }
}

function deleteSavedSearch(searchId) {
    savedSearches = savedSearches.filter(s => s.id !== searchId);
    localStorage.setItem('companySearches', JSON.stringify(savedSearches));
    updateSavedSearchesDisplay();
}
