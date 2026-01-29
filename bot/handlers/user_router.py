from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext

from bot.database import requests as rq
from bot.keyboards import inline
from bot.states.states import Booking
from bot.config import ADMIN_ID

router = Router()

# Текст "Обо мне" - можно отредактировать
ABOUT_TEXT = """👤 <b>Обо мне</b>

Я — профессиональный консультант с многолетним опытом работы.

🎓 Образование: [Ваше образование]
💼 Опыт: [Ваш опыт]
🏆 Достижения: [Ваши достижения]

📍 Работаю только онлайн через Google Meet.
💰 Стоимость консультации: 5000₽

По всем вопросам пишите в личные сообщения."""

@router.message(CommandStart())
async def cmd_start(message: Message):
    await rq.add_user(message.from_user.id, message.from_user.username, message.from_user.full_name)
    await message.answer_photo(
        photo="https://placehold.co/800x500/FF5733/ffffff.png?text=Добро+пожаловать!",
        caption="Добро пожаловать! Я консультирую только ОНЛАЙН.\n"
                "Платформа: Google Meet\n"
                "Стоимость: 5000₽\n"
                "Чтобы записаться, нажмите кнопку ниже.",
        reply_markup=inline.main_menu()
    )

@router.callback_query(F.data == "main_menu")
async def back_to_main_menu(callback: CallbackQuery, state: FSMContext):
    # Очищаем состояние если было
    await state.clear()
    await callback.message.answer_photo(
        photo="https://placehold.co/800x500/FF5733/ffffff.png?text=Добро+пожаловать!",
        caption="Добро пожаловать! Я консультирую только ОНЛАЙН.\n"
                "Платформа: Google Meet\n"
                "Стоимость: 5000₽\n"
                "Чтобы записаться, нажмите кнопку ниже.",
        reply_markup=inline.main_menu()
    )
    await callback.answer()

@router.callback_query(F.data == "about_me")
async def about_me(callback: CallbackQuery):
    from aiogram.types import InputMediaPhoto
    
    # Сначала отправляем текст
    await callback.message.answer(
        ABOUT_TEXT,
        parse_mode="HTML"
    )
    
    # Затем отправляем две фотографии-заглушки с кнопкой под ними
    media = [
        InputMediaPhoto(media="https://placehold.co/600x400/2563eb/ffffff.png?text=Фото+1"),
        InputMediaPhoto(media="https://placehold.co/600x400/16a34a/ffffff.png?text=Фото+2")
    ]
    await callback.message.answer_media_group(media=media)
    
    # Кнопка "Главное меню" отдельным сообщением
    await callback.message.answer("⬇️", reply_markup=inline.back_to_menu())
    await callback.answer()

# Текст FAQ - можно отредактировать
FAQ_TEXT = """❓ <b>Часто задаваемые вопросы</b>

<b>1. Как проходит консультация?</b>
Консультация проходит онлайн через Google Meet. Вы получите ссылку после подтверждения записи.

<b>2. Сколько длится консультация?</b>
Стандартная консультация длится 60 минут.

<b>3. Как оплатить?</b>
После выбора времени вы получите реквизиты для оплаты. Отправьте скриншот — и запись будет подтверждена.

<b>4. Можно ли перенести запись?</b>
Да, свяжитесь со мной минимум за 24 часа до консультации.

<b>5. Что если у меня проблемы с подключением?</b>
Напишите мне — мы решим вопрос или перенесём встречу."""

@router.callback_query(F.data == "faq")
async def faq(callback: CallbackQuery):
    await callback.message.answer(
        FAQ_TEXT,
        parse_mode="HTML",
        reply_markup=inline.back_to_menu()
    )
    await callback.answer()


@router.callback_query(F.data == "book_consultation")
async def book_consultation(callback: CallbackQuery):
    slots = await rq.get_available_slots()
    if not slots:
        await callback.answer("Нет доступных слотов.", show_alert=True)
        return
    await callback.message.answer("Выберите удобное время:", reply_markup=inline.slots_kb(slots))
    await callback.answer()

@router.callback_query(F.data.startswith("slot_"))
async def select_slot(callback: CallbackQuery, state: FSMContext):
    slot_id = int(callback.data.split("_")[1])
    # Проверяем, свободен ли слот (защита от гонки)
    slot = await rq.get_slot(slot_id)
    if not slot or slot.is_booked:
        await callback.answer("Слот уже занят.", show_alert=True)
        return

    await state.update_data(slot_id=slot_id)
    await state.set_state(Booking.payment)
    await callback.message.edit_text(
        f"Вы выбрали: {slot.time_value.strftime('%d.%m %H:%M')}.\n"
        "Оплатите по ссылке: [Ссылка на оплату].\n"
        "Отправьте скриншот оплаты для подтверждения."
    )

@router.message(Booking.payment, F.photo)
async def payment_proof(message: Message, state: FSMContext, bot: Bot):
    data = await state.get_data()
    slot_id = data.get("slot_id")
    slot = await rq.get_slot(slot_id)
    
    if not slot or slot.is_booked:
        await message.answer("Ошибка: этот слот больше недоступен.")
        await state.clear()
        return

    photo_id = message.photo[-1].file_id
    
    # Уведомляем админа
    try:
        await bot.send_photo(
            chat_id=ADMIN_ID,
            photo=photo_id,
            caption=f"🆕 Новая заявка на бронирование!\n"
                    f"Пользователь: @{message.from_user.username} (ID: {message.from_user.id})\n"
                    f"Слот: {slot.time_value.strftime('%d.%m %H:%M')}\n"
                    f"Подтвердить?",
            reply_markup=inline.admin_approval(slot_id, message.from_user.id)
        )
    except Exception as e:
        await message.answer("Ошибка при отправке админу. Попробуйте позже.")
        print(f"Ошибка отправки админу: {e}")
        return

    await message.answer("✅ Скриншот получен! Ожидайте подтверждения от администратора.", 
                        reply_markup=inline.back_to_menu())
    await state.clear()

@router.message(Booking.payment)
async def payment_proof_invalid(message: Message):
    await message.answer("Пожалуйста, отправьте изображение (скриншот оплаты).")
