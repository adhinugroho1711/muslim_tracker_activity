from .config import DevelopmentConfig, ProductionConfig, TestingConfig

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(env='default'):
    return config.get(env, config['default'])
