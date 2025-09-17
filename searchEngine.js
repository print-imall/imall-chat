// מנוע החיפוש וטיפול בתוצאות

// פונקציה לחיפוש מוצרים
function searchProducts(query) {
    if (!query.trim()) return [];
    const searchQuery = query.trim().toLowerCase();
    
    // חיפוש ראשון - רק בעמודה "פלטפורמה"
    const platformResults = productsData.filter(product => {
        const platform = String(product['פלטפורמה'] || '').toLowerCase();
        return platform.includes(searchQuery);
    });
    
    // אם נמצאו תוצאות בפלטפורמה, מחזירים אותן (עד 30)
    if (platformResults.length > 0) {
        return platformResults.slice(0, 30).map(product => ({
            product,
            matchType: 'platform'
        }));
    }
    
    // אם לא נמצאו תוצאות בפלטפורמה, מחפשים בכל השדות
    const searchTerms = searchQuery.split(/\s+/).filter(t => t.length > 0);
    let scored = productsData.map(product => {
        let score = 0;
        Object.values(product).forEach(val => {
            if (!val) return;
            const fieldValue = String(val).toLowerCase();
            searchTerms.forEach(term => {
                if (fieldValue.includes(term)) {
                    score += 1;
                }
            });
        });
        return { product, score };
    }).filter(obj => obj.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    
    return scored.map(obj => ({
        product: obj.product,
        matchType: 'general'
    }));
}

// פונקציה להצגת כל תוצאות החיפוש
function displayAllProductResults(items) {
    currentSearchResults = items;
    if (items.length > 0) {
        const matchType = items[0].matchType;
        if (matchType === 'platform') {
            addMessage(`<strong>🎯 נמצאו ${items.length} תוצאות בפלטפורמה:</strong><br>התוצאות מוצגות לפי התאמה מדויקת בשדה "פלטפורמה".`);
        } else {
            addMessage(`<strong>🔍 נמצאו ${items.length} תוצאות בחיפוש כללי:</strong><br>לא נמצאו התאמות בפלטפורמה, מוצגות תוצאות מכל השדות.`);
        }
        
        // הוספת כפתורי ייצוא לתוצאות החיפוש
        addMessage(`
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <strong>📥 ייצא תוצאות חיפוש:</strong><br>
                <div class="export-buttons" style="margin-top: 10px;">
                    <button class="export-btn excel" onclick="exportSearchResults('excel')">📊 Excel</button>
                    <button class="export-btn csv" onclick="exportSearchResults('csv')">📋 CSV</button>
                    <button class="export-btn json" onclick="exportSearchResults('json')">🔧 JSON</button>
                </div>
            </div>
        `);
    }
    items.forEach(displayProductResult);
}

// פונקציה לביצוע חיפוש
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    addMessage(query, 'user');
    const results = searchProducts(query);
    
    if (results.length === 0) {
        currentSearchResults = [];
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong><br>לא נמצא מוצר התואם לחיפוש "<strong>' + query + '</strong>".<br><br><strong>טיפים לחיפוש טוב יותר:</strong><br>• נסה להקליד שם פלטפורמה מדויק<br>• בדוק את האיות<br>• נסה מילים קצרות יותר<br>• נסה לחפש לפי מספר מקט</div>');
    } else {
        displayAllProductResults(results);
    }
    
    const saveBtn = document.getElementById('saveSearchBtn');
    if (saveBtn) saveBtn.disabled = results.length === 0;
    elements.searchInput.value = '';
}

// פונקציות ייצוא תוצאות חיפוש
function exportSearchResults(format) {
    if (!currentSearchResults || currentSearchResults.length === 0) {
        alert('אין תוצאות חיפוש לייצוא');
        return;
    }
    
    const searchData = currentSearchResults.map(item => item.product);
    const searchQuery = 'תוצאות_חיפוש';
    
    switch (format) {
        case 'excel':
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(searchData);
            XLSX.utils.book_append_sheet(wb, ws, 'תוצאות_חיפוש');
            XLSX.writeFile(wb, `${searchQuery}_${new Date().toISOString().split('T')[0]}.xlsx`);
            break;
            
        case 'csv':
            const csv = convertToCSV(searchData);
            downloadFile(csv, `${searchQuery}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
            break;
            
        case 'json':
            const data = {
                search_query: searchQuery,
                exported_at: new Date().toISOString(),
                results_count: searchData.length,
                results: searchData
            };
            downloadFile(JSON.stringify(data, null, 2), `${searchQuery}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
            break;
    }
    
    addMessage(`<strong>📥 ייצוא ${format.toUpperCase()} הושלם!</strong><br>תוצאות החיפוש יוצאו בהצלחה.`);
}

// פונקציות עזר לחיפושים שמורים
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
    if (elements.searchInput) {
        elements.searchInput.value = searchText;
        performSearch();
    }
}

function deleteSavedSearch(searchId) {
    savedSearches = savedSearches.filter(s => s.id !== searchId);
    localStorage.setItem('companySearches', JSON.stringify(savedSearches));
    updateSavedSearchesDisplay();
}

// פונקציות עזר לייצוא
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}