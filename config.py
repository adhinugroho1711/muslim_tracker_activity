import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    # PostgreSQL configuration
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'tracker_muslim')
    
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

class ProductionConfig(Config):
    DEBUG = False
    # Use environment variables for production
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'tracker_muslim')
    
    # SSL configuration
    SSL_MODE = os.environ.get('SSL_MODE', 'verify-full')
    SSL_CERT = os.environ.get('SSL_CERT', None)
    SSL_KEY = os.environ.get('SSL_KEY', None)
    SSL_ROOT_CERT = os.environ.get('SSL_ROOT_CERT', None)
    
    # Build the database URI with SSL parameters if configured
    def __init__(self):
        super().__init__()
        db_uri = f'postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}'
        
        # Add SSL parameters if configured
        ssl_params = []
        if self.SSL_MODE:
            ssl_params.append(f'sslmode={self.SSL_MODE}')
        if self.SSL_CERT:
            ssl_params.append(f'sslcert={self.SSL_CERT}')
        if self.SSL_KEY:
            ssl_params.append(f'sslkey={self.SSL_KEY}')
        if self.SSL_ROOT_CERT:
            ssl_params.append(f'sslrootcert={self.SSL_ROOT_CERT}')
        
        if ssl_params:
            db_uri += '?' + '&'.join(ssl_params)
        
        self.SQLALCHEMY_DATABASE_URI = db_uri

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name):
    return config.get(config_name) or config['default']
