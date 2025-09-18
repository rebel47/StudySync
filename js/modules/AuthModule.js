// Google Auth and user progress sync

const auth = firebase.auth();
const db = firebase.database();

const signInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('googleSignOutBtn');
const userNameDisplay = document.getElementById('userNameDisplay');

// Sign in with Google
signInBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
};

// Sign out
signOutBtn.onclick = () => {
    auth.signOut();
};

// Listen for auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-block';
        userNameDisplay.textContent = user.displayName;

        // Load or create user progress
        db.ref('users/' + user.uid + '/progress').once('value').then(snapshot => {
            if (snapshot.exists()) {
                const progress = snapshot.val();
                // Update UI with loaded progress
                if (progress.sessionsCompleted !== undefined)
                    document.getElementById('sessionsCompleted').textContent = progress.sessionsCompleted;
                if (progress.focusTime !== undefined)
                    document.getElementById('focusTime').textContent = progress.focusTime;
                if (progress.currentStreak !== undefined)
                    document.getElementById('currentStreak').textContent = progress.currentStreak;
                if (progress.productivityScore !== undefined)
                    document.getElementById('productivityScore').textContent = progress.productivityScore;
            } else {
                // Initialize progress
                db.ref('users/' + user.uid + '/progress').set({
                    sessionsCompleted: 0,
                    focusTime: "0h",
                    currentStreak: 0,
                    productivityScore: "0%"
                });
            }
        });
    } else {
        signInBtn.style.display = 'inline-block';
        signOutBtn.style.display = 'none';
        userNameDisplay.textContent = '';
        // Optionally clear UI
    }
});

// Call this function whenever progress updates
function saveUserProgress(progress) {
    const user = auth.currentUser;
    if (user) {
        db.ref('users/' + user.uid + '/progress').set(progress);
    }
}

// Expose for global use
window.saveUserProgress = saveUserProgress;