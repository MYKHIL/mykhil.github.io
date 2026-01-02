// Visitor Counter using JSONbin.io
// This script tracks the number of visits to all pages

(function() {
    // JSONbin.io configuration
    const BIN_ID = '67d621238a456b79667697a5'; // Same bin as download tracker
    const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
    const MASTER_KEY = '$2a$10$Zwr/q5r0c.Lv/6Ikq9a.ROrJruWGsHzf8uSI/HWq7yjG.4OrsE2O6';

    // Debug mode
    const DEBUG = true;

    // Local storage keys
    const LS_TOTAL_VISITS = 'total_visits';
    const LS_PAGE_VISITS = 'page_visits';
    const LS_LAST_UPDATE = 'visits_last_update';

    // Cache duration in milliseconds (5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000;

    // Debug logger
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[Visitor Counter]', ...args);
        }
    }

    // Get current page name
    function getCurrentPage() {
        const path = window.location.pathname;
        const pathParts = path.split('/');
        let pageName = pathParts.pop(); // Get the last part of the path
        
        debugLog(`Current path: ${path}, Page name: ${pageName}`);
        
        // If we're in the articles directory
        if (pathParts.length > 0 && pathParts[pathParts.length - 1] === 'articles') {
            // Check if it's one of the article pages
            if (pageName.startsWith('ghana-') && pageName.endsWith('.html')) {
                // For article pages, we want to track the specific article
                return pageName.replace('.html', '');
            }
        }
        
        // If it's the root/index page or empty
        if (!pageName || pageName === '' || pageName === 'index.html') {
            return 'home';
        }
        
        // Explicit check for projects.html
        if (pageName === 'projects.html') {
            debugLog('Projects page detected');
            return 'projects';
        }
        
        // Remove .html extension
        return pageName.replace('.html', '');
    }

    // Function to format number with commas for thousands
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Function to track a page visit
    async function trackVisit() {
        const currentPage = getCurrentPage();
        debugLog(`Tracking page visit on: ${currentPage}`);
        
        // Add explicit debug for projects page
        if (currentPage === 'projects') {
            console.log('VISITOR TRACKER DEBUG: On projects page');
            console.log('VISITOR TRACKER DEBUG: pathname =', window.location.pathname);
            console.log('VISITOR TRACKER DEBUG: page elements =', {
                headerCounter: document.getElementById('header-visitor-count'),
                pageCounter: document.getElementById('page-visitor-count'),
                footerCounter: document.getElementById('visitor-count')
            });
        }
        
        try {
            // Fetch current data from JSONbin
            const response = await fetch(`${JSONBIN_API_URL}/latest?${Date.now()}`, {
                headers: {
                    'X-Master-Key': MASTER_KEY
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
            
            const data = await response.json();
            debugLog('Current data:', data.record);
            
            // Get current counts and increment visits
            let counts = data.record || {};
            
            // Initialize visits counter if it doesn't exist
            if (!counts.visits) {
                counts.visits = 5000; // Start with 5000 visits as requested
            } else {
                counts.visits += 1;
            }
            
            // Track page-specific visits
            if (!counts.pageVisits) {
                counts.pageVisits = {};
            }
            
            // Special handling for projects page
            if (currentPage === 'projects') {
                debugLog('Special handling for projects page');
                console.log('VISITOR TRACKER DEBUG: Projects page, before update:', counts.pageVisits.projects);
                if (counts.pageVisits.projects === undefined || counts.pageVisits.projects === null) {
                    counts.pageVisits.projects = 0;
                }
                counts.pageVisits.projects += 1;
                console.log('VISITOR TRACKER DEBUG: Projects page, after update:', counts.pageVisits.projects);
            } else {
                // Normal handling for other pages
                if (!counts.pageVisits[currentPage]) {
                    counts.pageVisits[currentPage] = 0;
                }
                counts.pageVisits[currentPage] += 1;
            }
            
            debugLog(`New total visit count: ${counts.visits}`);
            debugLog(`New ${currentPage} visit count: ${counts.pageVisits[currentPage]}`);
            
            // Update JSONbin
            const updateResponse = await fetch(JSONBIN_API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY,
                    'X-Bin-Meta': false
                },
                body: JSON.stringify(counts)
            });
            
            if (!updateResponse.ok) {
                throw new Error(`Failed to update. Status: ${updateResponse.status}`);
            }
            
            // Save to local storage for consistent display across pages
            localStorage.setItem(LS_TOTAL_VISITS, counts.visits);
            localStorage.setItem(LS_LAST_UPDATE, Date.now());
            
            // Save page visits
            const pageVisits = JSON.stringify(counts.pageVisits);
            localStorage.setItem(LS_PAGE_VISITS, pageVisits);
            
            // Update the visitor counter displays
            updateVisitorDisplay(counts.visits, counts.pageVisits[currentPage]);
            
            debugLog('Visit tracked successfully');
        } catch (error) {
            console.error('Error tracking visit:', error);
            // Use cached values if available
            useCachedCounters();
        }
    }

    // Function to get cached values from local storage
    function useCachedCounters() {
        const currentPage = getCurrentPage();
        const totalVisits = localStorage.getItem(LS_TOTAL_VISITS) || 5000;
        
        let pageVisits = {};
        try {
            pageVisits = JSON.parse(localStorage.getItem(LS_PAGE_VISITS) || '{}');
        } catch (e) {
            debugLog('Error parsing page visits from local storage');
        }
        
        const pageVisitCount = pageVisits[currentPage] || 0;
        updateVisitorDisplay(totalVisits, pageVisitCount);
    }

    // Function to get visit count without incrementing
    async function getVisitCount() {
        const currentPage = getCurrentPage();
        debugLog(`Getting current visit count for: ${currentPage}`);
        
        // Check if we have recent cached data
        const lastUpdate = localStorage.getItem(LS_LAST_UPDATE);
        const now = Date.now();
        
        if (lastUpdate && (now - lastUpdate < CACHE_DURATION)) {
            debugLog('Using cached visit counts');
            useCachedCounters();
            return;
        }
        
        try {
            // Fetch current data from JSONbin
            const response = await fetch(`${JSONBIN_API_URL}/latest?${Date.now()}`, {
                headers: {
                    'X-Master-Key': MASTER_KEY
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
            
            const data = await response.json();
            let counts = data.record || {};
            let needsUpdate = false;
            
            // Initialize total visit counter if it doesn't exist
            if (!counts.visits) {
                counts.visits = 5000; // Start with 5000 visits
                needsUpdate = true;
            }
            
            // Initialize page visits object if it doesn't exist
            if (!counts.pageVisits) {
                counts.pageVisits = {};
                needsUpdate = true;
            }
            
            // Special projects page handling
            if (currentPage === 'projects') {
                debugLog('Special handling for projects page in getVisitCount');
                console.log('VISITOR TRACKER DEBUG: Special handling for projects page in getVisitCount');
                
                if (counts.pageVisits.projects === undefined || counts.pageVisits.projects === null || counts.pageVisits.projects === 0) {
                    console.log('VISITOR TRACKER DEBUG: Projects counter missing or 0, setting to 1');
                    counts.pageVisits.projects = 1;
                    needsUpdate = true;
                }
            }
            // Normal page handling
            else if (!counts.pageVisits[currentPage] && counts.pageVisits[currentPage] !== 0) {
                counts.pageVisits[currentPage] = 0;
                needsUpdate = true;
            }
            
            // Initialize standard pages if they don't exist
            const standardPages = ['home', 'projects', 'blog', 'games', 'about'];
            standardPages.forEach(page => {
                if (!counts.pageVisits[page] && counts.pageVisits[page] !== 0) {
                    counts.pageVisits[page] = 0;
                    needsUpdate = true;
                }
            });
            
            // If we've initialized any values, update the bin
            if (needsUpdate) {
                debugLog('Initializing missing page visit counters');
                
                const updateResponse = await fetch(JSONBIN_API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': false
                    },
                    body: JSON.stringify(counts)
                });
                
                if (!updateResponse.ok) {
                    throw new Error(`Failed to update initialized counters. Status: ${updateResponse.status}`);
                }
                
                debugLog('Missing counters initialized successfully');
            }
            
            debugLog(`Current total visit count: ${counts.visits}`);
            debugLog(`Current ${currentPage} visit count: ${counts.pageVisits[currentPage]}`);
            
            // Store in local storage for consistent display across pages
            localStorage.setItem(LS_TOTAL_VISITS, counts.visits);
            localStorage.setItem(LS_LAST_UPDATE, Date.now());
            
            // Save page visits
            const pageVisits = JSON.stringify(counts.pageVisits);
            localStorage.setItem(LS_PAGE_VISITS, pageVisits);
            
            // Update the visitor counter displays
            updateVisitorDisplay(counts.visits, counts.pageVisits[currentPage]);
            
            return counts;
        } catch (error) {
            console.error('Error getting visit count:', error);
            // Use cached values if available
            useCachedCounters();
            return { visits: 0, pageVisits: {} };
        }
    }

    // Function to update the visitor counter display
    function updateVisitorDisplay(totalCount, pageCount) {
        console.log('VISITOR TRACKER DEBUG: updateVisitorDisplay called with', { totalCount, pageCount });
        
        // Update total visitor count
        const visitorCountElement = document.getElementById('visitor-count');
        if (visitorCountElement) {
            visitorCountElement.textContent = formatNumber(totalCount);
            console.log('VISITOR TRACKER DEBUG: Updated footer visitor count to', formatNumber(totalCount));
        } else {
            console.log('VISITOR TRACKER DEBUG: Footer visitor count element not found');
        }
        
        // Update header visitor count if it exists (for projects page)
        const headerVisitorCountElement = document.getElementById('header-visitor-count');
        if (headerVisitorCountElement) {
            headerVisitorCountElement.textContent = formatNumber(totalCount);
            console.log('VISITOR TRACKER DEBUG: Updated header visitor count to', formatNumber(totalCount));
        } else {
            console.log('VISITOR TRACKER DEBUG: Header visitor count element not found');
        }
        
        // Update page-specific visitor count
        const pageVisitorCountElement = document.getElementById('page-visitor-count');
        if (pageVisitorCountElement) {
            pageVisitorCountElement.textContent = formatNumber(pageCount);
            console.log('VISITOR TRACKER DEBUG: Updated page visitor count to', formatNumber(pageCount));
        } else {
            console.log('VISITOR TRACKER DEBUG: Page visitor count element not found');
        }
    }

    // Function to initialize download counts
    async function initializeDownloadCounts() {
        try {
            // Check if all projects have download counters
            const response = await fetch(`${JSONBIN_API_URL}/latest?${Date.now()}`, {
                headers: {
                    'X-Master-Key': MASTER_KEY
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
            
            const data = await response.json();
            let counts = data.record || {};
            let needsUpdate = false;
            
            // Project list to ensure counters exist
            const projectsToCheck = ['sba-pro-master', 'ecollation', 'referee-connect', 'ibank', 'exam-analyzer'];
            
            // Only initialize missing counters, don't force a minimum value
            projectsToCheck.forEach(project => {
                if (counts[project] === undefined) {
                    // Initialize missing counter to 0 instead of 3000
                    counts[project] = 0;
                    needsUpdate = true;
                    debugLog(`Initializing missing download counter for ${project} to 0`);
                }
            });
            
            if (needsUpdate) {
                debugLog('Initializing missing download counters');
                
                // Update JSONbin with initialized download counts
                await fetch(JSONBIN_API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': false
                    },
                    body: JSON.stringify(counts)
                });
                
                debugLog('Missing download counters initialized successfully');
            }
        } catch (error) {
            console.error('Error initializing download counts:', error);
        }
    }

    // Check if this is a unique visit (using session storage)
    function isUniqueVisit() {
        const currentPage = getCurrentPage();
        const sessionVisitKey = `visited_${currentPage}`;
        
        debugLog(`Checking unique visit for: ${currentPage}, Session key: ${sessionVisitKey}`);
        
        const sessionVisit = sessionStorage.getItem(sessionVisitKey);
        if (!sessionVisit) {
            // This is a unique visit to this page in this session
            debugLog(`First visit to ${currentPage} in this session`);
            sessionStorage.setItem(sessionVisitKey, 'true');
            return true;
        }
        debugLog(`Repeat visit to ${currentPage} in this session`);
        return false;
    }

    // Immediately show cached values (if available) for faster user experience
    function showCachedValues() {
        // Check if we have data in local storage
        const totalVisits = localStorage.getItem(LS_TOTAL_VISITS);
        if (totalVisits) {
            const currentPage = getCurrentPage();
            let pageVisits = {};
            
            try {
                pageVisits = JSON.parse(localStorage.getItem(LS_PAGE_VISITS) || '{}');
            } catch (e) {
                debugLog('Error parsing page visits from local storage');
            }
            
            const pageVisitCount = pageVisits[currentPage] || 0;
            updateVisitorDisplay(totalVisits, pageVisitCount);
        }
    }

    // Function to fix the projects page counter if it's not working
    async function fixProjectsCounter() {
        const currentPage = getCurrentPage();
        
        console.log('VISITOR TRACKER DEBUG: fixProjectsCounter called, currentPage =', currentPage);
        
        // Only run this fix on the projects page
        if (currentPage !== 'projects') {
            console.log('VISITOR TRACKER DEBUG: Not on projects page, skipping fix');
            return;
        }
        
        debugLog('Running fix for projects page counter');
        
        try {
            // Fetch current data from JSONbin
            const response = await fetch(`${JSONBIN_API_URL}/latest?${Date.now()}`, {
                headers: {
                    'X-Master-Key': MASTER_KEY
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
            
            const data = await response.json();
            let counts = data.record || {};
            
            console.log('VISITOR TRACKER DEBUG: Current JSONbin data:', JSON.stringify(counts));
            
            // Ensure pageVisits exists
            if (!counts.pageVisits) {
                counts.pageVisits = {};
            }
            
            // Check if projects counter is 0 or doesn't exist
            console.log('VISITOR TRACKER DEBUG: Current projects count:', counts.pageVisits.projects);
            
            // ALWAYS update the projects counter to ensure it's working
            let needsUpdate = false;
            
            if (!counts.pageVisits.projects) {
                console.log('VISITOR TRACKER DEBUG: Fixing projects counter - setting to 1');
                counts.pageVisits.projects = 1; // Start with 1 (current visit)
                needsUpdate = true;
            } else if (counts.pageVisits.projects === 0) {
                console.log('VISITOR TRACKER DEBUG: Projects counter is 0 - setting to 1');
                counts.pageVisits.projects = 1;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                // Update JSONbin
                const updateResponse = await fetch(JSONBIN_API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': false
                    },
                    body: JSON.stringify(counts)
                });
                
                if (!updateResponse.ok) {
                    throw new Error(`Failed to update. Status: ${updateResponse.status}`);
                }
                
                console.log('VISITOR TRACKER DEBUG: Fixed projects counter successfully');
                debugLog('Fixed projects counter successfully');
                
                // Save to local storage for consistent display across pages
                localStorage.setItem(LS_TOTAL_VISITS, counts.visits);
                localStorage.setItem(LS_LAST_UPDATE, Date.now());
                
                // Save page visits
                const pageVisits = JSON.stringify(counts.pageVisits);
                localStorage.setItem(LS_PAGE_VISITS, pageVisits);
                
                // Update the visitor counter displays
                updateVisitorDisplay(counts.visits, counts.pageVisits.projects);
            } else {
                console.log('VISITOR TRACKER DEBUG: Projects counter already exists and is not 0:', counts.pageVisits.projects);
            }
        } catch (error) {
            console.error('Error fixing projects counter:', error);
        }
    }

    // Initialize the visitor counter
    document.addEventListener('DOMContentLoaded', () => {
        debugLog('Initializing visitor counter');
        
        // Show cached values first for fast display
        showCachedValues();
        
        // Ensure all download counters exist (without forcing a minimum value)
        initializeDownloadCounts();
        
        // Force initialize projects page counter if we're on that page
        const currentPage = getCurrentPage();
        if (currentPage === 'projects') {
            console.log('VISITOR TRACKER DEBUG: On projects page - forcing counter initialization');
            
            // Get cached data
            let pageVisits = {};
            try {
                pageVisits = JSON.parse(localStorage.getItem(LS_PAGE_VISITS) || '{}');
            } catch (e) {
                console.log('VISITOR TRACKER DEBUG: Error parsing page visits from local storage');
            }
            
            // Force projects counter to at least 1
            if (!pageVisits.projects || pageVisits.projects < 1) {
                console.log('VISITOR TRACKER DEBUG: Setting projects counter to 1 in local storage');
                pageVisits.projects = 1;
                localStorage.setItem(LS_PAGE_VISITS, JSON.stringify(pageVisits));
                
                // Update display
                const totalVisits = localStorage.getItem(LS_TOTAL_VISITS) || 5000;
                updateVisitorDisplay(totalVisits, 1);
            }
        }
        
        // Run special fix for projects page
        fixProjectsCounter();
        
        // Check if we should increment the counter or just display it
        if (isUniqueVisit()) {
            // This is a unique visit to this page, increment the counter
            trackVisit();
        } else {
            // Just get the current count without incrementing
            getVisitCount();
        }
    });
})(); 