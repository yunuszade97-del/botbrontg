from aiogram.fsm.state import StatesGroup, State

class Booking(StatesGroup):
    payment = State()

class AdminStates(StatesGroup):
    add_slot = State()
