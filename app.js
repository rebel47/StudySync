// Minimal app JS to wire UI and Firebase (insert your firebase config below).

const state = {
  user: null,
  notes: [],
  session: null,
  isSessionHost: false, // Track if current user is the session admin/host
  timer: {
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60, // Total duration for the current timer session
    mode: 'focus', // 'focus' or 'break'
    interval: null
  },
  chat: {
    isOpen: false,
    unreadCount: 0,
    username: null
  }
};

// Timer Settings State
const timerSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  completedPomodoros: 0
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
const participantsAvatars = document.getElementById('participants-avatars');
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

// Settings elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const pomodoroTimeInput = document.getElementById('pomodoro-time');
const shortBreakTimeInput = document.getElementById('short-break-time');
const longBreakTimeInput = document.getElementById('long-break-time');
const autoStartBreaksInput = document.getElementById('auto-start-breaks');
const autoStartPomodorosInput = document.getElementById('auto-start-pomodoros');
const longBreakIntervalInput = document.getElementById('long-break-interval');
const resetSettingsBtn = document.getElementById('reset-settings');
const saveSettingsBtn = document.getElementById('save-settings');

function setLoading(on) { if (loadingEl) loadingEl.classList.toggle('hidden', !on); }

function renderNotes() {
  console.log('Rendering notes, count:', state.notes.length);
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
    
    const title = data.title || 'Untitled';
    const content = data.content || '';
    
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div>
        <div class="note-title">${escapeHtml(title)}</div>
        <div class="note-body">${escapeHtml(content)}</div>
      </div>
      <div class="note-meta">
        <div class="small">${new Date(data.timestamp?.toDate?.() || Date.now()).toLocaleString()}</div>
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
        title: title,
        content: content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('users').doc(state.user.uid).collection('notes').add({
        title: title,
        content: content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: state.user.uid
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
  
  console.log('Setting up notes listener for user:', state.user.uid);
  console.log('User email:', state.user.email);
  
  const notesRef = db.collection('users').doc(state.user.uid).collection('notes').orderBy('timestamp', 'desc');
  
  // Clean up existing listener
  if (window.unsubscribeNotes) {
    window.unsubscribeNotes();
  }
  
  // Set up real-time listener
  window.unsubscribeNotes = notesRef.onSnapshot(snapshot => {
    console.log('Notes snapshot received, count:', snapshot.size);
    state.notes = snapshot.docs;
    renderNotes();
    setLoading(false);
  }, err => { 
    console.error('Notes listener error:', err); 
    setLoading(false); 
  });
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

// Participant Avatar Functions
function getInitials(name) {
  if (!name) return '?';
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function createParticipantAvatar(participantId, participantData, isHost) {
  const avatar = document.createElement('div');
  avatar.className = 'participant-avatar';
  avatar.dataset.participantId = participantId;
  
  if (isHost) {
    avatar.classList.add('is-admin');
  }
  
  // Try to use Google profile photo if available (for current user)
  if (participantId === state.user?.uid && state.user?.photoURL) {
    const img = document.createElement('img');
    img.src = state.user.photoURL;
    img.alt = participantData.name;
    avatar.appendChild(img);
  } else {
    // Use initials with color variation based on name
    const colors = [
      'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
      'linear-gradient(45deg, #4ecdc4, #6ee7df)', 
      'linear-gradient(45deg, #45b7d1, #6cc9e8)',
      'linear-gradient(45deg, #96ceb4, #b8e6d0)',
      'linear-gradient(45deg, #feca57, #ffd777)',
      'linear-gradient(45deg, #ff9ff3, #f368e0)',
      'linear-gradient(45deg, #54a0ff, #7bed9f)'
    ];
    
    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < participantData.name.length; i++) {
      hash = participantData.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    
    avatar.style.background = colors[colorIndex];
    avatar.textContent = getInitials(participantData.name);
  }
  
  // Add tooltip with participant name
  const tooltip = document.createElement('div');
  tooltip.className = 'participant-tooltip';
  tooltip.textContent = `${participantData.name}${isHost ? ' (Admin)' : ''}`;
  avatar.appendChild(tooltip);
  
  return avatar;
}

function updateParticipantAvatars(participants, hostId) {
  if (!participantsAvatars) return;
  
  // Clear existing avatars
  participantsAvatars.innerHTML = '';
  
  const MAX_VISIBLE_AVATARS = 5;
  const participantEntries = Object.entries(participants);
  const totalParticipants = participantEntries.length;
  
  // Show first 5 avatars
  participantEntries.slice(0, MAX_VISIBLE_AVATARS).forEach(([participantId, participantData]) => {
    const isHost = participantId === hostId;
    const avatar = createParticipantAvatar(participantId, participantData, isHost);
    participantsAvatars.appendChild(avatar);
  });
  
  // Show "+N" indicator if there are more participants
  if (totalParticipants > MAX_VISIBLE_AVATARS) {
    const remaining = totalParticipants - MAX_VISIBLE_AVATARS;
    const remainingParticipants = participantEntries.slice(MAX_VISIBLE_AVATARS);
    
    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'participant-avatar more-participants';
    moreIndicator.textContent = `+${remaining}`;
    
    // Create dropdown with remaining participants
    const dropdown = document.createElement('div');
    dropdown.className = 'participants-dropdown';
    
    remainingParticipants.forEach(([participantId, participantData]) => {
      const isHost = participantId === hostId;
      const item = document.createElement('div');
      item.className = 'dropdown-participant-item';
      
      const avatar = document.createElement('div');
      avatar.className = 'dropdown-avatar';
      
      // Use Google photo if available, otherwise initials
      if (participantData.photoURL) {
        avatar.innerHTML = `<img src="${participantData.photoURL}" alt="${participantData.name}" />`;
      } else {
        avatar.textContent = getInitials(participantData.name);
        avatar.style.background = getAvatarColor(participantData.name);
      }
      
      const name = document.createElement('span');
      name.className = 'dropdown-participant-name';
      name.textContent = participantData.name + (isHost ? ' (Admin)' : '');
      
      item.appendChild(avatar);
      item.appendChild(name);
      dropdown.appendChild(item);
    });
    
    moreIndicator.appendChild(dropdown);
    participantsAvatars.appendChild(moreIndicator);
  }
}

async function createSession() {
  if (!state.user) return alert('Sign in first');
  
  if (!rtdb) {
    alert('Realtime Database not available. Please check your Firebase configuration.');
    return;
  }
  
  try {
    // Enhanced rate limiting with stricter controls
    const userLimitsRef = rtdb.ref(`userLimits/${state.user.uid}`);
    const limitsSnapshot = await userLimitsRef.once('value');
    const limits = limitsSnapshot.val() || {};
    
    const now = Date.now();
    const lastCreated = limits.lastSessionCreated || 0;
    const sessionsToday = limits.sessionsCreated || 0;
    
    // Strict rate limits to prevent DoS
    const oneDay = 24 * 60 * 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;  // Increased from 1 minute
    const oneHour = 60 * 60 * 1000;
    
    // Progressive rate limiting
    if (now - lastCreated < fiveMinutes) {
      alert('Please wait 5 minutes before creating another session to prevent spam.');
      return;
    }
    
    // Daily limits with hourly sub-limits
    const sessionsInLastHour = await getSessionsInTimeWindow(userLimitsRef, oneHour);
    if (sessionsInLastHour >= 3) {
      alert('You can only create 3 sessions per hour. Please try again later.');
      return;
    }
    
    if (sessionsToday >= 8 && (now - lastCreated) < oneDay) { // Reduced from 10
      alert('You have reached the daily limit of 8 sessions. Please try again tomorrow.');
      return;
    }
    
    // Check for existing active sessions by this user
    const activeSessionsCount = await countActiveSessionsByUser(state.user.uid);
    if (activeSessionsCount >= 2) { // Max 2 concurrent sessions
      alert('You can only have 2 active sessions at a time. Please leave an existing session first.');
      return;
    }
    
    const sessionCode = generateSessionCode();
    const username = generateUsername();
    
    console.log('Creating session with code:', sessionCode);
    
    // Create session with validation and expiry
    await rtdb.ref(`sessions/${sessionCode}`).set({
      host: state.user.uid,
      created: firebase.database.ServerValue.TIMESTAMP,
      expiresAt: now + (6 * 60 * 60 * 1000), // Auto-expire in 6 hours
      timer: {
        timeLeft: getCurrentModeDuration() * 60,
        totalTime: getCurrentModeDuration() * 60,
        mode: state.timer.mode,
        isRunning: false,
        isPaused: false
      },
      participants: {
        [state.user.uid]: {
          name: username,
          joined: firebase.database.ServerValue.TIMESTAMP,
          photoURL: state.user.photoURL || null
        }
      }
    });
    
    // Update user limits with timestamp tracking
    const newSessionsCount = (now - lastCreated) < oneDay ? sessionsToday + 1 : 1;
    await userLimitsRef.set({
      sessionsCreated: newSessionsCount,
      lastSessionCreated: now,
      sessionHistory: {
        [now]: sessionCode // Track session creation times
      }
    });
    
    console.log('Session created successfully');
    state.session = sessionCode;
    state.isSessionHost = true; // Set as host since user created the session
    state.chat.username = username;
    showSessionInfo(sessionCode);
    listenToSession(sessionCode);
    showChatToggle();
    updateTimerControlsForRole(); // Update UI based on admin status
    
    // Start listening to chat immediately
    listenToChat();
  } catch (err) {
    console.error('Error creating session:', err);
    if (err.code === 'PERMISSION_DENIED') {
      alert('Rate limit exceeded or insufficient permissions. Please try again later.');
    } else {
      alert(`Failed to create session: ${err.message}`);
    }
  }
}

// Helper function to count sessions in time window
async function getSessionsInTimeWindow(userLimitsRef, timeWindow) {
  try {
    const snapshot = await userLimitsRef.child('sessionHistory').once('value');
    const history = snapshot.val() || {};
    const now = Date.now();
    
    return Object.keys(history).filter(timestamp => 
      now - parseInt(timestamp) < timeWindow
    ).length;
  } catch (err) {
    console.log('Error checking session history:', err);
    return 0;
  }
}

// Helper function to count active sessions by user
async function countActiveSessionsByUser(userId) {
  try {
    const sessionsSnapshot = await rtdb.ref('sessions').once('value');
    const sessions = sessionsSnapshot.val() || {};
    
    let count = 0;
    const now = Date.now();
    
    Object.values(sessions).forEach(session => {
      if (session.host === userId && 
          session.participants && 
          Object.keys(session.participants).length > 0 &&
          (!session.expiresAt || session.expiresAt > now)) {
        count++;
      }
    });
    
    return count;
  } catch (err) {
    console.log('Error counting active sessions:', err);
    return 0;
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
      alert('Session not found. Please check the session code.');
      return;
    }
    
    const sessionData = snapshot.val();
    
    // Check if session has expired
    if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
      alert('This session has expired.');
      return;
    }
    
    // Check participant limit (max 10)
    const currentParticipants = Object.keys(sessionData.participants || {}).length;
    if (currentParticipants >= 10) {
      alert('This session is full (maximum 10 participants).');
      return;
    }
    
    // Add user to session
    await sessionRef.child(`participants/${state.user.uid}`).set({
      name: username,
      joined: firebase.database.ServerValue.TIMESTAMP,
      photoURL: state.user.photoURL || null
    });
    
    state.session = sessionCode;
    state.isSessionHost = false; // Joining user is not the host
    state.chat.username = username;
    showSessionInfo(sessionCode);
    listenToSession(sessionCode);
    showChatToggle();
    hideJoinModal();
    updateTimerControlsForRole(); // Update UI based on admin status
    
    // Start listening to chat immediately
    listenToChat();
    
    console.log(`Successfully joined session: ${sessionCode}`);
  } catch (err) {
    console.error('Error joining session:', err);
    alert(`Failed to join session: ${err.message}`);
  }
}

async function leaveSession() {
  if (!state.session || !state.user) return;
  
  try {
    const sessionRef = rtdb.ref(`sessions/${state.session}`);
    
    // Check if current user is the admin
    if (state.isSessionHost) {
      // Get all participants
      const snapshot = await sessionRef.child('participants').once('value');
      const participants = snapshot.val();
      
      if (participants) {
        // Remove current user from participants list
        delete participants[state.user.uid];
        
        // If there are remaining participants, transfer admin to the earliest joiner
        const remainingParticipants = Object.entries(participants);
        
        if (remainingParticipants.length > 0) {
          // Sort by joined timestamp (earliest first)
          remainingParticipants.sort((a, b) => (a[1].joined || 0) - (b[1].joined || 0));
          
          // Transfer admin to the earliest joiner
          const newAdminId = remainingParticipants[0][0];
          await sessionRef.child('host').set(newAdminId);
          
          console.log(`Admin transferred to ${remainingParticipants[0][1].name}`);
        }
      }
    }
    
    // Remove current user from participants
    await rtdb.ref(`sessions/${state.session}/participants/${state.user.uid}`).remove();
    
    // IMPORTANT: Clean up session listener FIRST to prevent re-syncing
    if (window.sessionListenerRef && window.sessionListenerCallback) {
      window.sessionListenerRef.off('value', window.sessionListenerCallback);
      window.sessionListenerRef = null;
      window.sessionListenerCallback = null;
    }
    
    // Clear session state
    state.session = null;
    state.isSessionHost = false;
    state.chat.username = null;
    
    // Stop and reset timer to default state
    if (state.timer.interval) {
      clearInterval(state.timer.interval);
      state.timer.interval = null;
    }
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.mode = 'focus';
    state.timer.timeLeft = getCurrentModeDuration() * 60;
    state.timer.totalTime = getCurrentModeDuration() * 60;
    
    // Update UI to reflect reset timer
    updateTimerDisplay();
    updateTimerProgress();
    updateTimerButtons();
    
    // Hide UI elements
    hideSessionInfo();
    hideChatToggle();
    updateTimerControlsForRole(); // Reset UI controls
    cleanupChat();
  } catch (err) {
    console.error(err);
  }
}

function showSessionInfo(sessionCode) {
  sessionId.innerHTML = `Session: <strong>${sessionCode}</strong> <span class="copy-icon">📋</span>`;
  sessionId.style.cursor = 'pointer';
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
  if (startStudyModal) startStudyModal.classList.remove('hidden');
}

function hideStartStudyModal() {
  if (startStudyModal) startStudyModal.classList.add('hidden');
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
if (startStudyModal) {
  startStudyModal.addEventListener('click', (e) => {
    if (e.target === startStudyModal) {
      hideStartStudyModal();
    }
  });
}

function listenToSession(sessionCode) {
  const sessionRef = rtdb.ref(`sessions/${sessionCode}`);
  
  // Clean up any existing listener
  if (window.sessionListenerRef && window.sessionListenerCallback) {
    window.sessionListenerRef.off('value', window.sessionListenerCallback);
  }
  
  // Store both ref and callback for proper cleanup
  window.sessionListenerRef = sessionRef;
  window.sessionListenerCallback = (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      leaveSession();
      return;
    }
    
    // Check if current user became the new admin
    const wasAdmin = state.isSessionHost;
    const isNowAdmin = data.host === state.user.uid;
    
    // Notify user if they just became admin
    if (!wasAdmin && isNowAdmin) {
      alert('🎯 You are now the session admin! You can control the timer.');
    }
    
    // Update admin status
    state.isSessionHost = isNowAdmin;
    
    // Update participant avatars
    if (data.participants) {
      updateParticipantAvatars(data.participants, data.host);
    }
    
    // Sync timer state from admin
    if (data.timer) {
      state.timer = { ...state.timer, ...data.timer };
      updateTimerDisplay();
      updateTimerProgress();
      updateTimerButtons();
      
      if (data.timer.isRunning && !state.timer.interval) {
        startTimerInterval();
      } else if (!data.timer.isRunning && state.timer.interval) {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
      }
    }
    
    // Update timer controls based on admin status
    updateTimerControlsForRole();
  };
  
  sessionRef.on('value', window.sessionListenerCallback);
}

// Settings Functions
function loadSettings() {
  const saved = localStorage.getItem('studysync-timer-settings');
  if (saved) {
    Object.assign(timerSettings, JSON.parse(saved));
    updateSettingsUI();
    // Update current timer if not running
    if (!state.timer.isRunning) {
      const currentDuration = getCurrentModeDuration();
      state.timer.timeLeft = currentDuration * 60;
      state.timer.totalTime = currentDuration * 60; // Also update totalTime
      updateTimerDisplay();
      updateTimerProgress();
    }
  }
}

function saveSettings() {
  localStorage.setItem('studysync-timer-settings', JSON.stringify(timerSettings));
}

function updateSettingsUI() {
  if (pomodoroTimeInput) pomodoroTimeInput.value = timerSettings.pomodoro;
  if (shortBreakTimeInput) shortBreakTimeInput.value = timerSettings.shortBreak;
  if (longBreakTimeInput) longBreakTimeInput.value = timerSettings.longBreak;
  if (autoStartBreaksInput) autoStartBreaksInput.checked = timerSettings.autoStartBreaks;
  if (autoStartPomodorosInput) autoStartPomodorosInput.checked = timerSettings.autoStartPomodoros;
  if (longBreakIntervalInput) longBreakIntervalInput.value = timerSettings.longBreakInterval;
}

function resetToDefaults() {
  timerSettings.pomodoro = 25;
  timerSettings.shortBreak = 5;
  timerSettings.longBreak = 15;
  timerSettings.autoStartBreaks = false;
  timerSettings.autoStartPomodoros = false;
  timerSettings.longBreakInterval = 4;
  updateSettingsUI();
}

function applySettings() {
  if (pomodoroTimeInput) timerSettings.pomodoro = parseInt(pomodoroTimeInput.value);
  if (shortBreakTimeInput) timerSettings.shortBreak = parseInt(shortBreakTimeInput.value);
  if (longBreakTimeInput) timerSettings.longBreak = parseInt(longBreakTimeInput.value);
  if (autoStartBreaksInput) timerSettings.autoStartBreaks = autoStartBreaksInput.checked;
  if (autoStartPomodorosInput) timerSettings.autoStartPomodoros = autoStartPomodorosInput.checked;
  if (longBreakIntervalInput) timerSettings.longBreakInterval = parseInt(longBreakIntervalInput.value);
  
  // Update current timer if not running
  if (!state.timer.isRunning) {
    const currentDuration = getCurrentModeDuration();
    state.timer.timeLeft = currentDuration * 60;
    updateTimerDisplay();
    updateTimerProgress();
  }
  
  saveSettings();
}

function getCurrentModeDuration() {
  if (state.timer.mode === 'focus') {
    return timerSettings.pomodoro;
  } else {
    // Determine if it should be short or long break
    const shouldBeLongBreak = timerSettings.completedPomodoros > 0 && 
                              timerSettings.completedPomodoros % timerSettings.longBreakInterval === 0;
    return shouldBeLongBreak ? timerSettings.longBreak : timerSettings.shortBreak;
  }
}

// Admin Control Functions
function updateTimerControlsForRole() {
  const isAdmin = !state.session || state.isSessionHost; // Solo mode or admin in session
  
  // Enable/disable timer control buttons
  if (startTimerBtn) startTimerBtn.disabled = !isAdmin;
  if (pauseTimerBtn) pauseTimerBtn.disabled = !isAdmin;
  if (resetTimerBtn) resetTimerBtn.disabled = !isAdmin;
  if (focusStartBtn) focusStartBtn.disabled = !isAdmin;
  if (focusPauseBtn) focusPauseBtn.disabled = !isAdmin;
  if (focusResetBtn) focusResetBtn.disabled = !isAdmin;
  
  // Add visual indication and prevent all interactions for disabled state
  const controlButtons = [startTimerBtn, pauseTimerBtn, resetTimerBtn, focusStartBtn, focusPauseBtn, focusResetBtn];
  controlButtons.forEach(btn => {
    if (btn) {
      btn.style.opacity = isAdmin ? '1' : '0.5';
      btn.style.cursor = isAdmin ? 'pointer' : 'not-allowed';
      btn.style.pointerEvents = isAdmin ? 'auto' : 'none'; // Completely prevent clicks
      btn.title = isAdmin ? '' : 'Only the room admin can control the timer';
      
      // Add/remove a CSS class for additional styling
      if (isAdmin) {
        btn.classList.remove('admin-disabled');
      } else {
        btn.classList.add('admin-disabled');
      }
    }
  });
  
  // Admin status is now shown in participant avatars, no need for separate indicator
}

function checkAdminPermission(action) {
  if (state.session && !state.isSessionHost) {
    alert(`Only the room admin can ${action} the timer.`);
    return false;
  }
  return true;
}

// Wrapper functions for timer controls that check admin permission
function handleStartTimer(e) {
  e.preventDefault();
  if (!checkAdminPermission('start')) {
    return;
  }
  startTimer();
}

function handlePauseTimer(e) {
  e.preventDefault();
  if (!checkAdminPermission('pause')) {
    return;
  }
  pauseTimer();
}

function handleResetTimer(e) {
  e.preventDefault();
  if (!checkAdminPermission('reset')) {
    return;
  }
  resetTimer();
}

// Timer Functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timeText = formatTime(state.timer.timeLeft);
  let modeText = 'Focus';
  
  if (state.timer.mode === 'break') {
    const shouldBeLongBreak = timerSettings.completedPomodoros % timerSettings.longBreakInterval === 0;
    modeText = shouldBeLongBreak ? 'Long Break' : 'Short Break';
  }
  
  if (timerDisplay) timerDisplay.textContent = timeText;
  if (timerMode) timerMode.textContent = modeText;
  if (focusTimerTime) focusTimerTime.textContent = timeText;
  if (focusTimerMode) focusTimerMode.textContent = modeText;
}

function updateTimerProgress() {
  // Use the stored totalTime instead of recalculating from local settings
  const totalTime = state.timer.totalTime || (getCurrentModeDuration() * 60);
  //const progress = state.timer.timeLeft / totalTime; // Progress = time remaining (inverted)
  const progress = (totalTime - state.timer.timeLeft) / totalTime; // Progress = time elapsed (fills as time passes)
  const circumference = 2 * Math.PI * 54; // radius = 54
  const offset = circumference * (1 - progress);
  
  if (timerProgress) {
    timerProgress.style.strokeDasharray = circumference;
    timerProgress.style.strokeDashoffset = offset;
  }
  if (focusTimerProgress) {
    const focusCircumference = 2 * Math.PI * 90; // radius = 90
    const focusOffset = focusCircumference * (1 - progress);
    focusTimerProgress.style.strokeDasharray = focusCircumference;
    focusTimerProgress.style.strokeDashoffset = focusOffset;
  }
}

async function startTimer() {
  state.timer.isRunning = true;
  state.timer.isPaused = false;
  
  // Set totalTime when starting (for accurate progress calculation)
  if (!state.timer.isPaused || state.timer.totalTime === undefined) {
    state.timer.totalTime = state.timer.timeLeft;
  }
  
  // If in a session, sync with other participants
  if (state.session) {
    await rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: true,
      isPaused: false,
      timeLeft: state.timer.timeLeft,
      totalTime: state.timer.totalTime,
      mode: state.timer.mode
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
  state.timer.timeLeft = getCurrentModeDuration() * 60;
  state.timer.totalTime = state.timer.timeLeft; // Reset totalTime as well
  
  if (state.session) {
    await rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: false,
      isPaused: false,
      timeLeft: state.timer.timeLeft,
      totalTime: state.timer.totalTime,
      mode: state.timer.mode
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
      
      // Only admin updates the database in sessions
      if (state.session && state.isSessionHost) {
        await rtdb.ref(`sessions/${state.session}/timer/timeLeft`).set(state.timer.timeLeft);
      }
    } else {
      // Timer finished
      clearInterval(state.timer.interval);
      state.timer.interval = null;
      state.timer.isRunning = false;
      
      // Play notification sound for everyone
      playNotificationSound();
      
      // Handle timer completion (only admin can do this in sessions)
      handleTimerComplete();
    }
  }, 1000);
}

function handleTimerComplete() {
  // Only admin can handle timer completion in sessions
  if (state.session && !state.isSessionHost) return;
  
  if (state.timer.mode === 'focus') {
    // Pomodoro completed
    timerSettings.completedPomodoros++;
    
    // Determine next break type
    const shouldBeLongBreak = timerSettings.completedPomodoros % timerSettings.longBreakInterval === 0;
    const nextDuration = shouldBeLongBreak ? timerSettings.longBreak : timerSettings.shortBreak;
    
    state.timer.mode = 'break';
    state.timer.timeLeft = nextDuration * 60;
    state.timer.totalTime = nextDuration * 60; // Update totalTime for new mode
    state.timer.isRunning = false;
    
    const breakType = shouldBeLongBreak ? 'Long' : 'Short';
    //alert(`Pomodoro complete! Time for a ${breakType.toLowerCase()} break (${nextDuration} minutes).`);
    
    if (timerSettings.autoStartBreaks) {
      setTimeout(() => {
        startTimer();
      }, 1000);
    }
  } else {
    // Break completed
    state.timer.mode = 'focus';
    state.timer.timeLeft = timerSettings.pomodoro * 60;
    state.timer.totalTime = timerSettings.pomodoro * 60; // Update totalTime for new mode
    state.timer.isRunning = false;
    
    //alert(`Break complete! Time to focus (${timerSettings.pomodoro} minutes).`);
    
    if (timerSettings.autoStartPomodoros) {
      setTimeout(() => {
        startTimer();
      }, 1000);
    }
  }
  
  updateTimerDisplay();
  updateTimerProgress();
  updateTimerButtons();
  
  // Sync with session if in collaborative mode (only admin does this)
  if (state.session) {
    rtdb.ref(`sessions/${state.session}/timer`).update({
      isRunning: false,
      mode: state.timer.mode,
      timeLeft: state.timer.timeLeft,
      totalTime: state.timer.totalTime
    });
  }
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
  if (focusMode) {
    focusMode.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log('Entering focus mode');
  }
}

function exitFocusMode() {
  if (focusMode) {
    focusMode.classList.add('hidden');
    document.body.style.overflow = '';
    console.log('Exiting focus mode');
  }
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
    
    // Always start listening when chat opens
    if (state.session) {
      listenToChat();
    }
    
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

function listenToChat() {
  if (!state.session) return;
  
  const messagesRef = rtdb.ref(`sessions/${state.session}/messages`);
  
  // Clean up existing listener properly
  if (window.chatListenerRef && window.chatListenerCallback) {
    window.chatListenerRef.off('child_added', window.chatListenerCallback);
  }
  
  // Store the ref for cleanup
  window.chatListenerRef = messagesRef;
  
  // Clear existing messages in UI
  chatMessages.innerHTML = '';
  
  // Track if this is the initial load
  let isInitialLoad = true;
  
  // Create and store the callback
  window.chatListenerCallback = (snapshot) => {
    const message = snapshot.val();
    if (!message) return;
    
    // Add message to chat
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    const isOwnMessage = message.userId === state.user.uid;
    if (isOwnMessage) {
      messageEl.classList.add('own-message');
    }
    
    messageEl.innerHTML = `
      <div class="message-sender">${escapeHtml(message.sender || 'Unknown')}</div>
      <div class="message-text">${escapeHtml(message.text || '')}</div>
      <div class="message-time">${formatMessageTime(message.timestamp)}</div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Handle unread count (only for new messages from others when chat is closed)
    // Skip messages during initial load to avoid counting historical messages
    if (!isInitialLoad && !state.chat.isOpen && !isOwnMessage) {
      state.chat.unreadCount++;
      updateUnreadCount();
    }
  };
  
  // Attach the listener
  messagesRef.on('child_added', window.chatListenerCallback);
  
  // After initial messages are loaded, mark as ready to count new messages
  messagesRef.once('value', () => {
    isInitialLoad = false;
  });
  
  console.log('Started listening to chat for session:', state.session);
}

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Enhanced send message function with better error handling
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
    console.error('Error sending message:', err);
    if (err.code === 'PERMISSION_DENIED') {
      alert('Unable to send message. Make sure you are in a session.');
    } else {
      alert('Failed to send message. Please try again.');
    }
  }
}

// Clean up chat when leaving session
function cleanupChat() {
  // Properly clean up Firebase listener
  if (window.chatListenerRef && window.chatListenerCallback) {
    window.chatListenerRef.off('child_added', window.chatListenerCallback);
    window.chatListenerRef = null;
    window.chatListenerCallback = null;
  }
  
  // Clear chat messages
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
  state.chat.unreadCount = 0;
  updateUnreadCount();
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

// Settings Event Listeners
settingsBtn?.addEventListener('click', () => {
  updateSettingsUI();
  settingsModal.classList.remove('hidden');
});

closeSettingsBtn?.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

resetSettingsBtn?.addEventListener('click', () => {
  if (confirm('Reset all settings to default values?')) {
    resetToDefaults();
  }
});

saveSettingsBtn?.addEventListener('click', () => {
  applySettings();
  settingsModal.classList.add('hidden');
});

// Close settings modal when clicking outside
settingsModal?.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.add('hidden');
  }
});

// Main Event Listeners
createSessionBtn?.addEventListener('click', createSession);
joinSessionBtn?.addEventListener('click', showJoinModal);
leaveSessionBtn?.addEventListener('click', leaveSession);
confirmJoinBtn?.addEventListener('click', () => {
  const code = sessionCodeInput.value.trim().toUpperCase();
  if (code) joinSession(code);
});
cancelJoinBtn?.addEventListener('click', hideJoinModal);

startTimerBtn?.addEventListener('click', handleStartTimer);
pauseTimerBtn?.addEventListener('click', handlePauseTimer);
resetTimerBtn?.addEventListener('click', handleResetTimer);
focusModeBtn?.addEventListener('click', enterFocusMode);

focusStartBtn?.addEventListener('click', handleStartTimer);
focusPauseBtn?.addEventListener('click', handlePauseTimer);
focusResetBtn?.addEventListener('click', handleResetTimer);

chatToggle?.addEventListener('click', toggleChat);
closeChatBtn?.addEventListener('click', toggleChat);
chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(chatInput.value);
});

// Session code copy functionality
sessionId?.addEventListener('click', () => {
  if (!state.session) return;
  
  navigator.clipboard.writeText(state.session).then(() => {
    // Visual feedback
    const originalHTML = sessionId.innerHTML;
    sessionId.innerHTML = `Session: <strong>${state.session}</strong> <span class="copy-icon">✓</span>`;
    
    // Show temporary success message
    setTimeout(() => {
      sessionId.innerHTML = originalHTML;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy session code:', err);
    alert('Failed to copy session code. Please copy it manually: ' + state.session);
  });
});

// Add chat input event for auto-resize
chatInput?.addEventListener('input', (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (focusMode.classList.contains('hidden')) {
      enterFocusMode();
    } else {
      exitFocusMode();
    }
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Load settings first
  loadSettings();
  
  // Initial render
  addNoteBtn.disabled = true;
  renderNotes();
  updateTimerDisplay();
  updateTimerProgress();
  updateTimerButtons();
  updateTimerControlsForRole(); // Set initial timer control state
  
  // Run cleanup on app start (only once per session)
  if (!sessionStorage.getItem('cleanupRun')) {
    setTimeout(() => {
      cleanupOldSessions();
      sessionStorage.setItem('cleanupRun', 'true');
    }, 5000);
  }
});
