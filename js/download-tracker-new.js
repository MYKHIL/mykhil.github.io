// JSONbin.io configuration with Access Key approach
const BIN_ID = '65f2d7c1dc74654018a8d2c1';
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Using Access Key which has only read and update permissions
// Note: This is much safer to use in the browser than a Master Key
const ACCESS_KEY = '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK';

// Cache control parameter to prevent browser caching
const CACHE_BUSTER = `cacheBuster=${Date.now()}`;

// Local Storage Keys
const LS_DOWNLOAD_COUNTS = 'mykhil_download_counts';
const LS_LAST_FETCH = 'mykhil_last_fetch';

// Cache expiration time (10 minutes in milliseconds)
const CACHE_EXPIRATION = 10 * 60 * 1000;

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
        // First, fetch the latest data from JSONbin
        await refreshDownloadCounts();
        
        // Get counts from local storage
        const counts = getLocalCounts() || {};
        
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

// Function to fetch the latest download counts from JSONbin
async function refreshDownloadCounts() {
    debugLog('Fetching latest download counts from JSONbin...');
    
    try {
        // Check if we have a recent fetch in local storage
        const lastFetch = localStorage.getItem(LS_LAST_FETCH);
        if (lastFetch && Date.now() - parseInt(lastFetch) < CACHE_EXPIRATION) {
            debugLog('Using cached counts (cache not expired yet)');
            return getLocalCounts();
        }
        
        // Add cache buster to prevent browser caching
        const url = `${JSONBIN_API_URL}/latest?${CACHE_BUSTER}`;
        
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
        
        // Save to local storage
        saveLocalCounts(data.record);
        
        return data.record;
    } catch (error) {
        console.error('Error refreshing download counts:', error);
        // Return local counts as fallback
        return getLocalCounts() || {};
    }
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
        
        // Try to get counts from local storage first
        let counts = getLocalCounts();
        const lastFetch = localStorage.getItem(LS_LAST_FETCH);
        
        // If local storage is empty or cache is expired, fetch from JSONbin
        if (!counts || !lastFetch || Date.now() - parseInt(lastFetch) >= CACHE_EXPIRATION) {
            counts = await refreshDownloadCounts();
        } else {
            debugLog('Using cached download counts');
        }
        
        // Update the display
        projects.forEach(project => {
            const countElement = document.querySelector(`#${project}-downloads`);
            if (countElement) {
                countElement.textContent = counts[project] || 0;
                debugLog(`Set ${project} count to ${counts[project] || 0}`);
            }
        });
    } catch (error) {
        console.error('Error loading download counts:', error);
    }
}

// Load download counts when page loads
document.addEventListener('DOMContentLoaded', loadDownloadCounts); 