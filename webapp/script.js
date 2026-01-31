// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// State
let selectedDate = null;
let selectedTime = null;

// Mock available slots (in production, fetch from bot or pass via URL)
// Format: { "DD.MM.YYYY": ["HH:MM", "HH:MM", ...] }
const availableSlots = {
    // These will be populated based on date selection
    // For demo, we'll generate some slots
};

// Generate mock available times for demo
function getAvailableTimes(dateStr) {
    // In production, this would come from the bot/database
    // For now, return mock times
    const times = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    // Randomly disable some slots to simulate booked times
    return times.map(time => ({
        time: time,
        available: Math.random() > 0.3 // 70% chance of being available
    }));
}

// Initialize Flatpickr Calendar
document.addEventListener('DOMContentLoaded', function () {
    const datepicker = flatpickr("#datepicker", {
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
        maxDate: new Date().fp_incr(30), // 30 days ahead
        disable: [
            function (date) {
                // Disable Sundays
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
});

// Show time slots for selected date
function showTimeSlots(dateStr) {
    const timeSlotsContainer = document.getElementById('time-slots');
    const timeSection = document.getElementById('time-section');

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
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mark as selected
    button.classList.add('selected');
    selectedTime = time;

    // Show selection and confirm button
    showSelectedInfo();
    showConfirmButton();
}

// Show selected info
function showSelectedInfo() {
    const selectedInfo = document.getElementById('selected-info');
    const selectionDisplay = document.getElementById('selection-display');

    selectionDisplay.textContent = `${selectedDate} в ${selectedTime}`;
    selectedInfo.style.display = 'block';
}

// Show confirm button
function showConfirmButton() {
    const confirmBtn = document.getElementById('confirm-btn');
    confirmBtn.style.display = 'block';

    confirmBtn.onclick = function () {
        if (selectedDate && selectedTime) {
            // Send data back to Telegram bot
            const data = JSON.stringify({
                date: selectedDate,
                time: selectedTime
            });

            tg.sendData(data);

            // Close the Web App
            tg.close();
        }
    };
}

// Hide confirm button
function hideConfirmButton() {
    const confirmBtn = document.getElementById('confirm-btn');
    const selectedInfo = document.getElementById('selected-info');

    confirmBtn.style.display = 'none';
    selectedInfo.style.display = 'none';
}

// Load Flatpickr
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
script.onload = function () {
    console.log('Flatpickr loaded');
};
document.head.appendChild(script);
