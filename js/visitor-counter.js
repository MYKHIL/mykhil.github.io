// Visitor Counter using JSONbin.io
// This script tracks the number of visits to the home page

// JSONbin.io configuration
const BIN_ID = '67d621238a456b79667697a5'; // Same bin as download tracker
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MASTER_KEY = '$2a$10$Zwr/q5r0c.Lv/6Ikq9a.ROrJruWGsHzf8uSI/HWq7yjG.4OrsE2O6';

// Debug mode
const DEBUG = true;

// Debug logger
function debugLog(...args) {
    if (DEBUG) {
        console.log('[Visitor Counter]', ...args);
    }
}

// Function to format number with commas for thousands
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to track a page visit
async function trackVisit() {
    debugLog('Tracking page visit');
    
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
            counts.visits = 0;
        }
        
        counts.visits += 1;
        debugLog(`New visit count: ${counts.visits}`);
        
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
        
        // Update the visitor counter display
        updateVisitorDisplay(counts.visits);
        
        debugLog('Visit tracked successfully');
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

// Function to get visit count without incrementing
async function getVisitCount() {
    debugLog('Getting current visit count');
    
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
        const counts = data.record || {};
        
        // Initialize visits counter if it doesn't exist
        if (!counts.visits) {
            counts.visits = 0;
            
            // Update JSONbin with initialized visits
            await fetch(JSONBIN_API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY,
                    'X-Bin-Meta': false
                },
                body: JSON.stringify(counts)
            });
        }
        
        debugLog(`Current visit count: ${counts.visits}`);
        
        // Update the visitor counter display
        updateVisitorDisplay(counts.visits);
        
        return counts.visits;
    } catch (error) {
        console.error('Error getting visit count:', error);
        return 0;
    }
}

// Function to update the visitor counter display
function updateVisitorDisplay(count) {
    const visitorCountElement = document.getElementById('visitor-count');
    if (visitorCountElement) {
        visitorCountElement.textContent = formatNumber(count);
    }
}

// Check if this is a unique visit (using session storage)
function isUniqueVisit() {
    const sessionVisit = sessionStorage.getItem('visited');
    if (!sessionVisit) {
        // This is a unique visit in this session
        sessionStorage.setItem('visited', 'true');
        return true;
    }
    return false;
}

// Initialize the visitor counter
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Initializing visitor counter');
    
    // Check if we should increment the counter or just display it
    if (isUniqueVisit()) {
        // This is a unique visit, increment the counter
        trackVisit();
    } else {
        // Just get the current count without incrementing
        getVisitCount();
    }
}); 