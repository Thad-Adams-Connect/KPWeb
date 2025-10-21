// Application State
let currentDate = new Date();
let events = [];
let currentPage = 'home';

// Protected pages that require login
const protectedPages = ['chatbot', 'profile', 'settings', 'connections'];

// Check if user is logged in
function isLoggedIn() {
    // Check both localStorage and sessionStorage
    return localStorage.getItem('isLoggedIn') === 'true' || 
           sessionStorage.getItem('isLoggedIn') === 'true';
}

// Set login state based on "Stay signed in" preference
function setLoginState(loggedIn, staySignedIn = true) {
    if (loggedIn) {
        if (staySignedIn) {
            // Use localStorage for persistent login
            localStorage.setItem('isLoggedIn', 'true');
            sessionStorage.removeItem('isLoggedIn');
        } else {
            // Use sessionStorage for session-only login
            sessionStorage.setItem('isLoggedIn', 'true');
            localStorage.removeItem('isLoggedIn');
        }
    } else {
        // Clear both storages on logout
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
    }
}

// Logout function
function logout() {
    setLoginState(false);
    navigateToPage('home');
}

// Navigation System
function initNavigation() {
    const navItems = document.querySelectorAll('[data-page]');
    const dropdown = document.getElementById('menuDropdown');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });

    // Dropdown functionality
    dropdown.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-item')) return;
        e.preventDefault();
        dropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// --- Persistent routing helpers ---
function saveLastRoute(route) {
    try {
        if (route) localStorage.setItem('lastRoute', route);
    } catch (e) {
        // ignore storage errors
    }
}

function setAttemptedRoute(route) {
    try {
        if (route) localStorage.setItem('attemptedRoute', route);
    } catch (e) {}
}

function clearAttemptedRoute() {
    try { localStorage.removeItem('attemptedRoute'); } catch (e) {}
}

function restoreLastRoute() {
    try {
        const last = localStorage.getItem('lastRoute');
        if (last && document.getElementById(last)) {
            if (protectedPages.includes(last) && !isLoggedIn()) {
                // remember what the user wanted so we can redirect after login
                setAttemptedRoute(last);
                navigateToPage('login');
            } else {
                navigateToPage(last);
            }
            return;
        }
    } catch (e) {
        // ignore
    }

    // fallback to the currentPage/default
    navigateToPage(currentPage || 'home');
}


function navigateToPage(pageName) {
    // Check if page requires login
    if (protectedPages.includes(pageName) && !isLoggedIn()) {
        // Redirect to login page
        setAttemptedRoute(pageName);
        navigateToPage('login');
        return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNavItem && !activeNavItem.classList.contains('dropdown-item')) {
        activeNavItem.classList.add('active');
    }

    // Close dropdown if open
    document.getElementById('menuDropdown').classList.remove('active');

    currentPage = pageName;

    // Persist the last successful route for reloads
    saveLastRoute(pageName);

    // Initialize page-specific functionality
    if (pageName === 'calendar') {
        renderCalendar();
    } else if (pageName === 'chatbot') {
        initChatbot();
    } else if (pageName === 'login') {
        initLogin();
    }
}

// Calendar System
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthHeader = document.getElementById('currentMonth');
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthHeader.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell header';
        cell.textContent = day;
        grid.appendChild(cell);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate calendar cells
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        if (cellDate.getMonth() !== currentDate.getMonth()) {
            cell.classList.add('other-month');
        }
        
        cell.innerHTML = `<div>${cellDate.getDate()}</div>`;
        
        // Add events for this date
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === cellDate.toDateString();
        });
        
        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = event.title;
            cell.appendChild(eventDiv);
        });
        
        // Add click handler
        cell.addEventListener('click', () => {
            openEventModal(cellDate);
        });
        
        grid.appendChild(cell);
    }
}

function initCalendar() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('addEventBtn').addEventListener('click', () => {
        openEventModal(new Date());
    });
}

// Event Modal System
function openEventModal(date) {
    const modal = document.getElementById('eventModal');
    const dateInput = document.getElementById('eventDate');
    
    dateInput.value = date.toISOString().split('T')[0];
    modal.classList.add('active');
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    document.getElementById('eventForm').reset();
}

function initModal() {
    document.getElementById('closeModal').addEventListener('click', closeEventModal);
    
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') {
            closeEventModal();
        }
    });
    
    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value;
        
        const newEvent = {
            id: Date.now(),
            title,
            date,
            time,
            description
        };
        
        events.push(newEvent);
        closeEventModal();
        renderCalendar();
    });
}

// Chatbot System
function initChatbot() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!chatInput.hasAttribute('data-initialized')) {
        chatInput.setAttribute('data-initialized', 'true');
        
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(userMessage);
    
    // Clear input
    chatInput.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        botMessage.innerHTML = `<p>I understand you're asking about "${message}". As an AI assistant, I can help you manage your schedule, suggest optimal meeting times, and provide time management tips. Would you like me to check your calendar for available time slots?</p>`;
        chatMessages.appendChild(botMessage);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Login System
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm.hasAttribute('data-initialized')) {
        loginForm.setAttribute('data-initialized', 'true');
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
}

function handleLogin() {
    // Get form values (not actually validated in this placeholder)
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const staySignedIn = document.getElementById('staySignedIn').checked;
    
    // Set login state based on "Stay signed in" preference
    setLoginState(true, staySignedIn);
    
    // Redirect to attempted route if present, otherwise home
    try {
        const attempted = localStorage.getItem('attemptedRoute');
        if (attempted && document.getElementById(attempted)) {
            clearAttemptedRoute();
            navigateToPage(attempted);
        } else {
            navigateToPage('home');
        }
    } catch (e) {
        navigateToPage('home');
    }
    
    // Clear form
    document.getElementById('loginForm').reset();
    // Reset checkbox to checked state
    document.getElementById('staySignedIn').checked = true;
}

// Social Login Placeholder Functions
function loginWithGoogle() {
    const staySignedIn = document.getElementById('staySignedIn').checked;
    setLoginState(true, staySignedIn);
    try {
        const attempted = localStorage.getItem('attemptedRoute');
        if (attempted && document.getElementById(attempted)) {
            clearAttemptedRoute();
            navigateToPage(attempted);
            return;
        }
    } catch (e) {}
    navigateToPage('home');
}

function loginWithFacebook() {
    const staySignedIn = document.getElementById('staySignedIn').checked;
    setLoginState(true, staySignedIn);
    try {
        const attempted = localStorage.getItem('attemptedRoute');
        if (attempted && document.getElementById(attempted)) {
            clearAttemptedRoute();
            navigateToPage(attempted);
            return;
        }
    } catch (e) {}
    navigateToPage('home');
}

function loginWithMicrosoft() {
    const staySignedIn = document.getElementById('staySignedIn').checked;
    setLoginState(true, staySignedIn);
    try {
        const attempted = localStorage.getItem('attemptedRoute');
        if (attempted && document.getElementById(attempted)) {
            clearAttemptedRoute();
            navigateToPage(attempted);
            return;
        }
    } catch (e) {}
    navigateToPage('home');
}

// Update calendar icon dates
function updateCalendarIconDate() {
    const currentDate = new Date();
    const dateStr = currentDate.getDate().toString();
    
    // Update both calendar icons
    const dateElements = document.querySelectorAll('#calendar-date, #feature-calendar-date');
    dateElements.forEach(element => {
        if (element) {
            element.textContent = dateStr;
        }
    });
}

// Initialize Application
function init() {
    initNavigation();
    initCalendar();
    initModal();
    
    // Initialize and update calendar icon date
    updateCalendarIconDate();
    // Update the date every day at midnight
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            updateCalendarIconDate();
        }
    }, 60000); // Check every minute
    
    // Restore last route (falls back to home/calendar as needed)
    restoreLastRoute();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);