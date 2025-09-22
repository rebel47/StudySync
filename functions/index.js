// Firebase Cloud Functions for server-side protection (deploy these)

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Scheduled function to clean up old sessions
exports.cleanupSessions = functions.pubsub.schedule('every 6 hours').onRun(async (context) => {
  const db = admin.database();
  const sessionsRef = db.ref('sessions');
  const snapshot = await sessionsRef.once('value');
  const sessions = snapshot.val() || {};
  
  const now = Date.now();
  const sixHours = 6 * 60 * 60 * 1000;
  let cleaned = 0;
  
  for (const [sessionId, session] of Object.entries(sessions)) {
    const created = session.created || 0;
    const participants = Object.keys(session.participants || {});
    
    // Remove old empty sessions
    if (now - created > sixHours && participants.length <= 1) {
      await sessionsRef.child(sessionId).remove();
      cleaned++;
    }
  }
  
  console.log(`Cleaned up ${cleaned} old sessions`);
  return null;
});

// Rate limiting function
exports.checkRateLimit = functions.database.ref('/sessions/{sessionId}')
  .onCreate(async (snapshot, context) => {
    const sessionData = snapshot.val();
    const userId = sessionData.host;
    
    // Check if user has created too many sessions
    const userLimitsRef = admin.database().ref(`userLimits/${userId}`);
    const limitsSnapshot = await userLimitsRef.once('value');
    const limits = limitsSnapshot.val() || {};
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sessionsToday = limits.sessionsCreated || 0;
    const lastCreated = limits.lastSessionCreated || 0;
    
    if (sessionsToday > 15 && (now - lastCreated) < oneDay) {
      // Suspend user for excessive session creation
      console.log(`Blocking excessive session creation by user: ${userId}`);
      await snapshot.ref.remove();
      return;
    }
    
    console.log(`Session created by ${userId}, count: ${sessionsToday}`);
  });

// Monitor suspicious activity
exports.monitorActivity = functions.database.ref('/sessions/{sessionId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const userId = message.userId;
    
    // Check for spam patterns
    if (message.text.length > 200 || message.text.includes('http')) {
      console.log(`Suspicious message from ${userId}: ${message.text}`);
      await snapshot.ref.remove();
    }
  });