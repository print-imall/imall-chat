<thead>
                    <tr>
                        <th>// מחשבון גנט - עם תרשימים ויצוא PDF

// משתנים לניהול תוכניות גנט
let savedGanttPlans = JSON.parse(localStorage.getItem('ganttPlans') || '[]');
let currentGanttData = null;

// פונקציה לעדכון רשימת המתחמים
function updateGanttMallOptions() {
    if (!productsData || !Array.isArray(productsData) || productsData.length === 0) return;
    
    const allMallsSet = new Set();
    productsData.forEach(p => {
        const mall = p['מתחם'];
        if (mall && mall.trim()) {
            allMallsSet.add(mall.trim());
        }
    });
    
    allMalls = Array.from(allMallsSet).sort();
    updateMallsDropdown();
}

// פונקציה לעדכון הרשימה הנפתחת
function updateMallsDropdown() {
    const dropdown = document.getElementById('mallsDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (allMalls.length === 0) {
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
            <input type="checkbox" id="mall-${mall}" ${selectedMalls.has(mall) ? 'checked' : ''}>
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
    if (!selectedMallsDiv) return;
    
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
    console.log('מתחמים נבחרים:', selectedMalls);
    console.log('נתוני מוצרים:', productsData ? productsData.length : 'לא זמינים');
    
    const type = document.getElementById('ganttType').value;
    const budget = Number(document.getElementById('ganttBudget').value);
    
    if (selectedMalls.size === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ אנא בחר לפחות מתחם אחד</div>';
        return;
    }
    
    if (!productsData || productsData.length === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ אין נתוני מוצרים זמינים</div>';
        return;
    }
    
    let mallSums = {};
    let mallCounts = {};
    
    console.log('מתחיל לעבור על נתוני מוצרים...');
    
    // חישוב סכומים לכל מתחם נבחר
    productsData.forEach((p, index) => {
        const mall = p['מתחם'];
        if (!mall) return;
        
        const mallTrimmed = mall.trim();
        if (!selectedMalls.has(mallTrimmed)) return;
        
        console.log(`מוצר ${index}: מתחם="${mallTrimmed}", פלטפורמה="${p['פלטפורמה']}", מחיר="${p['מחיר מכירה']}"`);
        
        // סינון לפי סוג קמפיין
        const platformStr = String(p['פלטפורמה'] || '').toLowerCase();
        
        if (type === 'פרינט') {
            // עבור פרינט - מחפש "פרינט" או "print" בפלטפורמה
            if (!platformStr.includes('פרינט') && !platformStr.includes('print')) {
                console.log(`מדלג על פרינט - פלטפורמה: "${p['פלטפורמה']}"`);
                return;
            }
        } else if (type === 'דיגיטלי') {
            // עבור דיגיטלי - מחפש "דיגיטלי" או "digital" בפלטפורמה
            if (!platformStr.includes('דיגיטלי') && !platformStr.includes('digital')) {
                console.log(`מדלג על דיגיטלי - פלטפורמה: "${p['פלטפורמה']}"`);
                return;
            }
        }
        // אם type === 'all' - לא מסנן כלום
        
        // חילוץ מחיר
        let priceStr = String(p['מחיר מכירה'] || '0');
        let price = Number(priceStr.replace(/[^0-9.]/g, ''));
        if (isNaN(price)) price = 0;
        
        console.log(`מחיר אחרי עיבוד: ${price}`);
        
        if (!mallSums[mallTrimmed]) {
            mallSums[mallTrimmed] = 0;
            mallCounts[mallTrimmed] = 0;
        }
        mallSums[mallTrimmed] += price;
        mallCounts[mallTrimmed]++;
    });
    
    console.log('תוצאות חישוב:', mallSums);
    console.log('מספרי מוצרים:', mallCounts);
    
    const selectedMallsList = Array.from(selectedMalls);
    
    // בדיקה שיש נתונים
    const totalSum = Object.values(mallSums).reduce((a, b) => a + b, 0);
    if (totalSum === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ לא נמצאו מוצרים עם מחירים תקפים למתחמים הנבחרים</div>';
        return;
    }
    
    // סינון לפי תקציב אם הוגדר
    let finalMalls = selectedMallsList;
    if (budget && !isNaN(budget) && budget > 0) {
        let currentSum = 0;
        finalMalls = [];
        
        // מיון לפי עלות (מהנמוך לגבוה)
        const sortedMalls = selectedMallsList.sort((a, b) => (mallSums[a] || 0) - (mallSums[b] || 0));
        
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
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ לא נמצאו מתחמים תואמים לתקציב</div>';
        return;
    }
    
    // שמירת הנתונים הנוכחיים
    currentGanttData = {
        finalMalls,
        mallSums,
        mallCounts,
        type,
        budget,
        selectedMalls: Array.from(selectedMalls),
        generatedAt: new Date().toISOString()
    };
    
    console.log('נתוני גנט סופיים:', currentGanttData);
    
    // יצירת דוח תוצאות
    generateGanttReport(finalMalls, mallSums, mallCounts, type, budget);
}

// פונקציה ליצירת דוח גנט משופר
function generateGanttReport(finalMalls, mallSums, mallCounts, type, budget) {
    let totalCost = 0;
    let totalProducts = 0;
    const maxCost = Math.max(...finalMalls.map(mall => mallSums[mall] || 0));
    
    // חישוב פלטפורמות לכל מתחם
    let mallPlatforms = {};
    finalMalls.forEach(mall => {
        mallPlatforms[mall] = new Set();
        productsData.forEach(p => {
            if (p['מתחם'] && p['מתחם'].trim() === mall && p['פלטפורמה']) {
                mallPlatforms[mall].add(p['פלטפורמה']);
            }
        });
    });
    
    let html = `
        <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="ganttReportContent">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin:0; color:#007bff;">📊 תוצאות חישוב תקציב גנט</h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editGanttResults()" style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">✏️ ערוך תוצאות</button>
                    <button onclick="saveGanttPlan()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">💾 שמור תוכנית</button>
                    <button onclick="exportGanttToPDF(false)" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">📄 PDF עם מחירים</button>
                    <button onclick="exportGanttToPDF(true)" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">📄 PDF ללא מחירים</button>
                </div>
            </div>
            
            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span><strong>סוג קמפיין:</strong></span>
                    <span>${type === 'all' ? 'משולב (הכל)' : type}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span><strong>מתחמים נבחרים:</strong></span>
                    <span>${selectedMalls.size}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span><strong>מתחמים בתקציב:</strong></span>
                    <span>${finalMalls.length}</span>
                </div>
            </div>
            
            <!-- תרשים עוגה -->
            <div style="margin-bottom: 30px;">
                <h5 style="color:#333; text-align:center; margin-bottom:15px;">📈 חלוקת תקציב לפי מתחמים</h5>
                <canvas id="ganttPieChart" style="max-height:300px; margin: 0 auto; display: block;"></canvas>
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;" id="ganttTable">
                <thead>
                    <tr style="background:#007bff; color:white;">
                        <th style="padding:12px; text-align:right; border-radius:8px 0 0 0;">מתחם</th>
                        <th style="padding:12px; text-align:center;">מוצרים</th>
                        <th style="padding:12px; text-align:center;">פלטפורמות</th>
                        <th style="padding:12px; text-align:center;">אחוז מהתקציב</th>
                        <th style="padding:12px; text-align:center;">עלות (₪)</th>
                        <th style="padding:12px; text-align:center; border-radius:0 8px 0 0;">פעולות</th>
                    </tr>
                </thead>
                <tbody id="ganttTableBody">
    `;
    
    // מיון לפי עלות (מהגבוה לנמוך) לתצוגה
    const sortedMalls = finalMalls.sort((a, b) => (mallSums[b] || 0) - (mallSums[a] || 0));
    
    sortedMalls.forEach((mall, index) => {
        const cost = mallSums[mall] || 0;
        const count = mallCounts[mall] || 0;
        totalCost += cost;
        totalProducts += count;
        
        const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const platforms = Array.from(mallPlatforms[mall] || []).join(', ') || 'לא זמין';
        
        html += `
            <tr style="background:${bgColor};" data-mall="${mall}" id="mall-row-${index}">
                <td style="padding:10px; font-weight:500;">${mall}</td>
                <td style="padding:10px; text-align:center;">${count}</td>
                <td style="padding:10px; text-align:center; font-size:12px; max-width:150px; word-wrap:break-word;">${platforms}</td>
                <td style="padding:10px; text-align:center;" id="percentage-${index}">${percentage}%</td>
                <td style="padding:10px; text-align:center; font-weight:600; color:#007bff;">${cost.toLocaleString()}</td>
                <td style="padding:10px; text-align:center;">
                    <button onclick="editMallPlatforms('${mall}', ${index})" style="background: #17a2b8; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 2px;">✏️ ערוך</button>
                    <button onclick="removeMallFromGantt('${mall}')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ הסר</button>
                </td>
            </tr>
        `;
    });
    
    // עדכון אחוזים נכונים לאחר חישוב הסכום הכולל
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
                </tbody>
                <tfoot>
                    <tr style="background:#28a745; color:white; font-weight:bold;">
                        <td style="padding:12px;">סה"כ</td>
                        <td style="text-align:center; padding:12px;">${totalProducts}</td>
                        <td style="text-align:center; padding:12px;">-</td>
                        <td style="text-align:center; padding:12px;">100%</td>
                        <td style="text-align:center; padding:12px;">${totalCost.toLocaleString()}</td>
                        <td style="padding:12px;"></td>
                    </tr>
                </tfoot>
            </table>
    `;
    
    // הוספת ברף גנט חזותי
    html += '<div style="margin-top:20px;"><h5 style="color:#333; margin-bottom:15px;">📊 תצוגת גנט חזותית:</h5>';
    
    sortedMalls.forEach(mall => {
        const cost = mallSums[mall] || 0;
        const percentage = maxCost > 0 ? Math.max(8, Math.round((cost / maxCost) * 100)) : 8;
        
        html += `
            <div class="gantt-bar" data-mall="${mall}">
                <div class="gantt-bar-inner" style="width:${percentage}%; font-size:13px;">
                    ${cost > 0 ? cost.toLocaleString() + ' ₪' : '-'}
                </div>
                <span class="gantt-bar-label">${mall}</span>
            </div>
        `;
    });
    
    html += '</div>';
    
    // תקציב נותר אם הוגדר
    if (budget && !isNaN(budget) && budget > 0) {
        const remaining = budget - totalCost;
        const usedPercentage = Math.round((totalCost / budget) * 100);
        
        html += `
            <div style="margin-top:20px; padding:15px; background:${remaining >= 0 ? '#d4edda' : '#f8d7da'}; border-radius:8px;">
                <h5 style="margin:0 0 10px 0; color:${remaining >= 0 ? '#155724' : '#721c24'};">💰 סטטוס תקציב</h5>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>תקציב מקסימלי:</span>
                    <span><strong>${budget.toLocaleString()} ₪</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>בשימוש:</span>
                    <span><strong>${totalCost.toLocaleString()} ₪ (${usedPercentage}%)</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>${remaining >= 0 ? 'נותר:' : 'חריגה:'}</span>
                    <span style="font-weight:bold; color:${remaining >= 0 ? '#155724' : '#721c24'};">
                        ${Math.abs(remaining).toLocaleString()} ₪
                    </span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('ganttResults').innerHTML = html;
    
    // יצירת תרשים עוגה
    setTimeout(() => createGanttPieChart(sortedMalls, mallSums), 100);
}

// פונקציה ליצירת תרשים עוגה
function createGanttPieChart(malls, mallSums) {
    const ctx = document.getElementById('ganttPieChart');
    if (!ctx) return;
    
    const data = malls.map(mall => mallSums[mall] || 0);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: malls,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, malls.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} ₪ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// פונקציה להסרת מתחם מהגנט
function removeMallFromGantt(mallToRemove) {
    if (!currentGanttData) return;
    
    // הסרת המתחם מהנתונים
    selectedMalls.delete(mallToRemove);
    updateMallsDisplay();
    
    // חישוב מחדש
    calculateGanttBudget();
}

// פונקציה לשמירת תוכנית גנט
function saveGanttPlan() {
    if (!currentGanttData) {
        alert('אין תוכנית גנט לשמירה');
        return;
    }
    
    const planName = prompt('הכנס שם לתוכנית הגנט:', `תוכנית_${new Date().toLocaleDateString('he-IL')}`);
    if (!planName) return;
    
    const planToSave = {
        id: Date.now(),
        name: planName,
        data: currentGanttData,
        savedAt: new Date().toISOString()
    };
    
    savedGanttPlans.unshift(planToSave);
    if (savedGanttPlans.length > 10) savedGanttPlans.pop(); // שמירה של 10 תוכניות אחרונות
    
    localStorage.setItem('ganttPlans', JSON.stringify(savedGanttPlans));
    
    if (typeof addMessage === 'function') {
        addMessage(`<strong>💾 תוכנית הגנט נשמרה!</strong><br>התוכנית "${planName}" נשמרה בהצלחה.`);
    }
}

// פונקציה ליצוא גנט ל-PDF
function exportGanttToPDF(withoutPrices = false) {
    if (!currentGanttData) {
        alert('אין נתוני גנט ליצוא');
        return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=1000');
    const { finalMalls, mallSums, mallCounts, type, budget } = currentGanttData;
    let totalCost = Object.values(mallSums).reduce((a, b) => a + b, 0);
    let totalProducts = Object.values(mallCounts).reduce((a, b) => a + b, 0);
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>תוכנית גנט תקציב - צ'טמול</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
                .header h1 { color: #007bff; margin-bottom: 5px; }
                .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 12px; border: 1px solid #ddd; text-align: right; }
                th { background-color: #007bff; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .total-row { background-color: #28a745 !important; color: white; font-weight: bold; }
                .gantt-bar { display: flex; align-items: center; margin-bottom: 8px; }
                .gantt-bar-visual { height: 20px; background: linear-gradient(90deg, #28a745, #20c997); border-radius: 4px; margin-left: 10px; }
                .gantt-bar-label { min-width: 150px; font-weight: 500; }
                @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>צ'טמול - תוכנית גנט תקציב</h1>
                <p>תאריך: ${new Date().toLocaleDateString('he-IL')} | ${withoutPrices ? 'ללא מחירים' : 'עם מחירים'}</p>
            </div>
            
            <div class="summary">
                <h3>סיכום התוכנית</h3>
                <div class="summary-item"><span>סוג קמפיין:</span><span>${type === 'all' ? 'משולב (הכל)' : type}</span></div>
                <div class="summary-item"><span>מספר מתחמים:</span><span>${finalMalls.length}</span></div>
                <div class="summary-item"><span>סה"כ מוצרים:</span><span>${totalProducts}</span></div>
                ${!withoutPrices ? `<div class="summary-item"><span>סה"כ תקציב:</span><span>${totalCost.toLocaleString()} ₪</span></div>` : ''}
                ${budget && !withoutPrices ? `<div class="summary-item"><span>תקציב מקסימלי:</span><span>${budget.toLocaleString()} ₪</span></div>` : ''}
            </div>
            
            <h3>פירוט לפי מתחמים</h3>
            <table>
                <thead>
                    <tr>
                        <th>מתחם</th>
                        <th>מספר מוצרים</th>
                        <th>פלטפורמות</th>
                        <th>מידות (רוחב×גובה)</th>
                        ${!withoutPrices ? '<th>אחוז מהתקציב</th><th>עלות (₪)</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `);
    
    finalMalls.forEach((mall, index) => {
        const cost = mallSums[mall] || 0;
        const count = mallCounts[mall] || 0;
        const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
        
        // מציאת פלטפורמות למתחם
        const platformsSet = new Set();
        productsData.forEach(p => {
            if (p['מתחם'] && p['מתחם'].trim() === mall && p['פלטפורמה']) {
                platformsSet.add(p['פלטפורמה']);
            }
        });
        const platformsText = Array.from(platformsSet).join(', ') || 'לא זמין';
        
        // מציאת מוצר לדוגמה מהמתחם הזה למידות
        const sampleProduct = productsData.find(p => p['מתחם'] && p['מתחם'].trim() === mall);
        let dimensionsText = '-';
        if (sampleProduct) {
            const height1 = sampleProduct['גובה'] || '';
            const width1 = sampleProduct['רוחב'] || '';
            const height2 = sampleProduct['גובה2'] || '';
            const width2 = sampleProduct['רוחב2'] || '';
            
            let dims = [];
            if (height1 && width1) {
                dims.push(`${width1}×${height1}`);
            }
            if (height2 && width2) {
                dims.push(`${width2}×${height2}`);
            }
            dimensionsText = dims.length > 0 ? dims.join(', ') : '-';
        }
        
        printWindow.document.write(`
            <tr>
                <td>${mall}</td>
                <td>${count}</td>
                <td style="font-size: 10px; max-width: 150px; word-wrap: break-word;">${platformsText}</td>
                <td>${dimensionsText}</td>
                ${!withoutPrices ? `<td>${percentage}%</td><td>${cost.toLocaleString()}</td>` : ''}
            </tr>
        `);
    });
    
    printWindow.document.write(`
                    <tr class="total-row">
                        <td>סה"כ</td>
                        <td>${totalProducts}</td>
                        <td>-</td>
                        <td>-</td>
                        ${!withoutPrices ? `<td>100%</td><td>${totalCost.toLocaleString()}</td>` : ''}
                    </tr>
                </tbody>
            </table>
            
            <h3>תצוגה חזותית</h3>
            <div class="gantt-visual">
    `);
    
    const maxCost = Math.max(...finalMalls.map(mall => mallSums[mall] || 0));
    finalMalls.forEach(mall => {
        const cost = mallSums[mall] || 0;
        const percentage = maxCost > 0 ? Math.max(5, Math.round((cost / maxCost) * 100)) : 5;
        
        printWindow.document.write(`
            <div class="gantt-bar">
                <div class="gantt-bar-label">${mall}</div>
                <div class="gantt-bar-visual" style="width: ${percentage}%;"></div>
                ${!withoutPrices ? `<span style="margin-right: 10px;">${cost.toLocaleString()} ₪</span>` : ''}
            </div>
        `);
    });
    
    printWindow.document.write(`
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    if (typeof addMessage === 'function') {
        addMessage(`<strong>📄 יצוא PDF הושלם!</strong><br>תוכנית הגנט ${withoutPrices ? 'ללא מחירים' : 'עם מחירים'} נשלחה להדפסה/שמירה כ-PDF.`);
    }
}

// פונקציה לעריכת פלטפורמות של מתחם
function editMallPlatforms(mall, rowIndex) {
    // מציאת כל הפלטפורמות הקיימות במתחם
    const mallPlatformsSet = new Set();
    productsData.forEach(p => {
        if (p['מתחם'] && p['מתחם'].trim() === mall && p['פלטפורמה']) {
            mallPlatformsSet.add(p['פלטפורמה']);
        }
    });
    
    const platformsList = Array.from(mallPlatformsSet);
    
    if (platformsList.length === 0) {
        alert('לא נמצאו פלטפורמות עבור מתחם זה');
        return;
    }
    
    // יצירת חלון עריכה
    const editHtml = `
        <div id="editPlatformsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 70%; overflow-y: auto;">
                <h3 style="margin-top: 0; color: #007bff;">✏️ עריכת פלטפורמות - ${mall}</h3>
                <p style="color: #666;">בחר את הפלטפורמות שברצונך לכלול בחישוב:</p>
                
                <div id="platformsCheckboxes" style="margin: 20px 0;">
                    ${platformsList.map(platform => `
                        <label style="display: block; margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 6px; cursor: pointer;">
                            <input type="checkbox" checked value="${platform}" style="margin-left: 8px;">
                            <span style="font-weight: 500;">${platform}</span>
                        </label>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="applyPlatformChanges('${mall}', ${rowIndex})" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-left: 10px;">✅ החל שינויים</button>
                    <button onclick="closeEditModal()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">❌ ביטול</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', editHtml);
}

// פונקציה להחלת שינויי הפלטפורמות
function applyPlatformChanges(mall, rowIndex) {
    const checkboxes = document.querySelectorAll('#platformsCheckboxes input[type="checkbox"]');
    const selectedPlatforms = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    if (selectedPlatforms.length === 0) {
        alert('יש לבחור לפחות פלטפורמה אחת');
        return;
    }
    
    // חישוב מחדש עם הפלטפורמות הנבחרות
    let newMallSum = 0;
    let newMallCount = 0;
    
    const type = document.getElementById('ganttType').value;
    
    productsData.forEach(p => {
        if (p['מתחם'] && p['מתחם'].trim() === mall && 
            p['פלטפורמה'] && selectedPlatforms.includes(p['פלטפורמה'])) {
            
            // סינון לפי סוג קמפיין
            const platformStr = String(p['פלטפורמה'] || '').toLowerCase();
            if (type === 'פרינט') {
                if (!platformStr.includes('פרינט') && !platformStr.includes('print')) return;
            } else if (type === 'דיגיטלי') {
                if (!platformStr.includes('דיגיטלי') && !platformStr.includes('digital')) return;
            }
            
            let price = Number(String(p['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
            if (isNaN(price)) price = 0;
            
            newMallSum += price;
            newMallCount++;
        }
    });
    
    // עדכון הנתונים
    if (currentGanttData) {
        currentGanttData.mallSums[mall] = newMallSum;
        currentGanttData.mallCounts[mall] = newMallCount;
    }
    
    // עדכון התצוגה
    const row = document.getElementById(`mall-row-${rowIndex}`);
    if (row) {
        const cells = row.querySelectorAll('td');
        cells[1].textContent = newMallCount; // מוצרים
        cells[2].textContent = selectedPlatforms.join(', '); // פלטפורמות
        cells[4].textContent = newMallSum.toLocaleString(); // עלות
    }
    
    // עדכון אחוזים
    recalculatePercentages();
    
    closeEditModal();
    
    addSystemNotification(`<strong>✏️ פלטפורמות עודכנו</strong><br>מתחם "${mall}" עודכן עם ${selectedPlatforms.length} פלטפורמות נבחרות.`);
}

// פונקציה לחישוב אחוזים מחדש
function recalculatePercentages() {
    if (!currentGanttData) return;
    
    const totalCost = Object.values(currentGanttData.mallSums).reduce((a, b) => a + b, 0);
    
    Object.keys(currentGanttData.mallSums).forEach((mall, index) => {
        const cost = currentGanttData.mallSums[mall] || 0;
        const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
        const percentageElement = document.getElementById(`percentage-${index}`);
        if (percentageElement) {
            percentageElement.textContent = percentage + '%';
        }
    });
}

// פונקציה לסגירת חלון העריכה
function closeEditModal() {
    const modal = document.getElementById('editPlatformsModal');
    if (modal) {
        modal.remove();
    }
}

// פונקציה כללית לעריכת תוצאות הגנט
function editGanttResults() {
    addSystemNotification(`<strong>✏️ מצב עריכה</strong><br>השתמש בכפתורים "ערוך" ו"הסר" בטבלה לעריכת התוצאות.`);
}
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
    
    if (ganttResults) {
        ganttResults.innerHTML = '<div style="text-align:center; padding:20px; color:#28a745; font-weight:600;">✅ הטופס נוקה בהצלחה!</div>';
        setTimeout(() => {
            ganttResults.innerHTML = '';
        }, 2000);
    }
}
