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
    if (!query || !query.trim()) return [];
    const searchQuery = query.trim().toLowerCase();

    let platformResults = Array.isArray(productsData)
        ? productsData.filter(product => {
            const platform = String(product['פלטפורמה'] || '').toLowerCase();
            return platform.includes(searchQuery);
        })
        : [];

    let results = [];
    if (platformResults.length > 0) {
        results = platformResults.map(product => ({
            product,
            matchType: 'platform',
            score: 10 // ניקוד גבוה לפלטפורמה
        }));
    } else if (Array.isArray(productsData)) {
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

    results = applyFilters(results);
    results = sortResults(results);
    return Array.isArray(results) ? results.slice(0, 30) : [];
}

// פונקציה להחלת פילטרים
function applyFilters(results) {
    if (!Array.isArray(results)) return [];
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
    if (!Array.isArray(results)) return [];
    switch (activeFilters.sortBy) {
        case 'price_low':
            return results.slice().sort((a, b) => {
                const priceA = Number(String(a.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                const priceB = Number(String(b.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                return priceA - priceB;
            });
        case 'price_high':
            return results.slice().sort((a, b) => {
                const priceA = Number(String(a.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                const priceB = Number(String(b.product['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
                return priceB - priceA;
            });
        case 'visitors_high':
            return results.slice().sort((a, b) => {
                const visitorsA = Number(String(a.product['מבקרים'] || '0').replace(/[^0-9]/g, ''));
                const visitorsB = Number(String(b.product['מבקרים'] || '0').replace(/[^0-9]/g, ''));
                return visitorsB - visitorsA;
            });
        case 'relevance':
        default:
            return results.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
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
            addMessage(`<strong>🎯 נמצאו ${items.length} תוצאות בפלטפורמה:</strong><br>התוצאות מוצגות לפי התאמה מדויקת בשדה "פלטפורמה"[...]`);
        } else {
            addMessage(`<strong>🔍 נמצאו ${items.length} תוצאות בחיפוש כללי:</strong><br>לא נמצאו התאמות בפלטפורמה, מוצגות תוצאות מכל �[...]`);
        }

        // הצגת פילטרים פעילים
        const activeFiltersText = getActiveFiltersText();
        if (activeFiltersText) {
            addMessage(`<div style="background: rgba(33,150,243,0.1); padding: 10px; border-radius: 6px; margin: 5px 0;"><strong>🔧 פילטרים פעילים:</strong><br>${activeFiltersText}[...]`);
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

// המשך הפונקציות (getActiveFiltersText, displayProductResult, exportSearchResults, printResults וכו') - ללא שינוי מהקוד שלך.
