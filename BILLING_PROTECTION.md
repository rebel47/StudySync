# Google Cloud Billing Protection Setup

## 1. Set Up Billing Alerts
```bash
# Go to Google Cloud Console → Billing → Budgets & alerts
# Create budget alerts at:
# - $5 (50% threshold)
# - $8 (80% threshold) 
# - $10 (100% threshold)
```

## 2. Firebase Quotas Configuration
```javascript
// Firebase Console → Usage → Set quotas:
{
  "realtimeDatabase": {
    "dailyDownloads": "100MB",
    "dailyUploads": "50MB",
    "connections": "100"
  },
  "firestore": {
    "reads": "50000/day",
    "writes": "20000/day",
    "deletes": "5000/day"
  },
  "hosting": {
    "bandwidth": "1GB/month"
  }
}
```

## 3. Cloud Functions Rate Limiting (Optional)
```javascript
// Deploy to functions/index.js for server-side protection
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sessionLimiter = functions.database.ref('/sessions/{sessionId}')
  .onCreate(async (snapshot, context) => {
    const userId = snapshot.val().host;
    const userRef = admin.database().ref(`userLimits/${userId}`);
    const userLimits = await userRef.once('value');
    const limits = userLimits.val() || {};
    
    const now = Date.now();
    const sessionsToday = limits.sessionsCreated || 0;
    const lastCreated = limits.lastSessionCreated || 0;
    
    // Server-side enforcement
    if (sessionsToday > 10 || (now - lastCreated) < 300000) { // 5 minutes
      console.log(`Blocking excessive session creation: ${userId}`);
      await snapshot.ref.remove();
      return;
    }
  });
```

## 4. Monitoring Dashboard
```javascript
// Add to your admin panel for monitoring
async function getUsageStats() {
  const sessions = await rtdb.ref('sessions').once('value');
  const userLimits = await rtdb.ref('userLimits').once('value');
  
  return {
    activeSessions: Object.keys(sessions.val() || {}).length,
    totalUsers: Object.keys(userLimits.val() || {}).length,
    averageSessionsPerUser: calculateAverage(),
    suspiciousActivity: flagSuspiciousUsers()
  };
}
```