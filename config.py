import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

class ProductionConfig(Config):
    DEBUG = False
    # Build database URI from environment variables
    def __init__(self):
        super().__init__()
        db_uri = os.environ.get('DATABASE_URL')
        
        # Add SSL parameters if configured
        ssl_params = []
        if os.environ.get('SSL_MODE'):
            ssl_params.append(f"sslmode={os.environ.get('SSL_MODE')}")
        if os.environ.get('SSL_CERT'):
            ssl_params.append(f"sslcert={os.environ.get('SSL_CERT')}")
        if os.environ.get('SSL_KEY'):
            ssl_params.append(f"sslkey={os.environ.get('SSL_KEY')}")
        if os.environ.get('SSL_ROOT_CERT'):
            ssl_params.append(f"sslrootcert={os.environ.get('SSL_ROOT_CERT')}")
        
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
