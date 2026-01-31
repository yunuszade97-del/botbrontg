import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import BotCommand

from bot.config import BOT_TOKEN
from bot.database.engine import async_main
from bot.handlers import user_router, admin_router


async def set_main_menu(bot: Bot):
    """Устанавливает команды бота для меню"""
    commands = [
        BotCommand(command="start", description="🏠 В начало / Перезапуск"),
        BotCommand(command="book", description="📅 Записаться на консультацию"),
        BotCommand(command="help", description="🆘 Помощь"),
    ]
    await bot.set_my_commands(commands)
    logging.info("Main menu commands set successfully")


async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Initialize Database
    await async_main()
    
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    
    dp.include_router(admin_router.router)  # Admin router first to catch specific filters
    dp.include_router(user_router.router)
    
    # Set menu commands
    await set_main_menu(bot)
    
    print("Bot is starting...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bot stopped")
