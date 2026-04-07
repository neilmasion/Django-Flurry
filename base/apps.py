from django.apps import AppConfig
import mimetypes

class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base'

    def ready(self):
        mimetypes.add_type("application/javascript", ".js", True)
        mimetypes.add_type("text/css", ".css", True)
        mimetypes.add_type("text/javascript", ".js", True)