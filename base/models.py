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

class ContactMessage(models.Model):
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