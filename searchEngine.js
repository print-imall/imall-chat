// מנוע החיפוש וטיפול בתוצאות - מתקדם

// משתנים לפילטרים
let activeFilters = {
    priceMin: null,
    priceMax: null,
    selectedMalls: [],
    campaignType: 'all',
    sortBy: 'relevance'
};

// פונקציה לחיפוש מוצרים עם פילטרים
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
    
    // החלת פילטרים
    results = applyFilters(results);
    
    // מיון תוצאות
    results = sortResults(results);
    
    // הגבלה ל-30 תוצאות
    return results.slice(0, 30);
}

// פונקציה להחלת פילטרים
function applyFilters(results) {
    return results.filter(item => {
        const product = item.product;
        
        // פילטר מחיר
        if (activeFilters.priceMin !== null || activeFilters.priceMax !== null) {
            const price = Number(String(product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
            if (activeFilters.priceMin !== null && price < activeFilters.priceMin) return false;
            if (activeFilters.priceMax !== null && price > activeFilters.priceMax) return false;
        }
        
        // פילטר מתחמים
        if (activeFilters.selectedMalls.length > 0) {
            const mall = product['מתחם'] || '';
            if (!activeFilters.selectedMalls.includes(mall)) return false;
        }
        
        // פילטר סוג קמפיין
        if (activeFilters.campaignType !== 'all') {
            const platform = product['פלטפורמה'] || '';
            if (activeFilters.campaignType === 'פרינט' && !platform.includes('פרינט')) return false;
            if (activeFilters.campaignType === 'דיגיטלי' && !platform.includes('דיגיטלי')) return false;
        }
        
        return true;
    });
}

// פונקציה למיון תוצאות
function sortResults(results) {
    switch (activeFilters.sortBy) {
        case 'price_low':
            return results.sort((a, b) => {
                const priceA = Number(String(a.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                const priceB = Number(String(b.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                return priceA - priceB;
            });
        case 'price_high':
            return results.sort((a, b) => {
                const priceA = Number(String(a.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                const priceB = Number(String(b.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                return priceB - priceA;
            });
        case 'visitors_high':
            return results.sort((a, b) => {
                const visitorsA = Number(String(a.product['מבקרים'] || '0').replace(/[^0-9]/g, ''));
                const visitorsB = Number(String(b.product['מבקרים'] || '0').replace(/[^0-9]/g, ''));
                return visitorsB - visitorsA;
            });
        case 'relevance':
        default:
            return results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
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
        const currentQuery = elements.searchInput.value.trim();
        const searchTerms = currentQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        
        if (matchType === 'platform') {
            addMessage(`<strong>🎯 נמצאו ${items.length} תוצאות בפלטפורמה:</strong><br>התוצאות מוצגות לפי התאמה מדויקת בשדה "פלטפורמה".`);
        } else {
            addMessage(`<strong>🔍 נמצאו ${items.length} תוצאות בחיפוש כללי:</strong><br>לא נמצאו התאמות בפלטפורמה, מוצגות תוצאות מכל השדות.`);
        }
        
        // הצגת פילטרים פעילים
        const activeFiltersText = getActiveFiltersText();
        if (activeFiltersText) {
            addMessage(`<div style="background: rgba(33,150,243,0.1); padding: 10px; border-radius: 6px; margin: 5px 0;"><strong>🔧 פילטרים פעילים:</strong><br>${activeFiltersText}</div>`);
        }
        
        // הוספת כפתורי ייצוא לתוצאות החיפוש
        addMessage(`
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <strong>📥 ייצא תוצאות חיפוש:</strong><br>
                <div class="export-buttons" style="margin-top: 10px;">
                    <button class="export-btn excel" onclick="exportSearchResults('excel')">📊 Excel</button>
                    <button class="export-btn csv" onclick="exportSearchResults('csv')">📋 CSV</button>
                    <button class="export-btn json" onclick="exportSearchResults('json')">🔧 JSON</button>
                    <button class="export-btn" style="background: linear-gradient(135deg, #e91e63, #ad1457); color: white;" onclick="printResults()">🖨️ הדפס</button>
                </div>
            </div>
        `);
        
        // הצגת תוצאות עם הדגשות
        items.forEach(item => displayProductResult(item, searchTerms));
    }
}

// פונקציה לקבלת טקסט פילטרים פעילים
function getActiveFiltersText() {
    const filters = [];
    
    if (activeFilters.priceMin !== null) filters.push(`מחיר מינימלי: ${activeFilters.priceMin.toLocaleString()} ₪`);
    if (activeFilters.priceMax !== null) filters.push(`מחיר מקסימלי: ${activeFilters.priceMax.toLocaleString()} ₪`);
    if (activeFilters.selectedMalls.length > 0) filters.push(`מתחמים: ${activeFilters.selectedMalls.join(', ')}`);
    if (activeFilters.campaignType !== 'all') filters.push(`סוג קמפיין: ${activeFilters.campaignType}`);
    if (activeFilters.sortBy !== 'relevance') {
        const sortLabels = {
            'price_low': 'מחיר נמוך לגבוה',
            'price_high': 'מחיר גבוה לנמוך',
            'visitors_high': 'מבקרים (גבוה לנמוך)'
        };
        filters.push(`מיון: ${sortLabels[activeFilters.sortBy] || activeFilters.sortBy}`);
    }
    
    return filters.join(' • ');
}

// פונקציה לביצוע חיפוש עם עדכון הפילטרים
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    addMessage(query, 'user');
    const results = searchProducts(query);
    
    if (results.length === 0) {
        currentSearchResults = [];
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong><br>לא נמצא מוצר התואם לחיפוש "<strong>' + query + '</strong>".<br><br><strong>טיפים לחיפוש טוב יותר:</strong><br>• נסה להקליד שם פלטפורמה מדויק<br>• בדוק את האיות<br>• נסה מילים קצרות יותר<br>• נסה לחפש לפי מספר מקט<br>• נסה להסיר כמה פילטרים</div>');
    } else {
        displayAllProductResults(results);
    }
    
    const saveBtn = document.getElementById('saveSearchBtn');
    if (saveBtn) saveBtn.disabled = results.length === 0;
    elements.searchInput.value = '';
}

// פונקציה להדפסת תוצאות
function printResults() {
    if (!currentSearchResults || currentSearchResults.length === 0) {
        alert('אין תוצאות להדפסה');
        return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>תוצאות חיפוש - איימולון</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .product { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; }
                .product-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 8px; border: 1px solid #ddd; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>איימולון - תוצאות חיפוש</h1>
                <p>תאריך: ${new Date().toLocaleDateString('he-IL')} | סה"כ תוצאות: ${currentSearchResults.length}</p>
            </div>
    `);
    
    currentSearchResults.forEach((item, index) => {
        const product = item.product;
        printWindow.document.write(`
            <div class="product">
                <div class="product-title">${index + 1}. מק"ט: ${product['מקט'] || 'לא זמין'}</div>
                <table>
                    <tr><th>פלטפורמה</th><td>${product['פלטפורמה'] || 'לא זמין'}</td></tr>
                    <tr><th>מתחם</th><td>${product['מתחם'] || 'לא זמין'}</td></tr>
                    <tr><th>מחיר מכירה</th><td>${product['מחיר מכירה'] || 'לא זמין'}</td></tr>
                    <tr><th>קמפיין</th><td>${product['קמפיין'] || 'לא זמין'}</td></tr>
                    <tr><th>גובה</th><td>${product['גובה'] || '-'}</td></tr>
                    <tr><th>רוחב</th><td>${product['רוחב'] || '-'}</td></tr>
                    <tr><th>מספר מבקרים</th><td>${product['מבקרים'] || '-'}</td></tr>
                </table>
            </div>
        `);
    });
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    addMessage('<strong>🖨️ הדפסה הושלמה!</strong><br>תוצאות החיפוש נשלחו להדפסה.');
}

// פונקציות עזר קיימות (ללא שינוי)
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
