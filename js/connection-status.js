// Connection Status Check
document.addEventListener('DOMContentLoaded', function() {
    // Get connection status element
    const connectionStatus = document.getElementById('connection-status');
    const connectionLabel = document.getElementById('connection-label');
    
    if (!connectionStatus || !connectionLabel) return;
    
    // Function to update the connection status
    function updateConnectionStatus() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        // Remove all classes first
        connectionStatus.classList.remove('good', 'medium', 'poor');
        
        if (connection) {
            // If Network Information API is supported
            let strength;
            
            // Use effectiveType to determine connection quality
            if (connection.effectiveType) {
                switch (connection.effectiveType) {
                    case '4g':
                        strength = 'good';
                        connectionLabel.textContent = 'Good Connection';
                        break;
                    case '3g':
                        strength = 'medium';
                        connectionLabel.textContent = 'Medium Connection';
                        break;
                    default:
                        strength = 'poor';
                        connectionLabel.textContent = 'Poor Connection';
                        break;
                }
            } else if (connection.downlink) {
                // Use downlink (in Mbps) to determine connection quality
                if (connection.downlink >= 2) {
                    strength = 'good';
                    connectionLabel.textContent = 'Good Connection';
                } else if (connection.downlink >= 0.5) {
                    strength = 'medium';
                    connectionLabel.textContent = 'Medium Connection';
                } else {
                    strength = 'poor';
                    connectionLabel.textContent = 'Poor Connection';
                }
            } else {
                // If we can't determine, use navigator.onLine
                strength = navigator.onLine ? 'medium' : 'poor';
                connectionLabel.textContent = navigator.onLine ? 'Online' : 'Offline';
            }
            
            connectionStatus.classList.add(strength);
        } else {
            // If Network Information API is not supported, check if online
            const isOnline = navigator.onLine;
            
            if (isOnline) {
                // If online, we'll check ping to determine quality
                checkConnectionQuality();
            } else {
                connectionStatus.classList.add('poor');
                connectionLabel.textContent = 'Offline';
            }
        }
    }
    
    // Alternative method to check connection quality by measuring ping time
    function checkConnectionQuality() {
        const startTime = Date.now();
        
        // We'll try to fetch a tiny resource to measure response time
        fetch('https://www.google.com/favicon.ico', { 
            mode: 'no-cors',
            cache: 'no-store'
        })
        .then(() => {
            const endTime = Date.now();
            const pingTime = endTime - startTime;
            
            // Determine connection quality based on ping time
            let strength;
            
            if (pingTime < 300) {
                strength = 'good';
                connectionLabel.textContent = 'Good Connection';
            } else if (pingTime < 1000) {
                strength = 'medium';
                connectionLabel.textContent = 'Medium Connection';
            } else {
                strength = 'poor';
                connectionLabel.textContent = 'Poor Connection';
            }
            
            connectionStatus.classList.add(strength);
        })
        .catch(() => {
            // If fetch fails, assume poor connection
            connectionStatus.classList.add('poor');
            connectionLabel.textContent = 'Poor Connection';
        });
    }
    
    // Update connection status initially
    updateConnectionStatus();
    
    // Update connection status when online/offline events occur
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Update periodically
    setInterval(updateConnectionStatus, 30000); // Every 30 seconds
}); 