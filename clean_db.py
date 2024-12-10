from app import app, db
import os
from config import get_config
from sqlalchemy import text

def clean_database():
    # Load configuration based on environment
    env = os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(get_config(env))
    
    with app.app_context():
        try:
            # Drop unused tables using raw SQL
            # We use text() to create raw SQL statements
            db.session.execute(text('DROP TABLE IF EXISTS activity'))
            print("Dropped activity table")
            
            db.session.execute(text('DROP TABLE IF EXISTS "user"'))
            print('Dropped user table')
            
            db.session.execute(text('DROP TABLE IF EXISTS activity_stats'))
            print('Dropped activity_stats table')
            
            db.session.commit()
            print("Database cleaned successfully")
            
        except Exception as e:
            print(f"Error cleaning database: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    clean_database()
