// JSONbin.io configuration
const BIN_ID = '65f2d7c1dc74654018a8d2c1';  // Public bin ID
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MASTER_KEY = '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK';

// Enable debugging
const DEBUG = true;

// Debug logger
function debugLog(...args) {
    if (DEBUG) {
        console.log('[Download Tracker]', ...args);
    }
}

// Function to track downloads
async function trackDownload(event, projectId) {
    event.preventDefault();
    const link = event.target.closest('a').href;
    
    debugLog(`Tracking download for: ${projectId}`);
    
    try {
        // Get current counts
        debugLog('Fetching current counts...');
        const response = await fetch(`${JSONBIN_API_URL}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        debugLog('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Current data:', data);
        
        // Make sure we have valid record data
        if (!data || !data.record) {
            throw new Error('Invalid response format from JSONbin');
        }
        
        let counts = data.record || {};
        
        // Increment count
        counts[projectId] = (counts[projectId] || 0) + 1;
        debugLog(`New count for ${projectId}:`, counts[projectId]);
        
        // Update count in JSONbin
        debugLog('Updating count in JSONbin...');
        const updateResponse = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY,
                'X-Bin-Meta': false
            },
            body: JSON.stringify(counts)
        });
        
        debugLog('Update response status:', updateResponse.status);
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to update count. Status: ${updateResponse.status}`);
        }
        
        const updateData = await updateResponse.json();
        debugLog('Update response:', updateData);
        
        // Update display immediately
        const countElement = document.querySelector(`#${projectId}-downloads`);
        if (countElement) {
            countElement.textContent = counts[projectId];
            debugLog(`Updated display for ${projectId} to ${counts[projectId]}`);
        } else {
            debugLog(`Could not find display element for ${projectId}`);
        }

        // Open the download link
        debugLog('Opening download link:', link);
        window.open(link, '_blank');
    } catch (error) {
        console.error('Error tracking download:', error);
        
        // Create a hidden error log element if it doesn't exist
        let errorLog = document.getElementById('download-error-log');
        if (!errorLog) {
            errorLog = document.createElement('div');
            errorLog.id = 'download-error-log';
            errorLog.style.display = 'none';
            document.body.appendChild(errorLog);
        }
        
        // Add error message
        const errorMsg = document.createElement('p');
        errorMsg.textContent = `Error for ${projectId}: ${error.message}`;
        errorLog.appendChild(errorMsg);
        
        // Still open the download link even if tracking fails
        window.open(link, '_blank');
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
        
        const response = await fetch(`${JSONBIN_API_URL}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        debugLog('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Download count data:', data);
        
        if (!data || !data.record) {
            throw new Error('Invalid response format from JSONbin');
        }
        
        const counts = data.record || {};
        
        projects.forEach(project => {
            const countElement = document.querySelector(`#${project}-downloads`);
            if (countElement) {
                countElement.textContent = counts[project] || 0;
                debugLog(`Set ${project} count to ${counts[project] || 0}`);
            }
        });
    } catch (error) {
        console.error('Error loading download counts:', error);
        
        // Show error on page in debug mode
        if (DEBUG) {
            const errorContainer = document.createElement('div');
            errorContainer.style.padding = '10px';
            errorContainer.style.color = 'red';
            errorContainer.style.backgroundColor = '#ffeeee';
            errorContainer.style.border = '1px solid red';
            errorContainer.style.borderRadius = '5px';
            errorContainer.style.margin = '10px 0';
            errorContainer.textContent = `Error loading download counts: ${error.message}`;
            
            // Insert after first counter if possible
            const firstCounter = document.querySelector('[id$="-downloads"]');
            if (firstCounter && firstCounter.parentNode) {
                firstCounter.parentNode.insertAdjacentElement('afterend', errorContainer);
            }
        }
    }
}

// Add event for XMLHttpRequest errors
window.addEventListener('error', function(e) {
    if (DEBUG && e.target instanceof XMLHttpRequest) {
        console.error('XHR Error:', e);
    }
});

// Load download counts when page loads
document.addEventListener('DOMContentLoaded', loadDownloadCounts); 