// Landing page JavaScript
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
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const signOutBtn = document.getElementById('sign-out-btn');
const startStudyingBtn = document.getElementById('start-studying-btn');
const learnMoreBtn = document.getElementById('learn-more-btn');

// Auth state management
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, show their info
        userAvatar.src = user.photoURL || '';
        userDisplayName.textContent = user.displayName || user.email || 'User';
        
        // Add welcome animation
        setTimeout(() => {
            document.querySelector('.welcome-section').style.animation = 'fadeInUp 0.8s ease forwards';
        }, 300);
    } else {
        // User is not signed in, redirect to main page
        window.location.href = 'index.html';
    }
});

// Event listeners
signOutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
});

startStudyingBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

learnMoreBtn.addEventListener('click', () => {
    // Smooth scroll to features
    document.querySelector('.features-grid').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

// Add some interactive effects
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Add typing effect to welcome title
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

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    const welcomeTitle = document.querySelector('.welcome-title');
    const originalText = welcomeTitle.textContent;
    
    setTimeout(() => {
        typeWriter(welcomeTitle, originalText, 50);
    }, 500);
});