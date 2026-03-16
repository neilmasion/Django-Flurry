from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User, ContactMessage

DISPOSABLE_DOMAINS = [
    'mailinator.com', 'tempmail.com', '10minutemail.com', 
    'guerrillamail.com', 'sharklasers.com', 'getnada.com',
    'dispostable.com', 'yopmail.com', 'trashmail.com'
]

class StudentRegistrationForm(UserCreationForm):
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)
    
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email', 'course', 'year_level')

    def clean_email(self):
        email = self.cleaned_data.get('email').lower()
        domain = email.split('@')[-1]
        
        if domain in DISPOSABLE_DOMAINS:
            raise forms.ValidationError("Disposable or temporary email addresses are not allowed. Please use a valid email service.")
            
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("A user with this email already exists.")
        return email

    def clean_username(self):
        # Override to bypass UserCreationForm's built-in uniqueness check
        return self.cleaned_data.get('username')

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
        fields = ['subject', 'message']
        widgets = {
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