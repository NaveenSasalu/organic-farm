from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey
#from sqlalchemy.orm import Mapped, mapped_column
# from app.db.base_class import Base

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="farmer") # "admin" or "farmer"
    
    # Link a user to a specific Farmer profile if they aren't an admin
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), nullable=True)