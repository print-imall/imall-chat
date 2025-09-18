// טיפול בתמונות וקישורי שיתוף - רק וואטסאפ

// פונקציה ליצירת URL תמונה
function generateImageUrl(productCode) {
    return CONFIG.imageBaseUrl + productCode + '.jpg';
}

// פונקציה לטיפול בשגיאות תמונות
function handleImageError(img) {
    img.onerror = null;
    img.src = '';
    img.alt = 'אין תמונה';
    img.style.display = 'none';
}

// פונקציה לשיתוף מוצר בווטסאפ
function shareProduct(productCode) {
    const allMsgs = Array.from(document.getElementById('messagesArea').querySelectorAll('.product-result'));
    let prodDiv = null;
    
    allMsgs.forEach(div => {
        if (div.innerHTML.includes('מקט: ' + productCode)) {
            prodDiv = div;
        }
    });
    
    if (!prodDiv) return;
    
    const table = prodDiv.querySelector('.product-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    let productText = '📦 *פרטי מוצר - מק"ט: ' + productCode + '*\n\n';
    
    rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td) {
            const label = th.textContent.trim();
            const value = td.textContent.trim();
            productText += '*' + label + ':* ' + value + '\n';
        }
    });
    
    const imageUrl = generateImageUrl(productCode);
    productText += '\n📷 *תמונה:* ' + imageUrl;
    productText += '\n\n—\n📡 נשלח ממערכת צ\'טמול';
    
    const whatsappUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(productText);
    window.open(whatsappUrl, '_blank');
    
    addMessage('<strong>📱 שיתוף בווטסאפ</strong><br>הנתונים של מק"ט ' + productCode + ' נשלחו לווטסאפ!<br><small>אם הווטסאפ לא נפתח, בדוק שיש לך את האפליקציה מותקנת.</small>');
}

// פונקציה להצגת תוצאת מוצר עם הדגשות
function displayProductResult(item, searchTerms = [], resultNumber = 1, totalResults = 1) {
    const product = item.product;
    const productCode = product['מקט'] || 'לא זמין';
    const imageUrl = generateImageUrl(productCode);
    
    let html = '<div class="product-result">';
    
    // הוספת מספר התוצאה
    if (totalResults > 1) {
        html += `<div style="background: rgba(23, 162, 184, 0.1); padding: 8px 16px; border-radius: 8px 8px 0 0; border-bottom: 2px solid #17a2b8; text-align: center;">
            <small style="color: #17a2b8; font-weight: bold;">תוצאה ${resultNumber} מתוך ${totalResults}</small>
        </div>`;
    }
    
    html += '<div class="product-compact">';
    html += '<div class="product-image-compact">';
    html += `<img src="${imageUrl}" alt="תמונת מוצר ${productCode}" onerror="handleImageError(this)" style="background:#fff" />`;
    html += '</div>';
    html += '<div class="product-info-compact">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    html += '<h3 style="margin: 0; font-size: 21px;">מקט: ' + highlightText(productCode, searchTerms) + '</h3>';
    html += '</div>';
    html += '<div class="product-table-wrapper"><table class="product-table"><tbody>';
    html += '<tr class="highlight-row"><th>פלטפורמה</th><td><strong>' + highlightText(product['פלטפורמה'] || 'לא זמין', searchTerms) + '</strong></td></tr>';
    html += '<tr><th>מתחם</th><td>' + highlightText(product['מתחם'] || 'לא זמין', searchTerms) + '</td></tr>';
    html += '<tr><th>מחיר מכירה</th><td>' + highlightText(product['מחיר מכירה'] || 'לא זמין', searchTerms) + '</td></tr>';
    html += '<tr><th>קמפיין</th><td>' + highlightText(product['קמפיין'] || 'לא זמין', searchTerms) + '</td></tr>';
    html += `<tr><th>גובה</th><td>${highlightText(product['גובה']||'-', searchTerms)}</td></tr>`;
    html += `<tr><th>רוחב</th><td>${highlightText(product['רוחב']||'-', searchTerms)}</td></tr>`;
    html += '<tr><th>מספר מבקרים</th><td>' + highlightText(product['מבקרים'] || '-', searchTerms) + '</td></tr>';
    html += '</tbody></table></div>';
    html += '<div class="action-buttons-product">';
    html += '<button class="btn-share" onclick="shareProduct(\'' + productCode + '\')">📱 שתף בווטסאפ</button>';
    html += '</div></div></div></div>';
    
    addMessage(html);
}

// פונקציה להדגשת מילים בטקסט
function highlightText(text, searchTerms) {
    if (!text || !searchTerms || searchTerms.length === 0) return text;
    
    let highlightedText = String(text);
    searchTerms.forEach(term => {
        if (term.length > 1) { // מדגיש רק מילים באורך 2+ תווים
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark style="background-color: #ffeb3b; padding: 1px 2px; border-radius: 2px; font-weight: bold;">$1</mark>');
        }
    });
    
    return highlightedText;
}
