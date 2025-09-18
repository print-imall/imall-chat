// מחשבון גנט - עם תרשימים ויצוא PDF

// משתנים לניהול תוכניות גנט - משתמשים במשתנים הגלובליים הקיימים
var savedGanttPlans = []; 
var currentGanttData = null; 

// פונקציה לוידוא שהמשתנים הגלובליים קיימים
function ensureGlobalVariables() {
    if (typeof window !== 'undefined') {
        if (!window.selectedMalls) {
            window.selectedMalls = new Set();
        }
        if (!window.allMalls) {
            window.allMalls = [];
        }
    }
}

// פונקציה לעדכון רשימת המתחמים
function updateGanttMallOptions() {
    console.log('מעדכן רשימת מתחמים לגנט...');
    
    ensureGlobalVariables(); // וידוא שהמשתנים קיימים
    
    if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
        console.log('אין נתוני מוצרים');
        return;
    }
    
    const allMallsSet = new Set();
    productsData.forEach(p => {
        const mall = p['מתחם'];
        if (mall && mall.trim()) {
            allMallsSet.add(mall.trim());
        }
    });
    
    // השתמש במשתנה הגלובלי
    const globalAllMalls = typeof window !== 'undefined' && window.allMalls ? window.allMalls : allMalls;
    globalAllMalls.length = 0;
    Array.from(allMallsSet).sort().forEach(mall => globalAllMalls.push(mall));
    
    console.log('מתחמים שנמצאו:', globalAllMalls);
    updateMallsDropdown();
}

// פונקציה לעדכון הרשימה הנפתחת
function updateMallsDropdown() {
    const dropdown = document.getElementById('mallsDropdown');
    if (!dropdown) {
        console.log('לא נמצא אלמנט mallsDropdown');
        return;
    }
    
    dropdown.innerHTML = '';
    
    // השתמש במשתנים הגלובליים
    const mallsToUse = (typeof window !== 'undefined' && window.allMalls) ? window.allMalls : (typeof allMalls !== 'undefined' ? allMalls : []);
    const selectedMallsToUse = (typeof window !== 'undefined' && window.selectedMalls) ? window.selectedMalls : (typeof selectedMalls !== 'undefined' ? selectedMalls : new Set());
    
    if (mallsToUse.length === 0) {
        dropdown.innerHTML = '<div class="multi-select-option">אין מתחמים זמינים</div>';
        return;
    }
    
    // אפשרות "בחר הכל"
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'multi-select-option';
    selectAllOption.innerHTML = `
        <input type="checkbox" id="selectAll" ${selectedMalls.size === allMalls.length ? 'checked' : ''}>
        <label for="selectAll"><strong>בחר הכל</strong></label>
    `;
    selectAllOption.addEventListener('click', function(e) {
        e.stopPropagation();
        const checkbox = this.querySelector('input');
        
        if (checkbox.checked) {
            selectedMalls.clear();
        } else {
            selectedMalls.clear();
            allMalls.forEach(mall => selectedMalls.add(mall));
        }
        updateMallsDisplay();
        updateMallsDropdown();
    });
    dropdown.appendChild(selectAllOption);
    
    // הוספת קו מפריד
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid #e9ecef';
    separator.style.margin = '5px 0';
    dropdown.appendChild(separator);
    
    // אפשרויות המתחמים
    allMalls.forEach(mall => {
        const option = document.createElement('div');
        option.className = 'multi-select-option';
        option.innerHTML = `
            <input type="checkbox" id="mall-${mall}" ${ganttSelectedMalls.has(mall) ? 'checked' : ''}>
            <label for="mall-${mall}">${mall}</label>
        `;
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const checkbox = this.querySelector('input');
            
            if (checkbox.checked) {
                selectedMalls.delete(mall);
            } else {
                selectedMalls.add(mall);
            }
            updateMallsDisplay();
            updateMallsDropdown();
        });
        dropdown.appendChild(option);
    });
}

// פונקציה לעדכון תצוגת המתחמים הנבחרים
function updateMallsDisplay() {
    const selectedMallsDiv = document.getElementById('selectedMalls');
    if (!selectedMallsDiv) {
        console.log('לא נמצא אלמנט selectedMalls');
        return;
    }
    
    if (selectedMalls.size === 0) {
        selectedMallsDiv.innerHTML = '<span style="color:#999;">בחר מתחמים...</span>';
    } else {
        selectedMallsDiv.innerHTML = '';
        Array.from(selectedMalls).forEach(mall => {
            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `
                ${mall}
                <span class="remove" onclick="removeMall('${mall}')">×</span>
            `;
            selectedMallsDiv.appendChild(item);
        });
    }
}

// פונקציה להסרת מתחם
function removeMall(mall) {
    selectedMalls.delete(mall);
    updateMallsDisplay();
    updateMallsDropdown();
}

// פונקציה לחישוב תקציב גנט
function calculateGanttBudget() {
    console.log('מתחיל חישוב גנט...');
    console.log('מתחמים נבחרים:', Array.from(selectedMalls));
    console.log('נתוני מוצרים:', productsData ? productsData.length : 'לא זמינים');
    
    const type = document.getElementById('ganttType').value;
    const budget = Number(document.getElementById('ganttBudget').value);
    
    if (selectedMalls.size === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">אנא בחר לפחות מתחם אחד</div>';
        return;
    }
    
    if (!productsData || productsData.length === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">אין נתוני מוצרים זמינים</div>';
        return;
    }
    
    let mallSums = {};
    let mallCounts = {};
    
    // חישוב סכומים לכל מתחם נבחר
    productsData.forEach((p, index) => {
        const mall = p['מתחם'];
        if (!mall) return;
        
        const mallTrimmed = mall.trim();
        if (!ganttSelectedMalls.has(mallTrimmed)) return;
        
        // סינון לפי סוג קמפיין - בדיקה מדויקת
        const campaignStr = String(p['קמפיין'] || '').trim();
        
        console.log(`מוצר ${mall}: קמפיין="${campaignStr}", בודק סוג="${type}"`);
        
        if (type === 'פרינט') {
            // כלול רק אם הערך הוא בדיוק "פרינט"
            if (campaignStr !== 'פרינט') {
                console.log('מדלג - לא פרינט מדויק');
                return;
            }
        } else if (type === 'דיגיטלי') {
            // כלול רק אם הערך הוא בדיוק "דיגטלי"
            if (campaignStr !== 'דיגטלי') {
                console.log('מדלג - לא דיגטלי מדויק');
                return;
            }
        }
        
        // חילוץ מחיר
        let priceStr = String(p['מחיר מכירה'] || '0');
        let price = Number(priceStr.replace(/[^0-9.]/g, ''));
        if (isNaN(price)) price = 0;
        
        if (!mallSums[mallTrimmed]) {
            mallSums[mallTrimmed] = 0;
            mallCounts[mallTrimmed] = 0;
        }
        mallSums[mallTrimmed] += price;
        mallCounts[mallTrimmed]++;
    });
    
    const selectedMallsList = Array.from(ganttSelectedMalls);
    
    // בדיקה שיש נתונים
    const totalSum = Object.values(mallSums).reduce((a, b) => a + b, 0);
    if (totalSum === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">לא נמצאו מוצרים עם מחירים תקפים למתחמים הנבחרים</div>';
        return;
    }
    
    // סינון לפי תקציב אם הוגדר - רק מהמתחמים שיש להם נתונים
    const mallsWithData = Object.keys(mallSums).filter(mall => mallSums[mall] > 0);
    
    let finalMalls = mallsWithData;
    if (budget && !isNaN(budget) && budget > 0) {
        let currentSum = 0;
        finalMalls = [];
        
        const sortedMalls = mallsWithData.sort((a, b) => (mallSums[a] || 0) - (mallSums[b] || 0));
        
        for (let mall of sortedMalls) {
            const mallCost = mallSums[mall] || 0;
            if (currentSum + mallCost <= budget) {
                currentSum += mallCost;
                finalMalls.push(mall);
            }
        }
    }
    
    if (finalMalls.length === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">לא נמצאו מתחמים תואמים לתקציב</div>';
        return;
    }
    
    // שמירת הנתונים הנוכחיים
    currentGanttData = {
        finalMalls,
        mallSums,
        mallCounts,
        mallProducts, // הוסף את המוצרים שנכללו בפועל
        type,
        budget,
        selectedMalls: Array.from(ganttSelectedMalls),
        generatedAt: new Date().toISOString()
    };
    
    // יצירת דוח תוצאות - העברת mallProducts לפונקציה
    generateGanttReport(finalMalls, mallSums, mallCounts, mallProducts, type, budget);
}

// פונקציה ליצירת דוח גנט
function generateGanttReport(finalMalls, mallSums, mallCounts, mallProducts, type, budget) {
    let totalCost = 0;
    let totalProducts = 0;
    
    // חישוב פלטפורמות שנכללו בפועל בגנט לכל מתחם
    let mallPlatforms = {};
    let mallProductsData = {}; // שינוי השם כדי למנוע התנגשות
    
    finalMalls.forEach(mall => {
        mallPlatforms[mall] = new Set();
        mallProductsData[mall] = [];
        
        productsData.forEach(p => {
            if (p['מתחם'] && p['מתחם'].trim() === mall) {
                const campaignStr = String(p['קמפיין'] || '').trim();
                
                // אותו תנאי סינון כמו בחישוב
                let includeProduct = true;
                if (type === 'פרינט') {
                    if (campaignStr !== 'פרינט') {
                        includeProduct = false;
                    }
                } else if (type === 'דיגיטלי') {
                    if (campaignStr !== 'דיגטלי') {
                        includeProduct = false;
                    }
                }
                
                if (includeProduct && p['פלטפורמה']) {
                    mallPlatforms[mall].add(p['פלטפורמה']);
                    mallProductsData[mall].push(p); // שמור את המוצר עבור ה-PDF
                }
            }
        });
    });
    
    let html = `
        <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="ganttReportContent">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin:0; color:#007bff;">תוצאות חישוב תקציב גנט</h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveGanttPlan()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">שמור תוכנית</button>
                    <button onclick="exportGanttToPDF(false)" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">PDF עם מחירים</button>
                </div>
            </div>
            
            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span><strong>סוג קמפיין:</strong></span>
                    <span>${type === 'all' ? 'משולב (הכל)' : type}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span><strong>מתחמים בתקציב:</strong></span>
                    <span>${finalMalls.length}</span>
                </div>
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background:#007bff; color:white;">
                        <th style="padding:12px; text-align:right;">מתחם</th>
                        <th style="padding:12px; text-align:center;">מוצרים</th>
                        <th style="padding:12px; text-align:center;">פלטפורמות</th>
                        <th style="padding:12px; text-align:center;">אחוז</th>
                        <th style="padding:12px; text-align:center;">עלות</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // מיון לפי עלות
    const sortedMalls = finalMalls.sort((a, b) => (mallSums[b] || 0) - (mallSums[a] || 0));
    
    sortedMalls.forEach((mall, index) => {
        const cost = mallSums[mall] || 0;
        const count = mallCounts[mall] || 0;
        totalCost += cost;
        totalProducts += count;
        
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const platforms = Array.from(mallPlatforms[mall] || []).join(', ') || 'לא זמין';
        
        html += `
            <tr style="background:${bgColor};">
                <td style="padding:10px; font-weight:500;">${mall}</td>
                <td style="padding:10px; text-align:center;">${count}</td>
                <td style="padding:10px; text-align:center; font-size:12px;">${platforms}</td>
                <td style="padding:10px; text-align:center;" id="percentage-${index}">-</td>
                <td style="padding:10px; text-align:center; font-weight:600; color:#007bff;">${cost.toLocaleString()}</td>
            </tr>
        `;
    });
    
    // עדכון אחוזים
    setTimeout(() => {
        sortedMalls.forEach((mall, index) => {
            const cost = mallSums[mall] || 0;
            const correctPercentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
            const percentageElement = document.getElementById(`percentage-${index}`);
            if (percentageElement) {
                percentageElement.textContent = correctPercentage + '%';
            }
        });
    }, 100);
    
    html += `
                <tr style="background:#28a745; color:white; font-weight:bold;">
                    <td style="padding:12px;">סהכ</td>
                    <td style="text-align:center; padding:12px;">${totalProducts}</td>
                    <td style="text-align:center; padding:12px;">-</td>
                    <td style="text-align:center; padding:12px;">100%</td>
                    <td style="text-align:center; padding:12px;">${totalCost.toLocaleString()}</td>
                </tr>
                </tbody>
            </table>
    `;
    
    // תקציב נותר
    if (budget && !isNaN(budget) && budget > 0) {
        const remaining = budget - totalCost;
        const usedPercentage = Math.round((totalCost / budget) * 100);
        
        html += `
            <div style="margin-top:20px; padding:15px; background:${remaining >= 0 ? '#d4edda' : '#f8d7da'}; border-radius:8px;">
                <h5 style="margin:0 0 10px 0;">סטטוס תקציב</h5>
                <div style="display:flex; justify-content:space-between;">
                    <span>תקציב: ${budget.toLocaleString()}</span>
                    <span>בשימוש: ${totalCost.toLocaleString()} (${usedPercentage}%)</span>
                    <span>${remaining >= 0 ? 'נותר' : 'חריגה'}: ${Math.abs(remaining).toLocaleString()}</span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('ganttResults').innerHTML = html;
}

// פונקציה לשמירת תוכנית
function saveGanttPlan() {
    if (!currentGanttData) {
        alert('אין תוכנית גנט לשמירה');
        return;
    }
    
    const planName = prompt('הכנס שם לתוכנית:', `תוכנית_${new Date().toLocaleDateString('he-IL')}`);
    if (!planName) return;
    
    const planToSave = {
        id: Date.now(),
        name: planName,
        data: currentGanttData,
        savedAt: new Date().toISOString()
    };
    
    savedGanttPlans.unshift(planToSave);
    if (savedGanttPlans.length > 10) savedGanttPlans.pop();
    
    alert('התוכנית נשמרה בהצלחה!');
}

// פונקציה ליצוא PDF
function exportGanttToPDF(withoutPrices = false) {
    if (!currentGanttData) {
        alert('אין נתוני גנט ליצוא');
        return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=1000');
    const { finalMalls, mallSums, mallCounts, mallProducts, type, budget } = currentGanttData;
    let totalCost = Object.values(mallSums).reduce((a, b) => a + b, 0);
    let totalProducts = Object.values(mallCounts).reduce((a, b) => a + b, 0);
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>תוכנית גנט תקציב</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                h1 { text-align: center; color: #007bff; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 6px; border: 1px solid #ddd; text-align: right; font-size: 11px; }
                th { background-color: #007bff; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .summary { background: #f8f9fa; padding: 10px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>תוכנית גנט תקציב</h1>
            <div class="summary">
                <p><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')} | <strong>סוג קמפיין:</strong> ${type === 'all' ? 'משולב' : type}</p>
                <p><strong>מספר מתחמים:</strong> ${finalMalls.length} | <strong>סה"כ מוצרים:</strong> ${totalProducts}</p>
                ${!withoutPrices ? `<p><strong>סה"כ תקציב:</strong> ${totalCost.toLocaleString()} ₪</p>` : ''}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>מתחם</th>
                        <th>פלטפורמה</th>
                        <th>גובה</th>
                        <th>רוחב</th>
                        <th>גובה2</th>
                        <th>רוחב2</th>
                        <th>מבקרים</th>
                        ${!withoutPrices ? '<th>מחיר</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `);
    
    // יצירת טבלה מפורטת של כל המוצרים
    finalMalls.forEach(mall => {
        const products = mallProducts[mall] || [];
        
        products.forEach((product, index) => {
            const height1 = product['גובה'] || '-';
            const width1 = product['רוחב'] || '-';
            const height2 = product['גובה2'] || '-';
            const width2 = product['רוחב2'] || '-';
            const visitors = product['מבקרים'] || '-';
            const platform = product['פלטפורמה'] || '-';
            const price = !withoutPrices ? (product['מחיר מכירה'] || '0') : '';
            
            printWindow.document.write(`
                <tr>
                    ${index === 0 ? `<td rowspan="${products.length}" style="vertical-align: top; font-weight: bold;">${mall}</td>` : ''}
                    <td>${platform}</td>
                    <td>${height1}</td>
                    <td>${width1}</td>
                    <td>${height2 !== '-' ? height2 : ''}</td>
                    <td>${width2 !== '-' ? width2 : ''}</td>
                    <td>${visitors}</td>
                    ${!withoutPrices ? `<td>${typeof price === 'string' ? price : price.toLocaleString()}</td>` : ''}
                </tr>
            `);
        });
    });
    
    printWindow.document.write(`
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// פונקציה לניקוי הטופס
function clearGanttForm() {
    selectedMalls.clear();
    updateMallsDisplay();
    updateMallsDropdown();
    
    const ganttType = document.getElementById('ganttType');
    const ganttBudget = document.getElementById('ganttBudget');
    const ganttResults = document.getElementById('ganttResults');
    
    if (ganttType) ganttType.value = 'all';
    if (ganttBudget) ganttBudget.value = '';
    if (ganttResults) ganttResults.innerHTML = '';
    
    currentGanttData = null;
}
