from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from datetime import datetime

from bot.database import requests as rq
from bot.keyboards import inline
from bot.states.states import AdminStates
from bot.config import ADMIN_ID

router = Router()

@router.message(Command("admin"))
async def cmd_admin(message: Message):
    if message.from_user.id != ADMIN_ID:
        return  # Игнорируем не-админов
    await message.answer("🔧 Панель администратора", reply_markup=inline.admin_menu())

@router.callback_query(F.data == "add_slot")
async def add_slot_start(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id != ADMIN_ID: return
    await state.set_state(AdminStates.add_slot)
    await callback.message.answer("Введите дату и время (ДД.ММ ЧЧ:ММ):")
    await callback.answer()

@router.message(AdminStates.add_slot)
async def add_slot_process(message: Message, state: FSMContext):
    if message.from_user.id != ADMIN_ID: return
    try:
        # Используем текущий год
        current_year = datetime.now().year
        dt_str = f"{message.text} {current_year}"
        dt = datetime.strptime(dt_str, "%d.%m %H:%M %Y")
        
        await rq.add_slot(dt)
        await message.answer(f"✅ Слот добавлен: {dt.strftime('%d.%m %H:%M')}")
        await state.clear()
    except ValueError:
        await message.answer("❌ Неверный формат. Используйте ДД.ММ ЧЧ:ММ (например, 25.12 14:00)")

@router.callback_query(F.data == "view_schedule")
async def view_schedule(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID: return
    slots = await rq.get_all_slots()
    if not slots:
        await callback.message.answer("📅 Расписание пусто.")
        await callback.answer()
        return
    text = "📅 Расписание:\n\n"
    for s in slots:
        status = "🔴 Занят" if s.is_booked else "🟢 Свободен"
        text += f"{s.time_value.strftime('%d.%m %H:%M')} — {status}\n"
    await callback.message.answer(text)
    await callback.answer()

@router.callback_query(F.data.startswith("approve_"))
async def approve_booking(callback: CallbackQuery, bot: Bot):
    if callback.from_user.id != ADMIN_ID: return
    
    _, slot_id, user_id = callback.data.split("_")
    slot_id = int(slot_id)
    user_id = int(user_id)
    
    await rq.book_slot(slot_id, user_id, "ConfirmedByAdmin")
    
    await callback.message.edit_caption(caption=f"{callback.message.caption}\n\n✅ ПОДТВЕРЖДЕНО")
    
    try:
        await bot.send_message(user_id, "✅ Ваша запись подтверждена! Ждём вас здесь: [Ссылка на встречу]")
    except:
        await callback.message.answer(f"Не удалось уведомить пользователя {user_id}")

@router.callback_query(F.data.startswith("reject_"))
async def reject_booking(callback: CallbackQuery, bot: Bot):
    if callback.from_user.id != ADMIN_ID: return
    
    _, slot_id, user_id = callback.data.split("_")
    
    await callback.message.edit_caption(caption=f"{callback.message.caption}\n\n❌ ОТКЛОНЕНО")
    
    try:
        await bot.send_message(int(user_id), "❌ Ваша заявка отклонена. Свяжитесь с администратором, если это ошибка.")
    except:
        pass
