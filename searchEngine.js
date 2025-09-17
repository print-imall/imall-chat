// מנוע החיפוש וטיפול בתוצאות - פשוט ללא פילטרים

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
            score: 10
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

    // אין החלת פילטרים ואין מיון
    return Array.isArray(results) ? results.slice(0, 30) : [];
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
            addMessage(`<strong>🎯 נמצאו ${items.length} תוצאות בפלטפורמה:</strong>`);
        } else {
            addMessage(`<strong>🔍 נמצאו ${items.length} תוצאות בחיפוש כללי:</strong>`);
        }

        // הצגת תוצאות עם הדגשות
        items.forEach(item => displayProductResult(item, searchTerms));
    } else {
        addMessage('<div class="error-message"><strong>🔍 לא נמצאו תוצאות</strong></div>');
    }
}

// פונקציה להצגת תוצאה בודדת (פשטני – אפשר לעצב כרצונך)
function displayProductResult(item, searchTerms) {
    const product = item.product;
    const html = `
        <div class="product-result">
            <strong>${highlightText(product['מקט'] || '', searchTerms)}</strong><br>
            ${highlightText(product['פלטפורמה'] || '', searchTerms)}<br>
            ${highlightText(product['מתחם'] || '', searchTerms)}<br>
            ${highlightText(product['מחיר מכירה'] || '', searchTerms)}
        </div>
    `;
    addMessage(html);
}

// דוג' לפונקציה להוספת הודעה (בהנחה שיש לך מערכת הודעות)
function addMessage(html) {
    // תעדכן לפי איך שההודעות מוצגות אצלך
    const msgArea = document.getElementById('messagesArea');
    if (msgArea) {
        const div = document.createElement('div');
        div.innerHTML = html;
        msgArea.appendChild(div);
    }
}

// שים לב: פונקציות ייצוא/הדפסה וכו' – אם תרצה, אשמח להוסיף.
