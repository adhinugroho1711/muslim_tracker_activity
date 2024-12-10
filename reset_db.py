from app import app, db, User, bcrypt
import os
from config import get_config

def reset_database():
    # Load configuration based on environment
    env = os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(get_config(env))
    
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("Dropped all tables")

        # Create all tables
        db.create_all()
        print("Created all tables")

        # Create admin user
        admin = User(
            username='admin',
            email='admin@example.com',
            full_name='Administrator',
            student_number='admin',
            class_name='admin',
            is_admin=True,
            is_active=True
        )
        admin.password_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')

        # Create test user
        test_user = User(
            username='azizah',
            email='azizah@example.com',
            full_name='azizah nurmasari',
            student_number='123',
            class_name='3',
            is_admin=False,
            is_active=True
        )
        test_user.password_hash = bcrypt.generate_password_hash('azizah123').decode('utf-8')

        # Add users to database
        db.session.add(admin)
        db.session.add(test_user)
        db.session.commit()

        print("Created admin and test users")

if __name__ == '__main__':
    reset_database()
