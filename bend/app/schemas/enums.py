from enum import Enum


class OrderStatus(str, Enum):
    """Valid order statuses."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PACKED = "packed"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class UserRole(str, Enum):
    """Valid user roles."""
    ADMIN = "admin"
    FARMER = "farmer"


class ProductUnit(str, Enum):
    """Common product units."""
    KG = "kg"
    GRAM = "g"
    BUNCH = "bunch"
    PIECE = "piece"
    DOZEN = "dozen"
    LITRE = "litre"
    ML = "ml"
