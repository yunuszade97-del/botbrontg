from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

# URL для Web App календаря (замените на свой GitHub Pages URL после деплоя)
WEBAPP_URL = "https://yunuszade97-del.github.io/botbrontg/webapp/"

def main_menu():
    kb = InlineKeyboardBuilder()
    # Кнопка с Web App для записи
    kb.button(
        text="📅 Записаться на консультацию", 
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    kb.button(text="🌐 Перейти на сайт", url="https://qr.yapomogu.pro/?doctor_id=627955&clinic_token=$2y$10$R9/Ai87oBXywtpRb.gVn6.jDFjk0zW1TO.5jFVzEo5rJHqcLGJtGm")
    kb.adjust(1)  # По одной кнопке в ряд
    return kb.as_markup()

def back_to_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="🏠 Главное меню", callback_data="main_menu")
    return kb.as_markup()

def slots_kb(slots):
    kb = InlineKeyboardBuilder()
    for slot in slots:
        # Форматируем дату красиво
        date_str = slot.time_value.strftime("%d.%m %H:%M")
        kb.button(text=date_str, callback_data=f"slot_{slot.id}")
    kb.adjust(2)
    kb.row()  # Новый ряд
    kb.button(text="🏠 Главное меню", callback_data="main_menu")
    return kb.as_markup()

def admin_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="➕ Добавить слот", callback_data="add_slot")
    kb.button(text="👀 Посмотреть расписание", callback_data="view_schedule")
    return kb.as_markup()

def admin_approval(slot_id, user_id):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Подтвердить", callback_data=f"approve_{slot_id}_{user_id}")
    kb.button(text="❌ Отклонить", callback_data=f"reject_{slot_id}_{user_id}")
    return kb.as_markup()
