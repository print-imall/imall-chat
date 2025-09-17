// קובץ ראשי שמחבר את כל הרכיבים - עם פילטרים מתקדמים

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
        addMessage(`<strong>📊 המערכת מוכנה לשימוש!</strong><br>נטענו בהצלחה <strong>${productsData.length} מוצרים</strong> מהמאגר.<br><br><strong>🎉 אתה יכול עכשיו להתחיל לחפש מוצרים!</strong>`);
        
        elements.searchInput.disabled = false;
        elements.searchBtn.disabled = false;
        
        if (productsData.length > 0) {
            const sampleFields = Object.keys(productsData[0]).join(', ');
            addMessage(`<strong>🔍 שדות זמינים בקובץ:</strong><br><code style="font-size: 12px; background: rgba(0,0,0,0.1); padding: 5px; border-radius: 3px; word-break: break-all;">${sampleFields}</code>`);
        }
        
        updateGanttMallOptions();
        updateSavedSearchesDisplay();
        initializeFilters();
        
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
        
        addMessage(`<div class="error-message"><strong>❌ שגיאה בטעינת הנתונים:</strong><br>${error.message}<br><br>${errorHelp}</div>`);
    }
}

// אתחול פילטרים
function initializeFilters() {
    // מילוי רשימת מתחמים
    const mallFilter = document.getElementById('mallFilter');
    if (mallFilter && productsData.length > 0) {
        const malls = [...new Set(productsData.map(p => p['מתחם']).filter(Boolean))].sort();
        mallFilter.innerHTML = malls.map(mall => 
            `<option value="${mall}">${mall}</option>`
        ).join('');
    }
}

// פונקציות פילטרים
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function applyFilters() {
    // קריאת ערכי הפילטרים
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const mallFilter = document.getElementById('mallFilter');
    const campaignFilter = document.getElementById('campaignFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    // עדכון משתני הפילטרים הגלובליים
    if (priceMin) activeFilters.priceMin = priceMin.value ? Number(priceMin.value) : null;
    if (priceMax) activeFilters.priceMax = priceMax.value ? Number(priceMax.value) : null;
    if (mallFilter) activeFilters.selectedMalls = Array.from(mallFilter.selectedOptions).map(opt => opt.value);
    if (campaignFilter) activeFilters.campaignType = campaignFilter.value;
    if (sortFilter) activeFilters.sortBy = sortFilter.value;
    
    // הפעלת חיפוש מחדש אם יש חיפוש קודם
    const lastUserMessage = elements.messagesArea.querySelector('.message.user:last-of-type');
    if (lastUserMessage) {
        const lastQuery = lastUserMessage.textContent.trim();
        elements.searchInput.value = lastQuery;
        performSearch();
    } else {
        addMessage('<strong>🔧 פילטרים הוחלו!</strong><br>בצע חיפוש כדי לראות את התוצאות המסוננות.');
    }
    
    toggleFilters(); // סגירת פאנל הפילטרים
}

function clearFilters() {
    // איפוס משתני הפילטרים
    activeFilters = {
        priceMin: null,
        priceMax: null,
        selectedMalls: [],
        campaignType: 'all',
        sortBy: 'relevance'
    };
    
    // איפוס שדות הטופס
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const mallFilter = document.getElementById('mallFilter');
    const campaignFilter = document.getElementById('campaignFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';
    if (mallFilter) mallFilter.selectedIndex = -1;
    if (campaignFilter) campaignFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'relevance';
    
    addMessage('<strong>🧹 פילטרים נוקו!</strong><br>כל הפילטרים הוסרו. בצע חיפוש מחדש לראות תוצאות לא מסוננות.');
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
        elements.searchBtn.addEventListener('click', performSearch);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', function(e) { 
            if (e.key === 'Enter') performSearch(); 
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
                    results_count: currentSearchResults.length
                };
                
                savedSearches.unshift(searchObj);
                if (savedSearches.length > 20) savedSearches.pop();
                
                localStorage.setItem('companySearches', JSON.stringify(savedSearches));
                updateSavedSearchesDisplay();
                addMessage(`<strong>💾 החיפוש נשמר!</strong><br>החיפוש "${currentQuery}" נשמר בהצלחה.`);
            }
        });
    }

    // אירועי גאנט
    const ganttCalcBtn = document.getElementById('ganttCalcBtn');
    if (ganttCalcBtn) {
        ganttCalcBtn.addEventListener('click', calculateGanttBudget);
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
    initializeElements();
    setupEventListeners();
    
    // טעינת הנתונים עם עיכוב קצר
    setTimeout(() => {
        loadExcelData();
    }, 700);
}

// הפעלת המערכת כשהדף נטען
window.addEventListener('load', initializeSystem); && arrow) {
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
    initializeElements();
    setupEventListeners();
    
    // טעינת הנתונים עם עיכוב קצר
    setTimeout(() => {
        loadExcelData();
    }, 700);
}

// הפעלת המערכת כשהדף נטען
window.addEventListener('load', initializeSystem);
