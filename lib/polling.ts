// Simple polling mechanism for real-time notifications
let lastApplicationId: string | null = null;
let isFirstPoll: boolean = true;
let pollingInterval: NodeJS.Timeout | null = null;

export function startPolling(callback: (newApplications: any[]) => void, intervalMs: number = 5000) {
  console.log('🔄 Starting polling mechanism...');
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Reset state on fresh start
  isFirstPoll = true;
  lastApplicationId = null;

  pollingInterval = setInterval(async () => {
    try {
      console.log('🔍 Polling for new applications...');
      const response = await fetch('/api/admin/applications');
      const data = await response.json();
      
      console.log('📊 Polling response:', data);
      
      if (data.students && data.students.length > 0) {
        const latestApplication = data.students[0];
        const latestId = latestApplication.id;
        
        console.log('🆔 Latest ID:', latestId, 'Last ID:', lastApplicationId, 'First poll:', isFirstPoll);
        
        if (isFirstPoll) {
          // On first poll, just record the latest ID without triggering popup
          console.log('✅ First poll complete - recording current state');
          lastApplicationId = latestId;
          isFirstPoll = false;
        } else if (latestId !== lastApplicationId) {
          // Only trigger popup when a NEW application (different ID) is detected
          console.log('🎉 New application detected! Triggering callback...');
          lastApplicationId = latestId;
          callback(data.students);
        } else {
          console.log('✅ No new applications detected');
        }
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
    }
  }, intervalMs);
  
  console.log('✅ Polling started successfully');
}

export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('🛑 Polling stopped');
  }
}

export function resetPollingTimestamp() {
  lastApplicationId = null;
  isFirstPoll = true;
  console.log('🔄 Polling state reset');
}
