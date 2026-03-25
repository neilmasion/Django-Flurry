import os
import django
import uuid
from django.conf import settings

import sys
# Setup Django environment
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flurry_project.settings')
    sys.path.append(os.getcwd())
    django.setup()

from base.models import User

def fix_tokens():
    print("Starting token regeneration...")
    users = User.objects.all()
    count = 0
    for user in users:
        user.email_verification_token = uuid.uuid4()
        user.save()
        count += 1
    print(f"Successfully regenerated tokens for {count} users.")

if __name__ == "__main__":
    fix_tokens()
