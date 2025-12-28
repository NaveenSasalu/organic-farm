import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models.user import User
from app.models.product import Farmer
from app.core.security import get_password_hash
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_initial_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        try:
            # 1. Start a transaction
            async with session.begin():
                # --- CHECK FOR EXISTING ADMIN ---
                admin_email = "admin@kaayaka.in"
                result = await session.execute(
                    select(User).where(User.email == admin_email)
                )
                admin_user = result.scalar_one_or_none()

                if not admin_user:
                    logger.info(f"Creating initial admin user: {admin_email}")
                    
                    # Create the first Farmer profile (Admin can also be a farmer)
                    first_farmer = Farmer(
                        name="Community Admin",
                        location="Main Office",
                        bio="System administrator and community manager."
                    )
                    session.add(first_farmer)
                    await session.flush() # Get farmer.id

                    # Create the Admin User account
                    new_admin = User(
                        email=admin_email,
                        hashed_password=get_password_hash("AdminPass123!"), # Change this!
                        role="admin",
                        farmer_id=first_farmer.id
                    )
                    session.add(new_admin)
                    logger.info("✅ Admin user and Farmer profile created.")
                else:
                    logger.info("⏭️ Admin user already exists. Skipping.")

        except Exception as e:
            logger.error(f"❌ Error creating initial data: {e}")
            raise e
        finally:
            await engine.dispose()

if __name__ == "__main__":
    logger.info("🚀 Starting data initialization...")
    asyncio.run(create_initial_data())