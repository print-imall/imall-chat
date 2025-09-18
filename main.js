// קובץ ראשי שמחבר את כל הרכיבים - ללא פילטרים

// הגדרת אלמנטים
let elements = {
    messagesArea: null,
    searchInput: null,
    searchBtn: null,
    statsCard: null,
    productCount: null
};

// טעינת נתוני Excel מ-GitHub
async function loadExcelData() {
    updateStatus('loading', 'מתחיל טעינה...');
    const githubUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/${CONFIG.excelFile}`;
    
    try {
        updateStatus('loading', 'מתחבר ל-GitHub...');
        const response = await fetch(githubUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        updateStatus('loading', 'מוריד קובץ...');
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) throw new Error('הקובץ שהתקבל ריק');
        
        updateStatus('loading', 'מעבד קובץ Excel...');
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        if (workbook.SheetNames.length === 0) throw new Error('הקובץ לא מכיל גליונות עבודה');
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        if (jsonData.length === 0) throw new Error('הקובץ לא מכיל נתונים');
        
        productsData = jsonData;
        elements.productCount.textContent = productsData.length;
        elements.statsCard.style.display = 'block';
        
        updateStatus('ready', `מוכן! ${productsData.length} מוצרים`);
        addSystemNotification(`<strong>📊 המערכת מוכנה לשימוש!</strong><br>נטענו בהצלחה <strong>${productsData.length} מוצרים</strong> ממאגר.<br><br><strong>🎉 אתה יכול עכשיו להתחיל לחפש מוצרים!</strong>`);
        
        elements.searchInput.disabled = false;
        elements.searchBtn.disabled = false;
        
        if (productsData.length > 0) {
            const sampleFields = Object.keys(productsData[0]).join(', ');
            addSystemNotification(`<strong>📝 שדות זמינים בקובץ:</strong><br><code style="font-size: 11px; background: rgba(0,0,0,0.1); padding: 4px; border-radius: 3px; word-break: break-all;">${sampleFields}</code>`);
        }
        
        // קריאה לפונקציות אחרות רק אם הן קיימות
        if (typeof updateGanttMallOptions === 'function') {
            updateGanttMallOptions();
        }
        if (typeof updateSavedSearchesDisplay === 'function') {
            updateSavedSearchesDisplay();
        }
        updateSavedPlansDisplay();
        
    } catch (error) {
        updateStatus('error', 'שגיאה בטעינה');
        let errorHelp = '';
        
        if (error.message.includes('404')) {
            errorHelp = `<strong>🔍 הקובץ לא נמצא:</strong><br>• בדוק שהקובץ "${CONFIG.excelFile}" קיים ברפוזיטורי<br>• בדוק שהשם נכון<br>• בדוק שהקובץ בתיקיה הראשית`;
        } else if (error.message.includes('403')) {
            errorHelp = '<strong>🔒 אין הרשאה:</strong><br>• בדוק שהרפוזיטורי ציבורי (Public)';
        } else {
            errorHelp = '<strong>🔧 שגיאה כללית:</strong><br>• נסה לרענן את הדף<br>• בדוק חיבור לאינטרנט';
        }
        
        addSystemNotification(`<div class="error-message"><strong>❌ שגיאה בטעינת הנתונים:</strong><br>${error.message}<br><br>${errorHelp}</div>`);
    }
}

// פונקציות תוכניות גנט שמורות
function toggleSavedPlans() {
    const container = document.getElementById('savedPlansContainer');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
        updateSavedPlansDisplay();
    }
}

function updateSavedPlansDisplay() {
    const container = document.getElementById('savedPlansContainer');
    const list = document.getElementById('savedPlansList');
    
    if (!container || !list) return;
    
    // בדיקה אם savedGanttPlans קיים
    const plans = typeof savedGanttPlans !== 'undefined' ? savedGanttPlans : [];
    
    if (plans.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">אין תוכניות שמורות</div>';
        return;
    }
    
    list.innerHTML = plans.map(plan => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #007bff;">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #333;">${plan.name}</div>
                <div style="font-size: 12px; color: #666;">
                    נשמר: ${new Date(plan.savedAt).toLocaleDateString('he-IL')} | 
                    ${plan.data.finalMalls ? plan.data.finalMalls.length : 0} מתחמים | 
                    ${plan.data.type === 'all' ? 'משולב' : plan.data.type}
                </div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="loadGanttPlan(${plan.id})" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">📂 טען</button>
                <button onclick="deleteGanttPlan(${plan.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ מחק</button>
            </div>
        </div>
    `).join('');
}

function loadGanttPlan(planId) {
    if (typeof savedGanttPlans === 'undefined') {
        addMessage('<strong>❌ שגיאה!</strong><br>לא ניתן לטעון תוכניות - המערכת לא מוכנה.');
        return;
    }
    
    const plan = savedGanttPlans.find(p => p.id === planId);
    if (!plan) return;
    
    const data = plan.data;
    
    // עדכון הטופס
    if (typeof selectedMalls !== 'undefined') {
        selectedMalls.clear();
        if (data.selectedMalls) {
            data.selectedMalls.forEach(mall => selectedMalls.add(mall));
        }
        
        if (typeof updateMallsDisplay === 'function') {
            updateMallsDisplay();
        }
    }
    
    const ganttType = document.getElementById('ganttType');
    const ganttBudget = document.getElementById('ganttBudget');
    
    if (ganttType) ganttType.value = data.type || 'all';
    if (ganttBudget) ganttBudget.value = data.budget || '';
    
    // חישוב מחדש
    if (typeof calculateGanttBudget === 'function') {
        calculateGanttBudget();
    }
    
    addMessage(`<strong>📂 תוכנית גנט נטענה!</strong><br>התוכנית "${plan.name}" נטענה בהצלחה.`);
    
    // סגירת פנל התוכניות השמורות
    toggleSavedPlans();
}

function deleteGanttPlan(planId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק תוכנית זו?')) return;
    
    if (typeof savedGanttPlans === 'undefined') return;
    
    // עדכון המערך הגלובלי
    const updatedPlans = savedGanttPlans.filter(p => p.id !== planId);
    if (typeof window !== 'undefined' && window.savedGanttPlans) {
        window.savedGanttPlans = updatedPlans;
    }
    
    localStorage.setItem('ganttPlans', JSON.stringify(updatedPlans));
    updateSavedPlansDisplay();
    
    addMessage('<strong>🗑️ תוכנית נמחקה!</strong><br>התוכנית נמחקה בהצלחה.');
}

// פונקציה לניקוי טופס גנט
function clearGanttForm() {
    try {
        // ניקוי מתחמים נבחרים
        if (typeof selectedMalls !== 'undefined') {
            selectedMalls.clear();
            if (typeof updateMallsDisplay === 'function') {
                updateMallsDisplay();
            }
            if (typeof updateMallsDropdown === 'function') {
                updateMallsDropdown();
            }
        }
        
        // איפוס שדות הטופס
        const ganttType = document.getElementById('ganttType');
        const ganttBudget = document.getElementById('ganttBudget');
        const ganttResults = document.getElementById('ganttResults');
        
        if (ganttType) ganttType.value = 'all';
        if (ganttBudget) ganttBudget.value = '';
        if (ganttResults) ganttResults.innerHTML = '';
        
        // איפוס נתוני גנט נוכחיים
        if (typeof window !== 'undefined') {
            window.currentGanttData = null;
        }
        
        addMessage('<strong>🧹 הטופס נוקה!</strong><br>כל הנתונים נמחקו בהצלחה.');
        
    } catch (error) {
        console.error('Error clearing gantt form:', error);
        addMessage('<strong>⚠️ שגיאה בניקוי הטופס</strong><br>אירעה שגיאה בניקוי הטופס.');
    }
}

// אתחול אלמנטים בעמוד
function initializeElements() {
    elements.messagesArea = document.getElementById('messagesArea');
    elements.searchInput = document.getElementById('searchInput');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.statsCard = document.getElementById('statsCard');
    elements.productCount = document.getElementById('productCount');
}

// הגדרת אירועי דף
function setupEventListeners() {
    // אירועי חיפוש
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', function() {
            if (typeof performSearch === 'function') {
                performSearch();
            } else {
                console.error('performSearch function not found');
            }
        });
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', function(e) { 
            if (e.key === 'Enter' && typeof performSearch === 'function') {
                performSearch();
            }
        });
    }
    
    // שמירת חיפוש
    const saveSearchBtn = document.getElementById('saveSearchBtn');
    if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', function() {
            const currentQuery = elements.messagesArea.querySelector('.message.user:last-of-type')?.textContent.trim();
            if (currentQuery) {
                const searchObj = {
                    id: Date.now(),
                    text: currentQuery,
                    date: new Date().toLocaleDateString('he-IL'),
                    results_count: typeof currentSearchResults !== 'undefined' ? currentSearchResults.length : 0
                };
                
                // בדיקה שהמשתנה הגלובלי קיים
                if (typeof savedSearches === 'undefined') {
                    window.savedSearches = [];
                }
                
                savedSearches.unshift(searchObj);
                if (savedSearches.length > 20) savedSearches.pop();
                
                localStorage.setItem('companySearches', JSON.stringify(savedSearches));
                
                if (typeof updateSavedSearchesDisplay === 'function') {
                    updateSavedSearchesDisplay();
                }
                
                addMessage(`<strong>💾 החיפוש נשמר!</strong><br>החיפוש "${currentQuery}" נשמר בהצלחה.`);
            }
        });
    }

    // אירועי גנט
    const ganttCalcBtn = document.getElementById('ganttCalcBtn');
    if (ganttCalcBtn) {
        ganttCalcBtn.addEventListener('click', function() {
            if (typeof calculateGanttBudget === 'function') {
                calculateGanttBudget();
            } else {
                addMessage('<strong>⚠️ שגיאה!</strong><br>פונקציית חישוב הגנט לא זמינה עדיין.');
            }
        });
    }
    
    const ganttClearBtn = document.getElementById('ganttClearBtn');
    if (ganttClearBtn) {
        ganttClearBtn.addEventListener('click', clearGanttForm);
    }

    // רשימה נפתחת של מתחמים
    const mallsDisplay = document.getElementById('mallsDisplay');
    if (mallsDisplay) {
        mallsDisplay.addEventListener('click', function() {
            const dropdown = document.getElementById('mallsDropdown');
            const arrow = document.querySelector('.dropdown-arrow');
            if (dropdown && arrow) {
                const isOpen = dropdown.style.display === 'block';
                
                if (isOpen) {
                    dropdown.style.display = 'none';
                    arrow.classList.remove('open');
                } else {
                    dropdown.style.display = 'block';
                    arrow.classList.add('open');
                }
            }
        });
    }

    // סגירת הרשימה הנפתחת בלחיצה מחוץ לה
    document.addEventListener('click', function(e) {
        const container = document.querySelector('.multi-select-container');
        if (container && !container.contains(e.target)) {
            const dropdown = document.getElementById('mallsDropdown');
            const arrow = document.querySelector('.dropdown-arrow');
            if (dropdown) dropdown.style.display = 'none';
            if (arrow) arrow.classList.remove('open');
        }
    });

    // טיפול בטאבים
    setupTabsEventListeners();
}

// הגדרת אירועי טאבים
function setupTabsEventListeners() {
    const tabSearch = document.getElementById('tabSearch');
    const tabGantt = document.getElementById('tabGantt');
    const tabSearchPanel = document.getElementById('tabSearchPanel');
    const tabGanttPanel = document.getElementById('tabGanttPanel');

    if (tabSearch) {
        tabSearch.onclick = function() {
            if (tabSearch) tabSearch.classList.add('active');
            if (tabGantt) tabGantt.classList.remove('active');
            if (tabSearchPanel) tabSearchPanel.style.display = 'block';
            if (tabGanttPanel) tabGanttPanel.style.display = 'none';
        }
    }

    if (tabGantt) {
        tabGantt.onclick = function() {
            if (tabGantt) tabGantt.classList.add('active');
            if (tabSearch) tabSearch.classList.remove('active');
            if (tabGanttPanel) tabGanttPanel.style.display = 'block';
            if (tabSearchPanel) tabSearchPanel.style.display = 'none';
        }
    }
}

// אתחול המערכת בעת טעינת הדף
function initializeSystem() {
    console.log('מתחיל אתחול המערכת...');
    
    try {
        initializeElements();
        console.log('אלמנטים אותחלו בהצלחה');
        
        setupEventListeners();
        console.log('מאזינים אותחלו בהצלחה');
        
        // טעינת הנתונים עם עיכוב קצר
        setTimeout(() => {
            console.log('מתחיל טעינת נתונים...');
            loadExcelData();
        }, 700);
        
    } catch (error) {
        console.error('שגיאה באתחול המערכת:', error);
        updateStatus('error', 'שגיאה באתחול');
    }
}

// הפעלת המערכת כשהדף נטען
if (document.readyState === 'loading') {
    window.addEventListener('load', initializeSystem);
} else {
    // אם הדף כבר נטען
    initializeSystem();
}
