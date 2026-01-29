from sqlalchemy import BigInteger, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String, nullable=True)
    full_name: Mapped[str] = mapped_column(String, nullable=True)

class Slot(Base):
    __tablename__ = 'slots'

    id: Mapped[int] = mapped_column(primary_key=True)
    datetime: Mapped[str] = mapped_column(String)  # Storing as string "DD.MM HH:MM" for simplicity, or DateTime object
    # For better sorting/filtering, actual DateTime is better. But user asked for input "DD.MM HH:MM".
    # Let's store as DateTime for correctness, but input/output will be formatted.
    # Actually, to keep it simple and match "DD.MM HH:MM" exactly as requested without year issues, string is safest unless we assume current year.
    # Let's use DateTime and assume current year.
    
    # Re-reading: "Input format: DD.MM HH:MM".
    # I will use DateTime.
    
    time_value: Mapped[object] = mapped_column(DateTime) 
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=True)
    proof_image_id: Mapped[str] = mapped_column(String, nullable=True)
    
    user: Mapped["User"] = relationship(lazy='selectin')
