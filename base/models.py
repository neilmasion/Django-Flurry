import uuid
import re
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

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
    DEPARTMENT_CHOICES = [
        ('captain', 'Captain'),
        ('tech', 'Technical'),
        ('marketing', 'Marketing & Creatives'),
        ('logistics_ops', 'Logistics & Operations'),
        ('finance', 'Finance'),
        ('relations', 'Relations'),
    ]
    POSITION_CHOICES = [
        ('captain', 'Captain'),
        ('secretary', 'Secretary'),
        ('asst_secretary', 'Assistant Secretary'),
        ('chief_tech', 'Chief of Technical'),
        ('cloud_solution', 'Cloud Solution Officer'),
        ('tech_content', 'Technical Content Officer'),
        ('buildhers_ambassador', 'BuildHers+ Ambassador'),
        ('chief_marketing', 'Chief of Marketing & Creatives'),
        ('graphic_multimedia', 'Graphic Multimedia Officer'),
        ('social_media', 'Social Media Content Officer'),
        ('chief_relations', 'Chief of Relations'),
        ('hr', 'Human Resource Officer'),
        ('membership', 'Membership Officer'),
        ('chief_finance', 'Chief of Finance'),
        ('treasurer', 'Treasurer'),
        ('auditor', 'Auditor'),
        ('chief_logistics', 'Chief of Logistics & Operations'),
        ('event_coord', 'Event Coordinator'),
        ('op_asst', 'Operation Assistant'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    course = models.CharField(max_length=50, choices=COURSE_CHOICES, blank=True, null=True)
    year_level = models.CharField(max_length=20, choices=YEAR_CHOICES, blank=True, null=True)
    school = models.CharField(max_length=200, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, blank=True, null=True)
    email = models.EmailField(unique=True)
    
    # Allow duplicate usernames by making email the primary identifier
    username = models.CharField(max_length=150, unique=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    # Email Verification Fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_code = models.CharField(max_length=6, blank=True, null=True)
    
    # Username edit cooldown
    last_username_update = models.DateTimeField(null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    officer_started_at = models.DateField(blank=True, null=True)
    officer_ends_at = models.DateField(blank=True, null=True)

    def set_officer_term(self, days=365):
        start_date = timezone.now().date()
        self.officer_started_at = start_date
        self.officer_ends_at = start_date + timedelta(days=days)

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
    spots_capacity = models.PositiveIntegerField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='workshop')
    is_featured = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['date', 'event_type']),
        ]
    
    @property
    def is_past(self):
        from django.utils import timezone
        if self.date:
            return self.date < timezone.now().date()
        return False

    @property
    def spots_left_display(self):
        """Return dynamic spots-left text based on current enrollments."""
        raw = (self.spots_left or '').strip()
        if not raw:
            return ''

        remaining = self.spots_remaining
        if remaining is None:
            return raw
        return f"{remaining} spots left"

    @property
    def total_capacity(self):
        if self.spots_capacity is not None:
            return self.spots_capacity

        raw = (self.spots_left or '').strip()
        if not raw:
            return None

        match = re.search(r'\d+', raw)
        if not match:
            return None
        return int(match.group())

    @property
    def spots_remaining(self):
        capacity = self.total_capacity
        if capacity is None:
            return None
        return max(0, capacity - self.enrollments.count())

    @property
    def is_full(self):
        remaining = self.spots_remaining
        if remaining is None:
            return False
        return remaining <= 0

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='officer_applications')
    reason = models.TextField()
    department = models.CharField(max_length=20, choices=User.DEPARTMENT_CHOICES, default='tech')
    position = models.CharField(max_length=20, choices=User.POSITION_CHOICES, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=User.GENDER_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.department} - {self.status}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    link = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.user.username}"

class Connection(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
    ]
    # user_from is the requester, user_to is the recipient
    user_from = models.ForeignKey(User, related_name='connections_sent', on_delete=models.CASCADE)
    user_to = models.ForeignKey(User, related_name='connections_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user_from', 'user_to')
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(user_from=models.F('user_to')),
                name='connection_no_self_connection',
            ),
        ]
        indexes = [
            models.Index(fields=['user_to', 'status', '-created_at']),
            models.Index(fields=['user_from', 'status', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user_from.username} -> {self.user_to.username} ({self.status})"

class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')
        indexes = [
            models.Index(fields=['event', '-enrolled_at']),
            models.Index(fields=['user', '-enrolled_at']),
        ]

    def __str__(self):
        return f"{self.user.username} enrolled in {self.event.title}"

class Showcase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='showcases')
    title = models.CharField(max_length=200)
    website_url = models.URLField()
    description = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='showcase_likes', blank=True)
    saves = models.ManyToManyField(User, related_name='showcase_saves', blank=True)

    def __str__(self):
        return self.title

    @property
    def total_likes(self):
        return self.likes.count()

    @property
    def total_saves(self):
        return self.saves.count()

class ShowcaseImage(models.Model):
    showcase = models.ForeignKey(Showcase, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='showcase_screenshots/')
    
    def __str__(self):
        return f"Image for {self.showcase.title}"

class ShowcaseComment(models.Model):
    showcase = models.ForeignKey(Showcase, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['showcase', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.user.username} on {self.showcase.title}'