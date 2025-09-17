// טיפול בתמונות וקישורי שיתוף

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
    const allMsgs = Array.from(elements.messagesArea.querySelectorAll('.product-result'));
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
    productText += '\n\n—\n📡 נשלח ממערכת צ\'אט החברה';
    
    const whatsappUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(productText);
    window.open(whatsappUrl, '_blank');
    
    addMessage('<strong>📱 שיתוף בווטסאפ</strong><br>הנתונים של מק"ט ' + productCode + ' נשלחו לווטסאפ!<br><small>אם הווטסאפ לא נפתח, בדוק שיש לך את האפליקציה מותקנת.</small>');
}

// פונקציה להצגת תוצאת מוצר
function displayProductResult(item) {
    const product = item.product;
    const productCode = product['מקט'] || 'לא זמין';
    const imageUrl = generateImageUrl(productCode);
    
    let html = '<div class="product-result">';
    html += '<div class="product-compact">';
    html += '<div class="product-image-compact">';
    html += `<img src="${imageUrl}" alt="תמונת מוצר ${productCode}" onerror="handleImageError(this)" style="background:#fff" />`;
    html += '</div>';
    html += '<div class="product-info-compact">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    html += '<h3 style="margin: 0; font-size: 21px;">מקט: ' + productCode + '</h3>';
    html += '</div>';
    html += '<div class="product-table-wrapper"><table class="product-table"><tbody>';
    html += '<tr class="highlight-row"><th>פלטפורמה</th><td><strong>' + (product['פלטפורמה'] || 'לא זמין') + '</strong></td></tr>';
    html += '<tr><th>מתחם</th><td>' + (product['מתחם'] || 'לא זמין') + '</td></tr>';
    html += '<tr><th>מחיר מכירה</th><td>' + (product['מחיר מכירה'] || 'לא זמין') + '</td></tr>';
    html += '<tr><th>קמפיין</th><td>' + (product['קמפיין'] || 'לא זמין') + '</td></tr>';
    html += `<tr><th>גובה</th><td>${product['גובה']||'-'}</td></tr>`;
    html += `<tr><th>רוחב</th><td>${product['רוחב']||'-'}</td></tr>`;
    html += '<tr><th>מספר מבקרים</th><td>' + (product['מבקרים'] || '-') + '</td></tr>';
    html += '</tbody></table></div>';
    html += '<div class="action-buttons-product">';
    html += '<button class="btn-share" onclick="shareProduct(\'' + productCode + '\')">📱 שתף בווטסאפ</button>';
    html += '</div></div></div></div>';
    
    addMessage(html);
}