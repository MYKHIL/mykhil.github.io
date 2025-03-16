// Test script to check JSONbin.io access
const BIN_ID = '65f2d7c1dc74654018a8d2c1';
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const MASTER_KEY = '$2a$10$YHwxM5hbJrZANqH.YEqw/u6CAbWQR7MnUzZVhcpRIAj4wnVJaQJSK';

// Function to test GET request
async function testGet() {
    try {
        console.log('Testing GET request...');
        const response = await fetch(`${JSONBIN_API_URL}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('GET response data:', data);
        return data;
    } catch (error) {
        console.error('Error testing GET:', error);
    }
}

// Function to test PUT request
async function testPut(currentData) {
    try {
        console.log('Testing PUT request...');
        // Add a test timestamp to verify update
        const updateData = {
            ...currentData.record,
            testTimestamp: new Date().toISOString()
        };
        
        const response = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY,
                'X-Bin-Meta': false
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('PUT response data:', data);
    } catch (error) {
        console.error('Error testing PUT:', error);
    }
}

// Run tests
async function runTests() {
    const getData = await testGet();
    if (getData) {
        await testPut(getData);
        // Verify our update worked
        await testGet();
    }
}

runTests(); 