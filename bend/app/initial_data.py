import asyncio
import logging
# We import the pre-configured engine and Base from your database core
from app.core.database import Base, engine, AsyncSessionLocal 
from sqlalchemy import select
from app.models.user import User 
from app.models.product import Product, Farmer 
from app.models.order import Order
from app.core.security import get_password_hash
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_initial_data():
    logger.info("🚀 Starting data initialization...")

    # 1. Use the GLOBAL engine imported from app.core.database
    async with engine.begin() as conn:
        # This will look at all models imported above and create tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified.")

    # 2. Use the GLOBAL AsyncSessionLocal factory imported from app.core.database
    # Do NOT re-define 'engine' here, or it will cause the UnboundLocalError
    async with AsyncSessionLocal() as session:
        try:
            # 3. Start a transaction
            async with session.begin():
                                
                # --- CHECK FOR EXISTING ADMIN ---
                admin_email = "admin@kaayaka.in"
                result = await session.execute(
                    select(User).where(User.email == admin_email)
                )
                admin_user = result.scalar_one_or_none()

                if not admin_user:
                    logger.info(f"Creating initial admin user: {admin_email}")
                    
                    # Create the first Farmer profile
                    first_farmer = Farmer(
                        name="Community Admin",
                        location="Main Office",
                        bio="System administrator and community manager."
                    )
                    session.add(first_farmer)
                    await session.flush() # Sync with DB to get first_farmer.id

                    # Create the Admin User account
                    new_admin = User(
                        email=admin_email,
                        hashed_password=get_password_hash("AdminPass123!"), 
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
        # Note: In a long-running app, we don't usually dispose the global engine here,
        # but for a one-time init script, it is fine.
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_initial_data())