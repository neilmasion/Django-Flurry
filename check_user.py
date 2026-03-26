import os
import django
from django.conf import settings

if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flurry_project.settings')
    django.setup()

from base.models import User
from django.db.models import Count

def find_duplicate_tokens():
    duplicates = User.objects.values('email_verification_token').annotate(token_count=Count('id')).filter(token_count__gt=1)
    if duplicates.exists():
        print("Duplicate tokens found:")
        for d in duplicates:
            token = d['email_verification_token']
            count = d['token_count']
            print(f"Token: {token}, Count: {count}")
            users = User.objects.filter(email_verification_token=token)
            for u in users:
                print(f"  - User: {u.email} (ID: {u.id})")
    else:
        print("No duplicate tokens found.")

if __name__ == "__main__":
    find_duplicate_tokens()
