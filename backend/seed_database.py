"""
Database seed script to create demo users for the PhD Seminar Platform.

Run this script to populate the database with demo accounts:
    python seed_database.py

Demo accounts created:
- Admin: admin@seminar.com / admin123
- Dean: dean@seminar.com / dean123
- Coordinator: coordinator@seminar.com / coordinator123
- Faculty: faculty@seminar.com / faculty123
- PhD Candidate: student@seminar.com / student123
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.db.base import engine, SessionLocal, Base
from app.models.user import User
from app.core.security import get_password_hash


def seed_database():
    """Create demo users in the database."""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping seed.")
            return
        
        # Demo users data
        demo_users = [
            {
                "email": "admin@seminar.com",
                "password": "admin123",
                "first_name": "Admin",
                "last_name": "User",
                "role": "ADMIN",
                "department": "Administration",
                "phone": "+1234567890"
            },
            {
                "email": "dean@seminar.com",
                "password": "dean123",
                "first_name": "Dean",
                "last_name": "Office",
                "role": "DEAN",
                "department": "Dean's Office",
                "phone": "+1234567891"
            },
            {
                "email": "coordinator@seminar.com",
                "password": "coordinator123",
                "first_name": "Seminar",
                "last_name": "Coordinator",
                "role": "COORDINATOR",
                "department": "Academic Affairs",
                "phone": "+1234567892"
            },
            {
                "email": "faculty@seminar.com",
                "password": "faculty123",
                "first_name": "Faculty",
                "last_name": "Member",
                "role": "FACULTY",
                "department": "Computer Science",
                "phone": "+1234567893"
            },
            {
                "email": "student@seminar.com",
                "password": "student123",
                "first_name": "PhD",
                "last_name": "Candidate",
                "role": "PHD_CANDIDATE",
                "department": "Computer Science",
                "phone": "+1234567894"
            }
        ]
        
        # Create users
        for user_data in demo_users:
            password = user_data.pop("password")
            new_user = User(
                password_hash=get_password_hash(password),
                is_active=True,
                is_verified=True,
                **user_data
            )
            db.add(new_user)
            print(f"Created user: {user_data['email']} ({user_data['role']})")
        
        db.commit()
        print("\n✅ Database seeded successfully!")
        print("\nDemo accounts:")
        print("-" * 50)
        for user_data in demo_users:
            print(f"  {user_data['email']} / {user_data['password'].replace('123', '***')}123 ({user_data['role']})")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
