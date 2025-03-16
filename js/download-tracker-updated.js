// JSONbin.io configuration with Access Key approach
const BIN_ID = 'YOUR_NEW_BIN_ID_HERE'; // We'll replace this with the new Bin ID
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Using Access Key (same as your Master Key)
const ACCESS_KEY = '$2a$10$Zwr/q5r0c.Lv/6Ikq9a.ROrJruWGsHzf8uSI/HWq7yjG.4OrsE2O6';

// Cache control parameter to prevent browser caching
const CACHE_BUSTER = `cacheBuster=${Date.now()}`;

// Local Storage Keys
const LS_DOWNLOAD_COUNTS = 'mykhil_download_counts';
const LS_LAST_FETCH = 'mykhil_last_fetch';

// Cache expiration time (2 minutes in milliseconds)
const CACHE_EXPIRATION = 2 * 60 * 1000;

// Debug mode
const DEBUG = true;

// Debug logger
function debugLog(...args) {
    if (DEBUG) {
        console.log('[Download Tracker]', ...args);
    }
}

// Function to get counts from local storage
function getLocalCounts() {
    try {
        const countsStr = localStorage.getItem(LS_DOWNLOAD_COUNTS);
        if (countsStr) {
            return JSON.parse(countsStr);
        }
    } catch (error) {
        console.error('Error reading from local storage:', error);
    }
    return null;
}

// Function to save counts to local storage
function saveLocalCounts(counts) {
    try {
        localStorage.setItem(LS_DOWNLOAD_COUNTS, JSON.stringify(counts));
        localStorage.setItem(LS_LAST_FETCH, Date.now().toString());
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

// Function to track downloads
async function trackDownload(event, projectId) {
    event.preventDefault();
    const link = event.target.closest('a').href;
    
    debugLog(`Tracking download for: ${projectId}`);
    
    try {
        // Always fetch the latest data from JSONbin to ensure we have the current counts
        let counts = await fetchFromJSONbin(true); // Force refresh
        
        if (!counts) {
            // If server fetch fails, fallback to local storage
            counts = getLocalCounts() || {};
            debugLog('Using local storage as fallback');
        }
        
        // Increment count
        counts[projectId] = (counts[projectId] || 0) + 1;
        debugLog(`New count for ${projectId}:`, counts[projectId]);
        
        // Update local storage immediately
        saveLocalCounts(counts);
        
        // Update display immediately
        const countElement = document.querySelector(`#${projectId}-downloads`);
        if (countElement) {
            countElement.textContent = counts[projectId];
        }
        
        // Update count in JSONbin
        debugLog('Updating count in JSONbin...');
        
        const updateResponse = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': ACCESS_KEY,
                'X-Bin-Meta': false
            },
            body: JSON.stringify(counts)
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to update JSONbin. Status: ${updateResponse.status}`);
        }
        
        // Open the download link
        window.open(link, '_blank');
    } catch (error) {
        console.error('Error tracking download:', error);
        
        // Still open the download link even if tracking fails
        window.open(link, '_blank');
    }
}

// Function to fetch data from JSONbin
async function fetchFromJSONbin(forceRefresh = false) {
    try {
        // Add cache buster to prevent browser caching
        const url = `${JSONBIN_API_URL}/latest?${forceRefresh ? Date.now() : CACHE_BUSTER}`;
        
        debugLog(`Fetching from JSONbin (force refresh: ${forceRefresh})`);
        
        const response = await fetch(url, {
            headers: {
                'X-Access-Key': ACCESS_KEY
            },
            cache: 'no-store' // Explicitly tell browser not to cache
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.record) {
            throw new Error('Invalid response format from JSONbin');
        }
        
        debugLog('Fetched data from JSONbin:', data.record);
        
        // Save to local storage
        saveLocalCounts(data.record);
        
        return data.record;
    } catch (error) {
        console.error('Error fetching from JSONbin:', error);
        return null;
    }
}

// Function to fetch the latest download counts from JSONbin
async function refreshDownloadCounts() {
    debugLog('Refreshing download counts...');
    
    // Always try to fetch from server first
    const serverCounts = await fetchFromJSONbin();
    
    if (serverCounts) {
        return serverCounts;
    }
    
    // If server fetch fails, check if we have a recent fetch in local storage
    const lastFetch = localStorage.getItem(LS_LAST_FETCH);
    const counts = getLocalCounts();
    
    if (counts && lastFetch && Date.now() - parseInt(lastFetch) < CACHE_EXPIRATION) {
        debugLog('Server fetch failed, using recent cached counts');
        return counts;
    }
    
    debugLog('No recent data available');
    return {};
}

// Load initial download counts
async function loadDownloadCounts() {
    const projects = ['sba-pro-master', 'ecollation', 'referee-connect', 'ibank', 'exam-analyzer'];
    
    debugLog('Loading initial download counts...');
    
    try {
        // Check if counters exist first
        if (!projects.some(p => document.querySelector(`#${p}-downloads`))) {
            debugLog('No download counters found on page, skipping fetch');
            return;
        }
        
        // Always try to get fresh data from server first
        let counts = await refreshDownloadCounts();
        
        // Update the display
        projects.forEach(project => {
            const countElement = document.querySelector(`#${project}-downloads`);
            if (countElement) {
                countElement.textContent = counts[project] || 0;
                debugLog(`Set ${project} count to ${counts[project] || 0}`);
            }
        });
        
        // Set up periodic refresh to ensure counts stay updated
        setInterval(async () => {
            debugLog('Performing periodic refresh');
            counts = await refreshDownloadCounts();
            
            // Update the display with fresh data
            projects.forEach(project => {
                const countElement = document.querySelector(`#${project}-downloads`);
                if (countElement) {
                    countElement.textContent = counts[project] || 0;
                }
            });
        }, 30000); // Refresh every 30 seconds
    } catch (error) {
        console.error('Error loading download counts:', error);
    }
}

// Load download counts when page loads
document.addEventListener('DOMContentLoaded', loadDownloadCounts); 