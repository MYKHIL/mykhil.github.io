// Script to create a new bin in JSONbin.io
const MASTER_KEY = '$2a$10$Zwr/q5r0c.Lv/6Ikq9a.ROrJruWGsHzf8uSI/HWq7yjG.4OrsE2O6';
const ACCOUNT_ID = '67d61f898e451c79651de485';

// Initial download counts (all starting at 0)
const initialData = {
  'sba-pro-master': 0,
  'ecollation': 0,
  'referee-connect': 0,
  'ibank': 0,
  'exam-analyzer': 0
};

async function createBin() {
  try {
    console.log('Creating new bin for download counts...');
    
    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
        'X-Bin-Name': 'DownloadCounts',
        'X-Bin-Private': false
      },
      body: JSON.stringify(initialData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create bin. Status: ${response.status}, Response: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Bin created successfully!');
    console.log('Bin ID:', data.metadata.id);
    console.log('Access Key (for read/update):', MASTER_KEY);
    console.log('You can now update your download-tracker-new.js file with these credentials.');
  } catch (error) {
    console.error('Error creating bin:', error);
  }
}

// Execute the function
createBin(); 