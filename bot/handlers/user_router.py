from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext

from bot.database import requests as rq
from bot.keyboards import inline
from bot.states.states import Booking
from bot.config import ADMIN_ID

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    await rq.add_user(message.from_user.id, message.from_user.username, message.from_user.full_name)
    await message.answer(
        "Welcome! I only consult ONLINE.\n"
        "Platform: Google Meet\n"
        "Price: $100\n"
        "To book, click below.",
        reply_markup=inline.main_menu()
    )

@router.callback_query(F.data == "book_consultation")
async def book_consultation(callback: CallbackQuery):
    slots = await rq.get_available_slots()
    if not slots:
        await callback.answer("No slots available currently.", show_alert=True)
        return
    await callback.message.edit_text("Select a time slot:", reply_markup=inline.slots_kb(slots))

@router.callback_query(F.data.startswith("slot_"))
async def select_slot(callback: CallbackQuery, state: FSMContext):
    slot_id = int(callback.data.split("_")[1])
    # Check if slot is still available (concurrency check)
    slot = await rq.get_slot(slot_id)
    if not slot or slot.is_booked:
        await callback.answer("Slot already taken or invalid.", show_alert=True)
        return

    await state.update_data(slot_id=slot_id)
    await state.set_state(Booking.payment)
    await callback.message.edit_text(
        f"You selected {slot.time_value.strftime('%d.%m %H:%M')}.\n"
        "Please pay via [Stripe Link/Card].\n"
        "Send a screenshot to confirm."
    )

@router.message(Booking.payment, F.photo)
async def payment_proof(message: Message, state: FSMContext, bot: Bot):
    data = await state.get_data()
    slot_id = data.get("slot_id")
    slot = await rq.get_slot(slot_id)
    
    if not slot or slot.is_booked:
        await message.answer("Error: This slot is no longer available.")
        await state.clear()
        return

    photo_id = message.photo[-1].file_id
    
    # Notify Admin
    try:
        await bot.send_photo(
            chat_id=ADMIN_ID,
            photo=photo_id,
            caption=f"New Booking Request!\nUser: @{message.from_user.username} (ID: {message.from_user.id})\nSlot: {slot.time_value.strftime('%d.%m %H:%M')}\nApprove?",
            reply_markup=inline.admin_approval(slot_id, message.from_user.id)
        )
    except Exception as e:
        await message.answer("Error notifying admin. Please try again later.")
        print(f"Error sending to admin: {e}") # Log this
        return

    await message.answer("Payment proof received! Waiting for admin approval.")
    await state.clear()

@router.message(Booking.payment)
async def payment_proof_invalid(message: Message):
    await message.answer("Please send an image (screenshot/photo).")
