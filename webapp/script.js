// Initialize Telegram WebApp
let tg;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} catch (e) {
    console.log('Telegram WebApp not available (running outside Telegram)');
}

// State
let selectedDate = null;
let selectedTime = null;

// ============================================
// INITIALIZATION - Ensure content is visible
// ============================================
function initApp() {
    console.log('Initializing Web App...');

    // Ensure dashboard is visible
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        dashboard.style.display = 'flex';
        dashboard.style.opacity = '1';
        dashboard.style.visibility = 'visible';
        console.log('Dashboard initialized');
    }

    // Initialize Flatpickr
    initCalendar();
}

// Generate mock available times for demo
function getAvailableTimes(dateStr) {
    const times = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    return times.map(time => ({
        time: time,
        available: Math.random() > 0.3
    }));
}

// Initialize Flatpickr Calendar
function initCalendar() {
    const datepickerEl = document.getElementById('datepicker');
    if (!datepickerEl) {
        console.error('Datepicker element not found');
        return;
    }

    // Check if flatpickr is loaded
    if (typeof flatpickr === 'undefined') {
        console.log('Flatpickr not yet loaded, waiting...');
        setTimeout(initCalendar, 100);
        return;
    }

    flatpickr("#datepicker", {
        locale: {
            firstDayOfWeek: 1,
            weekdays: {
                shorthand: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
                longhand: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
            },
            months: {
                shorthand: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
                longhand: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
            }
        },
        dateFormat: "d.m.Y",
        minDate: "today",
        maxDate: new Date().fp_incr(30),
        disable: [
            function (date) {
                return date.getDay() === 0;
            }
        ],
        onChange: function (selectedDates, dateStr) {
            if (selectedDates.length > 0) {
                selectedDate = dateStr;
                selectedTime = null;
                showTimeSlots(dateStr);
                hideConfirmButton();
            }
        }
    });

    console.log('Flatpickr initialized');
}

// Show time slots for selected date
function showTimeSlots(dateStr) {
    const timeSlotsContainer = document.getElementById('time-slots');
    const timeSection = document.getElementById('time-section');

    if (!timeSlotsContainer || !timeSection) return;

    timeSlotsContainer.innerHTML = '';

    const times = getAvailableTimes(dateStr);

    times.forEach(slot => {
        const button = document.createElement('button');
        button.className = 'time-slot' + (slot.available ? '' : ' disabled');
        button.textContent = slot.time;

        if (slot.available) {
            button.addEventListener('click', () => selectTime(slot.time, button));
        }

        timeSlotsContainer.appendChild(button);
    });

    timeSection.style.display = 'block';
}

// Select time slot
function selectTime(time, button) {
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('selected');
    });

    button.classList.add('selected');
    selectedTime = time;

    showSelectedInfo();
    showConfirmButton();
}

// Show selected info
function showSelectedInfo() {
    const selectedInfo = document.getElementById('selected-info');
    const selectionDisplay = document.getElementById('selection-display');

    if (!selectedInfo || !selectionDisplay) return;

    selectionDisplay.textContent = `${selectedDate} в ${selectedTime}`;
    selectedInfo.style.display = 'block';
}

// Show confirm button
function showConfirmButton() {
    const confirmBtn = document.getElementById('confirm-btn');
    if (!confirmBtn) return;

    confirmBtn.style.display = 'block';

    confirmBtn.onclick = function () {
        if (selectedDate && selectedTime) {
            const data = JSON.stringify({
                date: selectedDate,
                time: selectedTime
            });

            if (tg && tg.sendData) {
                tg.sendData(data);
                tg.close();
            } else {
                console.log('Data to send:', data);
                alert('Выбрано: ' + selectedDate + ' в ' + selectedTime);
            }
        }
    };
}

// Hide confirm button
function hideConfirmButton() {
    const confirmBtn = document.getElementById('confirm-btn');
    const selectedInfo = document.getElementById('selected-info');

    if (confirmBtn) confirmBtn.style.display = 'none';
    if (selectedInfo) selectedInfo.style.display = 'none';
}

// ============================================
// LOAD EVENTS
// ============================================

// Load Flatpickr dynamically
const flatpickrScript = document.createElement('script');
flatpickrScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
flatpickrScript.onload = function () {
    console.log('Flatpickr script loaded');
};
document.head.appendChild(flatpickrScript);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

// Fallback: ensure visibility after short delay
window.addEventListener('load', function () {
    console.log('Window loaded');
    initApp();
    initChat();
});

// ============================================
// AI CHAT FUNCTIONALITY
// ============================================

function initChat() {
    const openChatBtn = document.getElementById('open-chat-btn');
    const chatBackBtn = document.getElementById('chat-back-btn');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');

    if (openChatBtn) {
        openChatBtn.addEventListener('click', openChat);
    }

    if (chatBackBtn) {
        chatBackBtn.addEventListener('click', closeChat);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    console.log('Chat initialized');
}

// Open chat view
function openChat() {
    const mainView = document.getElementById('main-view');
    const chatView = document.getElementById('chat-view');

    if (mainView) mainView.style.display = 'none';
    if (chatView) chatView.classList.remove('hidden');

    // Focus on input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        setTimeout(() => chatInput.focus(), 100);
    }
}

// Close chat view
function closeChat() {
    const mainView = document.getElementById('main-view');
    const chatView = document.getElementById('chat-view');

    if (chatView) chatView.classList.add('hidden');
    if (mainView) mainView.style.display = 'flex';
}

// Send message
function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatInput || !chatMessages) return;

    const messageText = chatInput.value.trim();
    if (!messageText) return;

    // Add user message
    addMessage(messageText, 'user');

    // Clear input
    chatInput.value = '';

    // Scroll to bottom
    scrollToBottom();

    // Show typing indicator
    showTypingIndicator();

    // Simulate AI response after delay
    setTimeout(() => {
        hideTypingIndicator();
        const aiResponse = getAIResponse(messageText);
        addMessage(aiResponse, 'ai');
        scrollToBottom();
    }, 1500);
}

// Add message to chat
function addMessage(text, type) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-ai';
    typingDiv.id = 'typing-indicator';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content typing-indicator';
    contentDiv.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);

    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Mock AI response
function getAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword matching for demo
    if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
        return 'Привет! 👋 Чем могу помочь? Вы можете спросить о записи на консультацию, ценах или режиме работы.';
    }

    if (lowerMessage.includes('цена') || lowerMessage.includes('стоимость') || lowerMessage.includes('сколько')) {
        return '💰 Стоимость консультации составляет 5000₽. Консультация длится 60 минут и проходит онлайн через Google Meet.';
    }

    if (lowerMessage.includes('запис') || lowerMessage.includes('время') || lowerMessage.includes('дата')) {
        return '📅 Для записи вернитесь на главный экран и выберите удобную дату в календаре. Доступны слоты с 10:00 до 18:00 (кроме воскресенья).';
    }

    if (lowerMessage.includes('как') && lowerMessage.includes('работа')) {
        return '💼 Консультация проходит онлайн через Google Meet. После записи и оплаты вы получите ссылку на видеовстречу.';
    }

    if (lowerMessage.includes('оплат') || lowerMessage.includes('платить')) {
        return '💳 После выбора времени вы получите реквизиты для оплаты. Отправьте скриншот оплаты боту — и запись будет подтверждена.';
    }

    if (lowerMessage.includes('отмен') || lowerMessage.includes('перенес')) {
        return '🔄 Для переноса или отмены записи свяжитесь с нами минимум за 24 часа до консультации.';
    }

    // Default response
    return 'Это демо-ответ. 🤖 Скоро здесь будет подключен настоящий ИИ. Пока вы можете спросить о ценах, записи или режиме работы.';
}
