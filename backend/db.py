from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class Database:
    client: AsyncIOMotorClient = None
    
    def __init__(self):
        self.client = None
        
    async def connect_to_database(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")
        
    async def close_database_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")
    
    def get_database(self):
        """Get database instance"""
        return self.client[settings.DATABASE_NAME]
    
    def get_collection(self, collection_name: str):
        """Get collection instance"""
        db = self.get_database()
        return db[collection_name]

db = Database()

async def get_db():
    """Dependency for getting database"""
    return db.get_database()