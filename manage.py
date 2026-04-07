"""Django's command-line utility for administrative tasks."""
import os
import sys
import mimetypes
from dotenv import load_dotenv

mimetypes.add_type("application/javascript", ".js", True)


def main():
    """Run administrative tasks."""
    # Aggressive MIME override for Windows localhost
    mimetypes.init()
    mimetypes.types_map['.js'] = 'application/javascript'
    mimetypes.types_map['.mjs'] = 'application/javascript'
    mimetypes.add_type("application/javascript", ".js", True)
    mimetypes.add_type("application/javascript", ".mjs", True)

    load_dotenv()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flurry_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
