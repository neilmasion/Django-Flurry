import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    COURSE_CHOICES = [
        ('IT', 'Information Technology (IT)'),
        ('CS', 'Computer Science (CS)'),
        ('Other', 'Other'),
    ]
    YEAR_CHOICES = [
        ('1st', '1st Year'),
        ('2nd', '2nd Year'),
        ('3rd', '3rd Year'),
        ('4th', '4th Year'),
    ]
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('officer', 'Officer'),
        ('admin', 'Admin'),
    ]
    course = models.CharField(max_length=50, choices=COURSE_CHOICES, blank=True, null=True)
    year_level = models.CharField(max_length=20, choices=YEAR_CHOICES, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    email = models.EmailField(unique=True)
    
    # Allow duplicate usernames by making email the primary identifier
    username = models.CharField(max_length=150, unique=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    # Email Verification Fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # Username edit cooldown
    last_username_update = models.DateTimeField(null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True, null=True)

class ContactMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_messages', null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"

class MemberStats(models.Model):
    members = models.CharField(max_length=50, default="120+")
    workshops = models.CharField(max_length=50, default="30+")
    certs_earned = models.CharField(max_length=50, default="50+")
    
    class Meta:
        verbose_name_plural = "Member Stats"

    def __str__(self):
        return "Community Stats"

class Event(models.Model):
    TYPE_CHOICES = [
        ('featured', 'Featured'),
        ('workshop', 'Workshop'),
        ('talk', 'Tech Talk'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField()
    day = models.CharField(max_length=2)
    month = models.CharField(max_length=3)
    time_range = models.CharField(max_length=100) 
    location = models.CharField(max_length=200)
    spots_left = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='workshop')
    is_featured = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title

class WorkshopCatalogItem(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon_class = models.CharField(max_length=100) 
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    category = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    attendance_count = models.IntegerField()
    
    def __str__(self):
        return self.title

class Testimonial(models.Model):
    quote = models.TextField()
    author_name = models.CharField(max_length=100)
    author_role = models.CharField(max_length=200)
    author_initials = models.CharField(max_length=5)
    is_approved = models.BooleanField(default=False)
    
    def __str__(self):
        return self.author_name

class OfficerApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ]
    DEPARTMENT_CHOICES = [
        ('tech', 'Technical'),
        ('marketing', 'Marketing & Creatives'),
        ('logistics_ops', 'Logistics & Operations'),
        ('finance', 'Finance'),
        ('relations', 'Relations'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='officer_applications')
    reason = models.TextField()
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='tech')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.department} - {self.status}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"

class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} enrolled in {self.event.title}"