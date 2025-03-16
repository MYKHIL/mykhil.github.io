// Connection Status Check
function updateConnectionStatus() {
    const connectionStatus = document.getElementById('connection-status');
    const connectionLabel = document.getElementById('connection-label');

    if (!navigator.onLine) {
        connectionStatus.className = 'connection-status poor';
        connectionLabel.textContent = 'Offline';
        return;
    }

    // Use the Network Information API if available
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
            case '4g':
                connectionStatus.className = 'connection-status good';
                connectionLabel.textContent = 'Good';
                break;
            case '3g':
                connectionStatus.className = 'connection-status medium';
                connectionLabel.textContent = 'Medium';
                break;
            default:
                connectionStatus.className = 'connection-status poor';
                connectionLabel.textContent = 'Poor';
                break;
        }
    } else {
        // Fallback: measure connection by loading a small resource
        const startTime = performance.now();
        fetch('https://www.google.com/favicon.ico', { 
            mode: 'no-cors',
            cache: 'no-store'
        })
        .then(() => {
            const duration = performance.now() - startTime;
            if (duration < 100) {
                connectionStatus.className = 'connection-status good';
                connectionLabel.textContent = 'Good';
            } else if (duration < 300) {
                connectionStatus.className = 'connection-status medium';
                connectionLabel.textContent = 'Medium';
            } else {
                connectionStatus.className = 'connection-status poor';
                connectionLabel.textContent = 'Poor';
            }
        })
        .catch(() => {
            connectionStatus.className = 'connection-status poor';
            connectionLabel.textContent = 'Poor';
        });
    }
}

// Update connection status initially and every 10 seconds
document.addEventListener('DOMContentLoaded', () => {
    updateConnectionStatus();
    setInterval(updateConnectionStatus, 10000);
});

// Update status when online/offline status changes
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus); 