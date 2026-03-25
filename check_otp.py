import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flurry_project.settings')
django.setup()

from base.models import User
from base.views import send_verification_email_logic
from django.test import RequestFactory

rf = RequestFactory()
request = rf.get('/')
request.session = {}

user = User.objects.create(username='testotp2', email='testotp2@example.com', password='password')

print("Sending email...")
try:
    res = send_verification_email_logic(user, request)
    print("Success:", res)
    print("Code on user:", user.email_verification_code)
except Exception as e:
    print("ERROR:", str(e))
