from base.forms import ContactForm
f = ContactForm({'name': 'Test', 'email': 'test@example.com', 'subject': 'Workshops', 'message': 'Hello'})
print("Form valid?", f.is_valid())
if not f.is_valid(): print(f.errors)
