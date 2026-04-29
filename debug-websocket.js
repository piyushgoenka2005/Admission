// Simple WebSocket test script to debug the connection
console.log('🧪 Starting WebSocket debug test...');

// Test 1: Direct connection to Socket.IO server
const socket1 = io('http://localhost:3000', {
  path: '/api/socket/io',
  transports: ['websocket', 'polling']
});

socket1.on('connect', () => {
  console.log('✅ Test 1 - Connected directly:', socket1.id);
});

socket1.on('disconnect', () => {
  console.log('❌ Test 1 - Disconnected');
});

// Test 2: Connection via admin dashboard route
fetch('/admin')
  .then(() => {
    console.log('✅ Test 2 - Admin page loaded');
    
    // Wait a bit for WebSocket to initialize
    setTimeout(() => {
      const socket2 = io('http://localhost:3000', {
        path: '/api/socket/io',
        transports: ['websocket', 'polling']
      });
      
      socket2.on('connect', () => {
        console.log('✅ Test 2 - Connected via admin:', socket2.id);
        
        // Test sending a message to simulate server broadcast
        setTimeout(() => {
          console.log('🧪 Test 2 - Simulating server broadcast...');
          socket2.emit('newApplication', {
            type: 'new_application',
            data: {
              student_name: 'Debug Student',
              student_uid: 'DEBUG001',
              email: 'debug@test.com',
              created_at: new Date().toISOString(),
              phone_number: '+91-9876543210',
              college_name: 'Debug College'
            },
            timestamp: new Date().toISOString()
          });
        }, 2000);
      });
      
      socket2.on('newApplication', (data) => {
        console.log('🧪 Test 2 - Received broadcast:', data);
      });
      
      socket2.on('disconnect', () => {
        console.log('❌ Test 2 - Disconnected from admin');
      });
    }, 3000);
  })
  .catch(error => {
    console.error('❌ Test 2 - Failed to load admin page:', error);
  });

console.log('🧪 WebSocket debug test started. Open browser console to see results.');
