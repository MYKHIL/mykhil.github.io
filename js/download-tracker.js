// JSONbin.io configuration - using public bin
const BIN_ID = '65f2d7c1dc74654018a8d2c1';  // Public bin ID
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Function to track downloads
async function trackDownload(event, projectId) {
    event.preventDefault();
    const link = event.target.closest('a').href;
    
    try {
        // Get current counts
        const response = await fetch(`${JSONBIN_API_URL}/latest`, {
            headers: {
                'X-Master-Key': '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK'
            }
        });
        const data = await response.json();
        let counts = data.record || {};
        
        // Increment count
        counts[projectId] = (counts[projectId] || 0) + 1;
        
        // Update count in JSONbin
        await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK',
                'X-Bin-Meta': false
            },
            body: JSON.stringify(counts)
        });
        
        // Update display immediately
        const countElement = document.querySelector(`#${projectId}-downloads`);
        if (countElement) {
            countElement.textContent = counts[projectId];
        }

        // Open the download link
        window.open(link, '_blank');
    } catch (error) {
        console.error('Error tracking download:', error);
        window.open(link, '_blank');
    }
}

// Load initial download counts
async function loadDownloadCounts() {
    const projects = ['sba-pro-master', 'ecollation', 'referee-connect', 'ibank', 'exam-analyzer'];
    
    try {
        const response = await fetch(`${JSONBIN_API_URL}/latest`, {
            headers: {
                'X-Master-Key': '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK'
            }
        });
        const data = await response.json();
        const counts = data.record || {};
        
        projects.forEach(project => {
            const countElement = document.querySelector(`#${project}-downloads`);
            if (countElement) {
                countElement.textContent = counts[project] || 0;
            }
        });
    } catch (error) {
        console.error('Error loading download counts:', error);
    }
}

// Load download counts when page loads
document.addEventListener('DOMContentLoaded', loadDownloadCounts); 