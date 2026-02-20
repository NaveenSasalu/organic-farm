from typing import TypeVar, Generic, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response wrapper."""
    success: bool = True
    data: T
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None


class MessageResponse(BaseModel):
    """Simple message response."""
    success: bool = True
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    success: bool = True
    items: List[T]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    total_pages: int = Field(alias="totalPages")

    class Config:
        populate_by_name = True


# Common response helpers
def success_response(data: Any, message: str = None) -> dict:
    """Create a standardized success response."""
    response = {"success": True, "data": data}
    if message:
        response["message"] = message
    return response


def error_response(error: str, detail: str = None) -> dict:
    """Create a standardized error response."""
    response = {"success": False, "error": error}
    if detail:
        response["detail"] = detail
    return response


def message_response(message: str) -> dict:
    """Create a simple message response."""
    return {"success": True, "message": message}


def paginated_response(
    items: list,
    total: int,
    page: int,
    page_size: int
) -> dict:
    """Create a paginated response."""
    return {
        "success": True,
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
    }
