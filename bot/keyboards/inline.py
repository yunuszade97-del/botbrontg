from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

def main_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="📅 Book Consultation", callback_data="book_consultation")
    return kb.as_markup()

def slots_kb(slots):
    kb = InlineKeyboardBuilder()
    for slot in slots:
        # Format datetime nicely
        date_str = slot.time_value.strftime("%d.%m %H:%M")
        kb.button(text=date_str, callback_data=f"slot_{slot.id}")
    kb.adjust(2)
    return kb.as_markup()

def admin_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="➕ Add Slot", callback_data="add_slot")
    kb.button(text="👀 View Schedule", callback_data="view_schedule")
    return kb.as_markup()

def admin_approval(slot_id, user_id):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Approve", callback_data=f"approve_{slot_id}_{user_id}")
    kb.button(text="❌ Reject", callback_data=f"reject_{slot_id}_{user_id}")
    return kb.as_markup()
