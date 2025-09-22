// Landing page JavaScript - handles both signed-in and signed-out states
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

// DOM elements
const landingPage = document.getElementById('landing-page');
const welcomePage = document.getElementById('welcome-page');
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const getStartedBtn = document.getElementById('get-started-btn');
const startStudyingBtn = document.getElementById('start-studying-btn');
const joinSessionBtn = document.getElementById('join-session-btn');
const learnMoreBtn = document.getElementById('learn-more-btn');

// Auth state management
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in - show welcome page
        landingPage.classList.add('hidden');
        welcomePage.classList.remove('hidden');
        
        // Update user info
        if (userAvatar) userAvatar.src = user.photoURL || '';
        if (userDisplayName) userDisplayName.textContent = user.displayName || user.email || 'User';
        
        // Add welcome animation
        setTimeout(() => {
            document.querySelector('.welcome-section').style.animation = 'fadeInUp 0.8s ease forwards';
        }, 300);
    } else {
        // User is not signed in - show landing page
        landingPage.classList.remove('hidden');
        welcomePage.classList.add('hidden');
    }
});

// Event listeners for sign-out state
if (signInBtn) {
    signInBtn.addEventListener('click', signInWithGoogle);
}

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', signInWithGoogle);
}

// Event listeners for signed-in state
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

if (startStudyingBtn) {
    startStudyingBtn.addEventListener('click', () => {
        window.location.href = 'app.html';
    });
}

if (joinSessionBtn) {
    joinSessionBtn.addEventListener('click', () => {
        window.location.href = 'app.html?action=join';
    });
}

if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
        // Smooth scroll to features
        const featuresGrid = document.querySelector('.features-grid');
        if (featuresGrid) {
            featuresGrid.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}

// Sign in function
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error('Sign in error:', err);
        alert(`Sign in failed: ${err.message}`);
    });
}

// Add interactive effects to feature cards
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add typing effect to hero title when page loads
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        
        setTimeout(() => {
            typeWriter(heroTitle, originalText, 50);
        }, 500);
    }
});

// Typing effect function
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}