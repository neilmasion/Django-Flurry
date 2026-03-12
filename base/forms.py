from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User, ContactMessage

class StudentRegistrationForm(UserCreationForm):
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)
    
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email', 'course', 'year_level')

class StudentLoginForm(forms.Form):
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={'autofocus': True, 'placeholder': 'neilmasion@example.com'})
    )
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter your password'})
    )

class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Juan dela Cruz'}),
            'email': forms.EmailInput(attrs={'placeholder': 'juan@example.com'}),
            'subject': forms.Select(choices=[
                ('', 'Select a topic...'),
                ('General Inquiry', 'General Inquiry'),
                ('Workshop / Event Question', 'Workshop / Event Question'),
                ('Partnership Proposal', 'Partnership Proposal'),
                ('Membership Question', 'Membership Question'),
                ('Other', 'Other'),
            ]),
            'message': forms.Textarea(attrs={'placeholder': 'Write your message here...'}),
        }