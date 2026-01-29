from bot.database.models import User, Slot
from bot.database.engine import async_session
from sqlalchemy import select, update
from datetime import datetime

async def add_user(tg_id, username, full_name):
    async with async_session() as session:
        user = await session.scalar(select(User).where(User.id == tg_id))
        
        if not user:
            session.add(User(id=tg_id, username=username, full_name=full_name))
            await session.commit()

async def add_slot(time_value: datetime):
    async with async_session() as session:
        session.add(Slot(time_value=time_value))
        await session.commit()

async def get_available_slots():
    async with async_session() as session:
        result = await session.execute(select(Slot).where(Slot.is_booked == False).order_by(Slot.time_value))
        return result.scalars().all()

async def get_slot(slot_id):
    async with async_session() as session:
        return await session.scalar(select(Slot).where(Slot.id == slot_id))

async def book_slot(slot_id, user_id, proof_image_id):
    async with async_session() as session:
        await session.execute(update(Slot).where(Slot.id == slot_id).values(is_booked=True, user_id=user_id, proof_image_id=proof_image_id))
        await session.commit()

async def get_all_slots():
    async with async_session() as session:
        result = await session.execute(select(Slot).order_by(Slot.time_value))
        return result.scalars().all()
        
async def reject_slot(slot_id):
     async with async_session() as session:
        # Reset the slot
        await session.execute(update(Slot).where(Slot.id == slot_id).values(is_booked=False, user_id=None, proof_image_id=None))
        await session.commit()
