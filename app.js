// Minimal app JS to wire UI and Firebase (insert your firebase config below).

const state = {
  user: null,
  notes: [],
  session: null,
  timer: {
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    mode: 'focus', // 'focus' or 'break'
    interval: null
  },
  chat: {
    isOpen: false,
    unreadCount: 0,
    username: null
  }
};

// Firebase initialization - replace the config object with values from your README.md
const firebaseConfig = {
    apiKey: "AIzaSyCHOhq4c1FxOU8MqgZmg58VVOPBe-0NsGE",
    authDomain: "studysync-7c87f.firebaseapp.com",
    databaseURL: "https://studysync-7c87f-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "studysync-7c87f",
    storageBucket: "studysync-7c87f.firebasestorage.app",
    messagingSenderId: "176545965227",
    appId: "1:176545965227:web:465da8d394e1aa00eb43ee"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize Realtime Database
let rtdb;
try {
  rtdb = firebase.database();
  console.log('Firebase Realtime Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize Realtime Database:', error);
  rtdb = null;
}

// UI elements
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const addNoteBtn = document.getElementById('add-note-btn');
const drawer = document.getElementById('drawer');
const cancelBtn = document.getElementById('cancel-btn');
const noteForm = document.getElementById('note-form');
const notesGrid = document.getElementById('notes-grid');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const loadingEl = document.getElementById('loading');

// Session elements
const createSessionBtn = document.getElementById('create-session-btn');
const joinSessionBtn = document.getElementById('join-session-btn');
const leaveSessionBtn = document.getElementById('leave-session-btn');
const sessionInfo = document.getElementById('session-info');
const sessionId = document.getElementById('session-id');
const participantCount = document.getElementById('participant-count');
const joinModal = document.getElementById('join-modal');
const sessionCodeInput = document.getElementById('session-code-input');
const confirmJoinBtn = document.getElementById('confirm-join');
const cancelJoinBtn = document.getElementById('cancel-join');

// Timer elements
const timerDisplay = document.getElementById('timer-time');
const timerMode = document.getElementById('timer-mode');
const timerProgress = document.getElementById('timer-progress');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const focusModeBtn = document.getElementById('focus-mode-btn');

// Focus mode elements
const focusMode = document.getElementById('focus-mode');
const focusTimerTime = document.getElementById('focus-timer-time');
const focusTimerMode = document.getElementById('focus-timer-mode');
const focusTimerProgress = document.getElementById('focus-timer-progress');
const focusStartBtn = document.getElementById('focus-start');
const focusPauseBtn = document.getElementById('focus-pause');
const focusResetBtn = document.getElementById('focus-reset');

// Chat elements
const chatPanel = document.getElementById('chat-panel');
const chatToggle = document.getElementById('chat-toggle');
const closeChatBtn = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const unreadCountEl = document.getElementById('unread-count');

function setLoading(on) { if (loadingEl) loadingEl.classList.toggle('hidden', !on); }

function renderNotes() {
  notesGrid.querySelectorAll('.note-card, .empty').forEach(n => n.remove());
  setLoading(false);
  if (!state.notes.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No notes yet — create your first note.';
    notesGrid.appendChild(empty);
    return;
  }

  state.notes.forEach(doc => {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div>
        <div class="note-title">${escapeHtml(data.title || '')}</div>
        <div class="note-body">${escapeHtml(data.content || '')}</div>
      </div>
      <div class="note-meta">
        <div class="small">${new Date(data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || Date.now()).toLocaleString()}</div>
        <div>
          <button class="btn ghost edit-btn" data-id="${doc.id}">Edit</button>
          <button class="btn ghost delete-btn" data-id="${doc.id}">Delete</button>
        </div>
      </div>
    `;
    notesGrid.appendChild(card);
  });

  // attach handlers
  document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', onEdit));
  document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', onDelete));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openDrawer() { drawer.classList.remove('hidden'); }
function closeDrawer() { drawer.classList.add('hidden'); noteForm.dataset.editId = ''; noteForm.reset(); }

addNoteBtn.addEventListener('click', () => { noteForm.dataset.editId = ''; noteForm.reset(); openDrawer(); });
cancelBtn.addEventListener('click', closeDrawer);

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.user) return alert('Sign in first');
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const editId = noteForm.dataset.editId;
  try {
    if (editId) {
      await db.collection('users').doc(state.user.uid).collection('notes').doc(editId).update({
        title, content, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('users').doc(state.user.uid).collection('notes').add({
        title, content, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    closeDrawer();
  } catch (err) {
    console.error(err); alert('Failed to save note');
  }
});

async function onEdit(e) {
  const id = e.currentTarget.dataset.id;
  const doc = await db.collection('users').doc(state.user.uid).collection('notes').doc(id).get();
  const data = doc.data();
  titleInput.value = data.title || '';
  contentInput.value = data.content || '';
  noteForm.dataset.editId = id;
  openDrawer();
}

async function onDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm('Delete this note?')) return;
  try {
    await db.collection('users').doc(state.user.uid).collection('notes').doc(id).delete();
  } catch (err) { console.error(err); alert('Failed to delete'); }
}

// Auth
signInBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert(err.message));
});

signOutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  state.user = user;
  if (user) {
    signInBtn.classList.add('hidden');
    signOutBtn.classList.remove('hidden');
    addNoteBtn.disabled = false;
    // show user info
    userPhoto.src = user.photoURL || '';
    userPhoto.classList.toggle('hidden', !user.photoURL);
    userName.textContent = user.displayName || user.email || '';
    userName.classList.toggle('hidden', !user.displayName && !user.email);
    listenNotes();
    
    // Check for URL actions (like joining a session or starting study)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'join') {
      showJoinModal();
    } else if (action === 'start') {
      showStartStudyModal();
    }
  } else {
    // Redirect to landing page if not signed in
    window.location.href = 'index.html';
  }
});

function listenNotes() {
  if (!state.user) return;
  setLoading(true);
  const notesRef = db.collection('users').doc(state.user.uid).collection('notes').orderBy('updatedAt', 'desc');
  if (window.unsubscribeNotes) window.unsubscribeNotes();
  window.unsubscribeNotes = notesRef.onSnapshot(snapshot => {
    state.notes = snapshot.docs;
    renderNotes();
  }, err => { console.error(err); setLoading(false); });
}

// Study Session Functions
function generateSessionCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateUsername() {
  // Use Google account name if available, otherwise generate a fun name
  if (state.user && (state.user.displayName || state.user.email)) {
    return state.user.displayName || state.user.email.split('@')[0];
  }
  
  const adjectives = ['Smart', 'Focused', 'Brilliant', 'Studious', 'Clever', 'Bright', 'Quick', 'Sharp'];
  const nouns = ['Student', 'Scholar', 'Learner', 'Thinker', 'Brain', 'Mind', 'Genius', 'Ace'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

async function createSession() {
  if (!state.user) return alert('Sign in first');
  
  if (!rtdb) {
    alert('Realtime Database not available. Please check your Firebase configuration.');
    return;
  }
  
  try {
    // Check rate limiting
    const userLimitsRef = rtdb.ref(`userLimits/${state.user.uid}`);
    const limitsSnapshot = await userLimitsRef.once('value');
    const limits = limitsSnapshot.val() || {};
    
    const now = Date.now();
    const lastCreated = limits.lastSessionCreated || 0;
    const sessionsToday = limits.sessionsCreated || 0;
    
    // Rate limit: max 10 sessions per day, 1 per minute
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMinute = 60 * 1000;
    
    if (now - lastCreated < oneMinute) {
      alert('Please wait a minute before creating another session.');
      return;
    }
    
    if (sessionsToday >= 10 && (now - lastCreated) < oneDay) {
      alert('You have reached the daily limit of 10 sessions. Please try again tomorrow.');
      return;
    }
    
    const sessionCode = generateSessionCode();
    const username = generateUsername();
    
    console.log('Creating session with code:', sessionCode);
    
    // Create session with validation
    await rtdb.ref(`sessions/${sessionCode}`).set({
      host: state.user.uid,
      created: firebase.database.ServerValue.TIMESTAMP,
      timer: {
        timeLeft: 25 * 60,
        mode: 'focus',
        isRunning: false,
        isPaused: false
      },
      participants: {
        [state.user.uid]: {
          name: username,
          joined: firebase.database.ServerValue.TIMESTAMP
        }
      }
    });
    
    // Update user limits
    const newSessionsCount = (now - lastCreated) < oneDay ? sessionsToday + 1 : 1;
    await userLimitsRef.set({
      sessionsCreated: newSessionsCount,
      lastSessionCreated: now
    });
    
    console.log('Session created successfully');
    state.session = sessionCode;
    state.chat.username = username;
    showSessionInfo(sessionCode);
    listenToSession(sessionCode);
    showChatToggle();
  } catch (err) {
    console.error('Error creating session:', err);
    if (err.code === 'PERMISSION_DENIED') {
      alert('Rate limit exceeded. Please try again later.');
    } else {
      alert(`Failed to create session: ${err.message}`);
    }
  }
}

async function joinSession(sessionCode) {
  if (!state.user) return alert('Sign in first');
  
  if (!rtdb) {
    alert('Realtime Database not available. Please check your Firebase configuration.');
    return;
  }
  
  const username = generateUsername();
  
  try {
    const sessionRef = rtdb.ref(`sessions/${sessionCode}`);
    const snapshot = await sessionRef.once('value');
    
    if (!snapshot.exists()) {
      alert('Session not found');
      return;
    }
    
    await sessionRef.child(`participants/${state.user.uid}`).set({
      name: username,
      joined: firebase.database.ServerValue.TIMESTAMP
    });
    
    state.session = sessionCode;
    state.chat.username = username;
    showSessionInfo(sessionCode);
    listenToSession(sessionCode);
    showChatToggle();
    hideJoinModal();
  } catch (err) {
    console.error('Error joining session:', err);
    alert(`Failed to join session: ${err.message}`);
  }
}

async function leaveSession() {
  if (!state.session || !state.user) return;
  
  try {
    await rtdb.ref(`sessions/${state.session}/participants/${state.user.uid}`).remove();
    state.session = null;
    state.chat.username = null;
    hideSessionInfo();
    hideChatToggle();
    if (window.sessionListener) window.sessionListener();
  } catch (err) {
    console.error(err);
  }
}

function showSessionInfo(sessionCode) {
  sessionId.textContent = `Session: ${sessionCode}`;
  sessionInfo.classList.remove('hidden');
  createSessionBtn.classList.add('hidden');
  joinSessionBtn.classList.add('hidden');
  leaveSessionBtn.classList.remove('hidden');
}

function hideSessionInfo() {
  sessionInfo.classList.add('hidden');
  createSessionBtn.classList.remove('hidden');
  joinSessionBtn.classList.remove('hidden');
  leaveSessionBtn.classList.add('hidden');
}

function showJoinModal() {
  joinModal.classList.remove('hidden');
  sessionCodeInput.focus();
}

function hideJoinModal() {
  joinModal.classList.add('hidden');
  sessionCodeInput.value = '';
}

// Start Study Modal functions
const startStudyModal = document.getElementById('start-study-modal');
const studySoloBtn = document.getElementById('study-solo-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const cancelStartBtn = document.getElementById('cancel-start');

function showStartStudyModal() {
  startStudyModal.classList.remove('hidden');
}

function hideStartStudyModal() {
  startStudyModal.classList.add('hidden');
}

// Event listeners for start study modal
if (studySoloBtn) {
  studySoloBtn.addEventListener('click', () => {
    hideStartStudyModal();
    // Just start studying solo without creating a session
    console.log('Starting solo study mode');
  });
}

if (createRoomBtn) {
  createRoomBtn.addEventListener('click', () => {
    hideStartStudyModal();
    createSession();
  });
}

if (joinRoomBtn) {
  joinRoomBtn.addEventListener('click', () => {
    hideStartStudyModal();
    showJoinModal();
  });
}

if (cancelStartBtn) {
  cancelStartBtn.addEventListener('click', hideStartStudyModal);
}

// Close modal when clicking outside
startStudyModal.addEventListener('click', (e) => {
  if (e.target === startStudyModal) {
    hideStartStudyModal();
  }
});

function listenToSession(sessionCode) {
  const sessionRef = rtdb.ref(`sessions/${sessionCode}`);
  
  if (window.sessionListener) window.sessionListener();
  window.sessionListener = sessionRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      leaveSession();
      return;
    }
    
    // Update participant count
    const participants = Object.keys(data.participants || {}).length;
    participantCount.textContent = `${participants} participant${participants !== 1 ? 's' : ''}`;
    
    // Sync timer state
    if (data.timer) {
      state.timer = { ...state.timer, ...data.timer };
      updateTimerDisplay();
      updateTimerProgress();
      
      if (data.timer.isRunning && !state.timer.interval) {
        startTimerInterval();
      } else if (!data.timer.isRunning && state.timer.interval) {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
      }
    }
  });
}

// Timer Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timeText = formatTime(state.timer.timeLeft);
  const modeText = state.timer.mode === 'focus' ? 'Focus' : 'Break';
  
  if (timerDisplay) timerDisplay.textContent = timeText;
  if (timerMode) timerMode.textContent = modeText;
  if (focusTimerTime) focusTimerTime.textContent = timeText;
  if (focusTimerMode) focusTimerMode.textContent = modeText;
}

function updateTimerProgress() {
  const totalTime = state.timer.mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = (totalTime - state.timer.timeLeft) / totalTime;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const offset = circumference * (1 - progress);
  
  if (timerProgress) {
    timerProgress.style.strokeDashoffset = offset;
  }
  if (focusTimerProgress) {
    const focusCircumference = 2 * Math.PI * 90; // radius = 90
    const focusOffset = focusCircumference * (1 - progress);
    focusTimerProgress.style.strokeDashoffset = focusOffset;
  }
}

async function startTimer() {
  if (!state.session && !confirm('Start timer without a session?')) return;
  
  state.timer.isRunning = true;
  state.timer.isPaused = false;
  
  if (state.session) {
    await rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: true,
      isPaused: false,
      timeLeft: state.timer.timeLeft
    });
  }
  
  startTimerInterval();
  updateTimerButtons();
}

async function pauseTimer() {
  state.timer.isRunning = false;
  state.timer.isPaused = true;
  
  if (state.session) {
    await rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: false,
      isPaused: true
    });
  }
  
  if (state.timer.interval) {
    clearInterval(state.timer.interval);
    state.timer.interval = null;
  }
  
  updateTimerButtons();
}

async function resetTimer() {
  state.timer.isRunning = false;
  state.timer.isPaused = false;
  state.timer.timeLeft = state.timer.mode === 'focus' ? 25 * 60 : 5 * 60;
  
  if (state.session) {
    await rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: false,
      isPaused: false,
      timeLeft: state.timer.timeLeft
    });
  }
  
  if (state.timer.interval) {
    clearInterval(state.timer.interval);
    state.timer.interval = null;
  }
  
  updateTimerDisplay();
  updateTimerProgress();
  updateTimerButtons();
}

function startTimerInterval() {
  if (state.timer.interval) clearInterval(state.timer.interval);
  
  state.timer.interval = setInterval(async () => {
    if (state.timer.timeLeft > 0) {
      state.timer.timeLeft--;
      updateTimerDisplay();
      updateTimerProgress();
      
      if (state.session) {
        await rtdb.ref(`sessions/${state.session}/timer/timeLeft`).set(state.timer.timeLeft);
      }
    } else {
      // Timer finished
      clearInterval(state.timer.interval);
      state.timer.interval = null;
      state.timer.isRunning = false;
      
      // Play notification sound (simple beep)
      playNotificationSound();
      
      // Switch modes
      const newMode = state.timer.mode === 'focus' ? 'break' : 'focus';
      const newTimeLeft = newMode === 'focus' ? 25 * 60 : 5 * 60;
      
      state.timer.mode = newMode;
      state.timer.timeLeft = newTimeLeft;
      
      if (state.session) {
        await rtdb.ref(`sessions/${state.session}/timer`).update({
          isRunning: false,
          mode: newMode,
          timeLeft: newTimeLeft
        });
      }
      
      updateTimerDisplay();
      updateTimerProgress();
      updateTimerButtons();
      
      alert(`${state.timer.mode === 'focus' ? 'Break' : 'Focus'} time finished! Starting ${newMode} mode.`);
    }
  }, 1000);
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.log('Audio notification not supported');
  }
}

function updateTimerButtons() {
  if (state.timer.isRunning) {
    startTimerBtn?.classList.add('hidden');
    pauseTimerBtn?.classList.remove('hidden');
    focusStartBtn?.classList.add('hidden');
    focusPauseBtn?.classList.remove('hidden');
  } else {
    startTimerBtn?.classList.remove('hidden');
    pauseTimerBtn?.classList.add('hidden');
    focusStartBtn?.classList.remove('hidden');
    focusPauseBtn?.classList.add('hidden');
  }
}

// Focus Mode Functions
function enterFocusMode() {
  focusMode.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function exitFocusMode() {
  focusMode.classList.add('hidden');
  document.body.style.overflow = '';
}

// Chat Functions
function showChatToggle() {
  chatToggle.classList.remove('hidden');
  
  // Request notification permission when chat becomes available
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}

function hideChatToggle() {
  chatToggle.classList.add('hidden');
  chatPanel.classList.add('hidden');
  state.chat.isOpen = false;
}

function toggleChat() {
  state.chat.isOpen = !state.chat.isOpen;
  chatPanel.classList.toggle('hidden', !state.chat.isOpen);
  
  if (state.chat.isOpen) {
    state.chat.unreadCount = 0;
    updateUnreadCount();
    chatInput.focus();
    listenToChat();
    
    // Scroll to bottom when opening chat
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
  }
}

function updateUnreadCount() {
  if (unreadCountEl) {
    unreadCountEl.textContent = state.chat.unreadCount;
    unreadCountEl.classList.toggle('hidden', state.chat.unreadCount === 0);
    
    // Add pulsing animation for new messages
    if (state.chat.unreadCount > 0) {
      chatToggle.classList.add('has-unread');
    } else {
      chatToggle.classList.remove('has-unread');
    }
  }
}

// Enhanced security and cleanup functions

// Auto-cleanup old sessions (client-side helper)
async function cleanupOldSessions() {
  if (!state.user || !rtdb) return;
  
  try {
    const sessionsRef = rtdb.ref('sessions');
    const snapshot = await sessionsRef.once('value');
    const sessions = snapshot.val() || {};
    
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;
    
    Object.keys(sessions).forEach(async (sessionId) => {
      const session = sessions[sessionId];
      const created = session.created || 0;
      
      // Remove sessions older than 6 hours with no activity
      if (now - created > sixHours) {
        const participants = Object.keys(session.participants || {});
        if (participants.length === 0 || (participants.length === 1 && participants[0] === session.host)) {
          console.log('Cleaning up old session:', sessionId);
          await rtdb.ref(`sessions/${sessionId}`).remove();
        }
      }
    });
  } catch (err) {
    console.log('Cleanup error:', err);
  }
}

// Rate limiting for chat messages
const messageRateLimit = {
  lastMessage: 0,
  messageCount: 0,
  
  canSendMessage() {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Reset counter every minute
    if (now - this.lastMessage > oneMinute) {
      this.messageCount = 0;
    }
    
    // Max 30 messages per minute
    if (this.messageCount >= 30) {
      return false;
    }
    
    // Min 1 second between messages
    if (now - this.lastMessage < 1000) {
      return false;
    }
    
    return true;
  },
  
  recordMessage() {
    this.lastMessage = Date.now();
    this.messageCount++;
  }
};

// Enhanced send message with rate limiting
async function sendMessage(text) {
  if (!state.session || !text.trim()) return;
  
  if (!messageRateLimit.canSendMessage()) {
    alert('You are sending messages too quickly. Please slow down.');
    return;
  }
  
  // Sanitize message
  const sanitizedText = text.trim().substring(0, 200);
  
  try {
    await rtdb.ref(`sessions/${state.session}/messages`).push({
      sender: state.chat.username,
      text: sanitizedText,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      userId: state.user.uid
    });
    
    messageRateLimit.recordMessage();
    chatInput.value = '';
  } catch (err) {
    console.error(err);
    if (err.code === 'PERMISSION_DENIED') {
      alert('Rate limit exceeded. Please wait before sending another message.');
    } else {
      alert('Failed to send message');
    }
  }
}

// Run cleanup on app start (only once per session)
if (!sessionStorage.getItem('cleanupRun')) {
  setTimeout(() => {
    cleanupOldSessions();
    sessionStorage.setItem('cleanupRun', 'true');
  }, 5000);
}

// Event Listeners
createSessionBtn?.addEventListener('click', createSession);
joinSessionBtn?.addEventListener('click', showJoinModal);
leaveSessionBtn?.addEventListener('click', leaveSession);
confirmJoinBtn?.addEventListener('click', () => {
  const code = sessionCodeInput.value.trim().toUpperCase();
  if (code) joinSession(code);
});
cancelJoinBtn?.addEventListener('click', hideJoinModal);

startTimerBtn?.addEventListener('click', startTimer);
pauseTimerBtn?.addEventListener('click', pauseTimer);
resetTimerBtn?.addEventListener('click', resetTimer);
focusModeBtn?.addEventListener('click', enterFocusMode);

focusStartBtn?.addEventListener('click', startTimer);
focusPauseBtn?.addEventListener('click', pauseTimer);
focusResetBtn?.addEventListener('click', resetTimer);

chatToggle?.addEventListener('click', toggleChat);
closeChatBtn?.addEventListener('click', toggleChat);
chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(chatInput.value);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !focusMode.classList.contains('hidden')) {
    exitFocusMode();
  }
  if (e.key === 'Enter' && joinModal && !joinModal.classList.contains('hidden')) {
    const code = sessionCodeInput.value.trim().toUpperCase();
    if (code) joinSession(code);
  }
});

// Initial render
addNoteBtn.disabled = true;
renderNotes();
updateTimerDisplay();
updateTimerProgress();
updateTimerButtons();