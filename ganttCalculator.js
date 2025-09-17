// מחשבון גאנט - עם תרשימים וייצוא PDF

// משתנים לניהול תוכניות גאנט
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

// פונקציה לחישוב תקציב גאנט
function calculateGanttBudget() {
    const type = document.getElementById('ganttType').value;
    const budget = Number(document.getElementById('ganttBudget').value);
    
    if (selectedMalls.size === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ אנא בחר לפחות מתחם אחד</div>';
        return;
    }
    
    let mallSums = {};
    let mallCounts = {};
    
    // חישוב סכומים לכל מתחם נבחר
    productsData.forEach(p => {
        const mall = p['מתחם'];
        if (!mall || !selectedMalls.has(mall.trim())) return;
        
        // סינון לפי סוג קמפיין
        if (type === 'פרינט' && (!p['פלטפורמה'] || !p['פלטפורמה'].includes('פרינט'))) return;
        if (type === 'דיגיטלי' && (!p['פלטפורמה'] || !p['פלטפורמה'].includes('דיגיטלי'))) return;
        
        let price = Number(String(p['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
        if (isNaN(price)) price = 0;
        
        const mallKey = mall.trim();
        if (!mallSums[mallKey]) {
            mallSums[mallKey] = 0;
            mallCounts[mallKey] = 0;
        }
        mallSums[mallKey] += price;
        mallCounts[mallKey]++;
    });
    
    const selectedMallsList = Array.from(selectedMalls);
    
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
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ לא נמצאו מתחמים תואמים לתקציב או לסוג הקמפיין</div>';
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
    
    // יצירת דוח תוצאות
    generateGanttReport(finalMalls, mallSums, mallCounts, type, budget);
}

// פונקציה ליצירת דוח גאנט משופר
function generateGanttReport(finalMalls, mallSums, mallCounts, type, budget) {
    let totalCost = 0;
    let totalProducts = 0;
    const maxCost = Math.max(...finalMalls.map(mall => mallSums[mall] || 0));
    
    let html = `
        <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="ganttReportContent">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin:0; color:#007bff;">📊 תוצאות חישוב תקציב גאנט</h4>
                <div style="display: flex; gap: 10px;">
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
                        <th style="padding:12px; text-align:center;">אחוז מהתקציב</th>
                        <th style="padding:12px; text-align:center; border-radius:0 8px 0 0;">עלות (₪)</th>
                        <th style="padding:12px; text-align:center;">פעולות</th>
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
        
        html += `
            <tr style="background:${bgColor};" data-mall="${mall}">
                <td style="padding:10px; font-weight:500;">${mall}</td>
                <td style="padding:10px; text-align:center;">${count}</td>
                <td style="padding:10px; text-align:center;">${percentage}%</td>
                <td style="padding:10px; text-align:center; font-weight:600; color:#007bff;">${cost.toLocaleString()}</td>
                <td style="padding:10px; text-align:center;">
                    <button onclick="removeMallFromGantt('${mall}')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ הסר</button>
                </td>
            </tr>
        `;
    });
    
    // חישוב אחוזים מחדש
    html = html.replace(/(\d+\.?\d*)%/g, (match, percentage) => {
        const cost = parseFloat(match.split('td')[0]);
        const newPercentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
        return newPercentage + '%';
    });
    
    html += `
                </tbody>
                <tfoot>
                    <tr style="background:#28a745; color:white; font-weight:bold;">
                        <td style="padding:12px;">סה"כ</td>
                        <td style="text-align:center; padding:12px;">${totalProducts}</td>
                        <td style="text-align:center; padding:12px;">100%</td>
                        <td style="text-align:center; padding:12px;">${totalCost.toLocaleString()}</td>
                        <td style="padding:12px;"></td>
                    </tr>
                </tfoot>
            </table>
    `;
    
    // הוספת גרף גאנט חזותי
    html += '<div style="margin-top:20px;"><h5 style="color:#333; margin-bottom:15px;">📊 תצוגת גאנט חזותית:</h5>';
    
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

// פונקציה להסרת מתחם מהגאנט
function removeMallFromGantt(mallToRemove) {
    if (!currentGanttData) return;
    
    // הסרת המתחם מהנתונים
    selectedMalls.delete(mallToRemove);
    updateMallsDisplay();
    
    // חישוב מחדש
    calculateGanttBudget();
}

// פונקציה לשמירת תוכנית גאנט
function saveGanttPlan() {
    if (!currentGanttData) {
        alert('אין תוכנית גאנט לשמירה');
        return;
    }
    
    const planName = prompt('הכנס שם לתוכנית הגאנט:', `תוכנית_${new Date().toLocaleDateString('he-IL')}`);
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
    
    addMessage(`<strong>💾 תוכנית הגאנט נשמרה!</strong><br>התוכנית "${planName}" נשמרה בהצלחה.`);
}

// פונקציה לייצוא גאנט ל-PDF
function exportGanttToPDF(withoutPrices = false) {
    if (!currentGanttData) {
        alert('אין נתוני גאנט לייצוא');
        return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=1000');
    const { finalMalls, mallSums, mallCounts, type, budget } = currentGanttData;
    let totalCost = Object.values(mallSums).reduce((a, b) => a + b, 0);
    let totalProducts = Object.values(mallCounts).reduce((a, b) => a + b, 0);
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>תוכנית גאנט תקציב - איימולון</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
                .header h1 { color: #007bff; margin-bottom: 5px; }
                .summary { background: #f8f9fa// מחשבון גאנט תקציב

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

// פונקציה לחישוב תקציב גאנט
function calculateGanttBudget() {
    const type = document.getElementById('ganttType').value;
    const budget = Number(document.getElementById('ganttBudget').value);
    
    if (selectedMalls.size === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ אנא בחר לפחות מתחם אחד</div>';
        return;
    }
    
    let mallSums = {};
    let mallCounts = {};
    
    // חישוב סכומים לכל מתחם נבחר
    productsData.forEach(p => {
        const mall = p['מתחם'];
        if (!mall || !selectedMalls.has(mall.trim())) return;
        
        // סינון לפי סוג קמפיין
        if (type === 'פרינט' && (!p['פלטפורמה'] || !p['פלטפורמה'].includes('פרינט'))) return;
        if (type === 'דיגיטלי' && (!p['פלטפורמה'] || !p['פלטפורמה'].includes('דיגיטלי'))) return;
        
        let price = Number(String(p['מחיר מכירה'] || '0').replace(/[^0-9.]/g, ''));
        if (isNaN(price)) price = 0;
        
        const mallKey = mall.trim();
        if (!mallSums[mallKey]) {
            mallSums[mallKey] = 0;
            mallCounts[mallKey] = 0;
        }
        mallSums[mallKey] += price;
        mallCounts[mallKey]++;
    });
    
    const selectedMallsList = Array.from(selectedMalls);
    
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
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">⚠️ לא נמצאו מתחמים תואמים לתקציב או לסוג הקמפיין</div>';
        return;
    }
    
    // יצירת דוח תוצאות
    generateGanttReport(finalMalls, mallSums, mallCounts, type, budget);
}

// פונקציה ליצירת דוח גאנט
function generateGanttReport(finalMalls, mallSums, mallCounts, type, budget) {
    let totalCost = 0;
    let totalProducts = 0;
    const maxCost = Math.max(...finalMalls.map(mall => mallSums[mall] || 0));
    
    let html = `
        <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h4 style="text-align:center; color:#007bff; margin-top:0;">📊 תוצאות חישוב תקציב</h4>
            
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
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background:#007bff; color:white;">
                        <th style="padding:12px; text-align:right; border-radius:8px 0 0 0;">מתחם</th>
                        <th style="padding:12px; text-align:center;">מוצרים</th>
                        <th style="padding:12px; text-align:center; border-radius:0 8px 0 0;">עלות (₪)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    finalMalls.forEach((mall, index) => {
        const cost = mallSums[mall] || 0;
        const count = mallCounts[mall] || 0;
        totalCost += cost;
        totalProducts += count;
        
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        html += `
            <tr style="background:${bgColor};">
                <td style="padding:10px; font-weight:500;">${mall}</td>
                <td style="padding:10px; text-align:center;">${count}</td>
                <td style="padding:10px; text-align:center; font-weight:600; color:#007bff;">${cost.toLocaleString()}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
                <tfoot>
                    <tr style="background:#28a745; color:white; font-weight:bold;">
                        <td style="padding:12px;">סה"כ</td>
                        <td style="text-align:center; padding:12px;">${totalProducts}</td>
                        <td style="text-align:center; padding:12px;">${totalCost.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
    `;
    
    // הוספת גרף גאנט חזותי
    html += '<div style="margin-top:20px;"><h5 style="color:#333; margin-bottom:15px;">📈 תצוגת גאנט חזותית:</h5>';
    
    finalMalls.forEach(mall => {
        const cost = mallSums[mall] || 0;
        const percentage = maxCost > 0 ? Math.max(8, Math.round((cost / maxCost) * 100)) : 8;
        
        html += `
            <div class="gantt-bar">
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
}

// פונקציה לניקוי טופס גאנט
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
    
    if (ganttResults) {
        ganttResults.innerHTML = '<div style="text-align:center; padding:20px; color:#28a745; font-weight:600;">✅ הטופס נוקה בהצלחה!</div>';
        setTimeout(() => {
            ganttResults.innerHTML = '';
        }, 2000);
    }
}
