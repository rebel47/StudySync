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
  } else {
    signInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
    addNoteBtn.disabled = true;
    userPhoto.classList.add('hidden');
    userName.classList.add('hidden');
    state.notes = [];
    renderNotes();
    if (window.unsubscribeNotes) { window.unsubscribeNotes(); window.unsubscribeNotes = null; }
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
  
  const sessionCode = generateSessionCode();
  const username = generateUsername();
  
  try {
    console.log('Creating session with code:', sessionCode);
    
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
    
    console.log('Session created successfully');
    state.session = sessionCode;
    state.chat.username = username;
    showSessionInfo(sessionCode);
    listenToSession(sessionCode);
    showChatToggle();
  } catch (err) {
    console.error('Error creating session:', err);
    alert(`Failed to create session: ${err.message}`);
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

async function sendMessage(text) {
  if (!state.session || !text.trim()) return;
  
  try {
    await rtdb.ref(`sessions/${state.session}/messages`).push({
      sender: state.chat.username,
      text: text.trim(),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      userId: state.user.uid
    });
    
    chatInput.value = '';
  } catch (err) {
    console.error(err);
    alert('Failed to send message');
  }
}

function listenToChat() {
  if (!state.session) return;
  
  const messagesRef = rtdb.ref(`sessions/${state.session}/messages`).limitToLast(50);
  
  if (window.chatListener) window.chatListener();
  window.chatListener = messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    displayMessage(message);
    
    // Only increment unread count if chat is closed and message is from another user
    if (!state.chat.isOpen && message.userId !== state.user.uid) {
      state.chat.unreadCount++;
      updateUnreadCount();
      
      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Study Chat Message', {
          body: `${message.sender}: ${message.text}`,
          icon: '/favicon.ico',
          tag: 'studysync-chat'
        });
      }
    }
  });
}

function displayMessage(message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message';
  messageEl.innerHTML = `
    <div class="chat-sender">${escapeHtml(message.sender)}</div>
    <div class="chat-text">${escapeHtml(message.text)}</div>
  `;
  
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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