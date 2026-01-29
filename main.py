import asyncio
import logging
from aiogram import Bot, Dispatcher

from bot.config import BOT_TOKEN
from bot.database.engine import async_main
from bot.handlers import user_router, admin_router

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Initialize Database
    await async_main()
    
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    
    dp.include_router(admin_router.router) # Admin router first to catch specific filters
    dp.include_router(user_router.router)
    
    print("Bot is starting...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bot stopped")
