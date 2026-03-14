from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from .models import MemberStats, Event, WorkshopCatalogItem, Testimonial, User, ContactMessage, OfficerApplication, Notification, Enrollment
from .forms import StudentRegistrationForm, StudentLoginForm, ContactForm

@staff_member_required
def update_role(request, user_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can change user roles.')
        return redirect('admin-dashboard')
    if request.method == 'POST':
        target_user = get_object_or_404(User, id=user_id)
        new_role = request.POST.get('role')
        if new_role in ['member', 'officer', 'admin']:
            target_user.role = new_role
            # Sync is_staff/is_superuser if role is admin
            if new_role == 'admin':
                target_user.is_staff = True
            elif new_role == 'officer':
                target_user.is_staff = True # Officers can access some admin parts
            else:
                if not target_user.is_superuser:
                    target_user.is_staff = False
            
            target_user.save()
            messages.success(request, f'Role updated for {target_user.username}.')
        else:
            messages.error(request, 'Invalid role selected.')
    return redirect('admin-dashboard')

def index(request):
    today = timezone.now().date()
    stats = MemberStats.objects.first()
    featured_events = Event.objects.filter(is_featured=True, date__gte=today).order_by('date')[:1]
    other_events = Event.objects.filter(is_featured=False, date__gte=today).order_by('date')[:3]
    testimonials = Testimonial.objects.filter(is_approved=True)
    
    pending_app = None
    user_enrollments = []
    if request.user.is_authenticated:
        pending_app = request.user.officer_applications.filter(status='pending').first()
        user_enrollments = list(Enrollment.objects.filter(user=request.user).values_list('event_id', flat=True))
    
    context = {
        'stats': stats,
        'featured_events': featured_events,
        'other_events': other_events,
        'testimonials': testimonials,
        'pending_app': pending_app,
        'user_enrollments': user_enrollments,
    }
    return render(request, 'index.html', context)

def events_list(request):
    today = timezone.now().date()
    featured_events = Event.objects.filter(is_featured=True, date__gte=today).order_by('date')
    other_events = Event.objects.filter(is_featured=False, date__gte=today).order_by('date')
    past_events = Event.objects.filter(date__lt=today).order_by('-date')
    workshops = WorkshopCatalogItem.objects.all()
    
    user_enrollments = []
    if request.user.is_authenticated:
        user_enrollments = list(Enrollment.objects.filter(user=request.user).values_list('event_id', flat=True))
    
    context = {
        'featured_events': featured_events,
        'other_events': other_events,
        'past_events': past_events,
        'workshops': workshops,
        'user_enrollments': user_enrollments,
    }
    return render(request, 'events.html', context)

def about(request):
    pending_app = None
    if request.user.is_authenticated:
        pending_app = request.user.officer_applications.filter(status='pending').first()
    return render(request, 'about.html', {'pending_app': pending_app})

def contact(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.error(request, 'You must be logged in to send a message.')
            return redirect('login')
        form = ContactForm(request.POST)
        if form.is_valid():
            contact_msg = form.save(commit=False)
            contact_msg.user = request.user
            contact_msg.name = f"{request.user.first_name} {request.user.last_name}"
            contact_msg.email = request.user.email
            contact_msg.save()
            messages.success(request, 'Your message has been sent successfully!')
            return redirect('contact')
    else:
        form = ContactForm()
    return render(request, 'contact.html', {'form': form})

def login_view(request):
    next_url = request.POST.get('next') or request.GET.get('next')
    if request.method == 'POST':
        form = StudentLoginForm(data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            # Look up user by email
            user_obj = User.objects.filter(email__iexact=email).first()
            user = None
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
            if user is not None:
                login(request, user)
                if next_url:
                    return redirect(next_url)
                return redirect('index')
            else:
                form.add_error(None, 'Invalid email or password.')
                if next_url and next_url in ['/admin/', '/manager_console', '/admin-dashboard']:
                    messages.error(request, 'Invalid email or password.')
                    total_users = User.objects.count()
                    total_events = Event.objects.count()
                    total_messages = ContactMessage.objects.count()
                    recent_users = User.objects.order_by('-date_joined')[:5]
                    context = {
                        'total_users': total_users,
                        'total_events': total_events,
                        'total_messages': total_messages,
                        'recent_users': recent_users,
                        'all_users': User.objects.all().order_by('-date_joined'),
                        'all_events': Event.objects.all().order_by('-id'),
                        'all_messages': ContactMessage.objects.all().order_by('-created_at'),
                        'all_testimonials': Testimonial.objects.all().order_by('-id'),
                        'login_form': form,
                    }
                    return render(request, 'admin.html', context)
    else:
        form = StudentLoginForm()
    return render(request, 'account.html', {
        'login_form': form,
        'register_form': StudentRegistrationForm(),
        'panel': 'login',
        'next': next_url
    })

def register_view(request):
    next_url = request.POST.get('next') or request.GET.get('next')
    if request.method == 'POST':
        form = StudentRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create welcome notification
            Notification.objects.create(
                user=user,
                message="Welcome to Flurry! We're glad to have you here. Explore our cloud workshops and community!"
            )
            login(request, user)
            if next_url:
                return redirect(next_url)
            return redirect('index')
    else:
        form = StudentRegistrationForm()
    return render(request, 'account.html', {
        'register_form': form, 
        'login_form': StudentLoginForm(),
        'panel': 'register',
        'next': next_url
    })

def logout_view(request):
    logout(request)
    return redirect('index')

# Admin dashboard for staff management
def admin_dashboard(request):
    if not request.user.is_authenticated:
        return render(request, 'admin.html')
    if not request.user.is_staff:
        messages.warning(request, 'Access denied. You do not have administrative privileges.')
        return redirect('index')
    
    from django.db.models import Count
    
    total_users = User.objects.count()
    total_events = Event.objects.count()
    total_messages = ContactMessage.objects.count()
    recent_users = User.objects.order_by('-date_joined')[:5]
    
    # Separated lists for UI
    officers = User.objects.filter(role='officer').order_by('-date_joined')
    members = User.objects.filter(role='member').order_by('-date_joined')
    
    # Applications
    pending_applications = OfficerApplication.objects.filter(status='pending').order_by('-created_at')
    
    today = timezone.now().date()
    upcoming_events = Event.objects.filter(date__gte=today).annotate(enroll_count=Count('enrollments')).order_by('date')
    past_events = Event.objects.filter(date__lt=today).annotate(enroll_count=Count('enrollments')).order_by('-date')
    all_messages = ContactMessage.objects.all().order_by('-created_at')
    all_testimonials = Testimonial.objects.all().order_by('-id')
    
    context = {
        'total_users': total_users,
        'total_events': total_events,
        'total_messages': total_messages,
        'recent_users': recent_users,
        'officers': officers,
        'members': members,
        'pending_applications': pending_applications,
        'upcoming_events': upcoming_events,
        'past_events': past_events,
        'all_messages': all_messages,
        'all_testimonials': all_testimonials,
    }
    return render(request, 'admin.html', context)

@login_required
def apply_for_officer(request):
    if request.method == 'POST':
        reason = request.POST.get('reason')
        department = request.POST.get('department')
        if reason and department:
            OfficerApplication.objects.create(
                user=request.user,
                reason=reason,
                department=department
            )
            messages.success(request, 'Your application has been submitted.')
        else:
            messages.error(request, 'Please provide both a reason and a department for your application.')
    return redirect('index')

@staff_member_required
def handle_officer_application(request, app_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can handle applications.')
        return redirect('admin-dashboard')
        
    application = get_object_or_404(OfficerApplication, id=app_id)
    action = request.POST.get('action') # 'approve' or 'deny'
    
    if action == 'approve':
        application.status = 'approved'
        user = application.user
        user.role = 'officer'
        user.is_staff = True
        user.save()
        Notification.objects.create(
            user=user,
            message=f"Your officer application for the {application.get_department_display()} department has been approved! You now have staff access."
        )
        messages.success(request, f"Approved {user.username}'s application.")
    elif action == 'deny':
        application.status = 'denied'
        Notification.objects.create(
            user=application.user,
            message=f"Your officer application for the {application.get_department_display()} department has been denied."
        )
        messages.success(request, f"Denied {application.user.username}'s application.")
    
    application.save()
    return redirect('admin-dashboard')

@login_required
def mark_notification_read(request, notification_id):
    from django.http import JsonResponse
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.is_read = True
    notification.save()
    # Return JSON for AJAX; fall back to redirect for direct link access
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        unread_count = request.user.notifications.filter(is_read=False).count()
        return JsonResponse({'success': True, 'unread_count': unread_count})
    referer = request.META.get('HTTP_REFERER')
    return redirect(referer if referer else 'profile')

@login_required
def mark_all_notifications_read(request):
    request.user.notifications.filter(is_read=False).update(is_read=True)
    messages.success(request, 'All notifications marked as read.')
    referer = request.META.get('HTTP_REFERER')
    return redirect(referer if referer else 'profile')

@login_required
def clear_all_notifications(request):
    request.user.notifications.all().delete()
    messages.success(request, 'All notifications cleared.')
    referer = request.META.get('HTTP_REFERER')
    return redirect(referer if referer else 'profile')

@login_required
def enroll_event(request, event_id):
    from django.http import JsonResponse
    event = get_object_or_404(Event, id=event_id)
    
    # Check if already enrolled
    enrolled = Enrollment.objects.filter(user=request.user, event=event).exists()
    if enrolled:
        return JsonResponse({'success': False, 'message': "Already enrolled!"})
    
    Enrollment.objects.create(user=request.user, event=event)
    return JsonResponse({'success': True, 'message': f"Registered for {event.title}!"})

@login_required
def sync_enrollments(request):
    import json
    from django.http import JsonResponse
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            titles = data.get('titles', [])
            count = 0
            for title in titles:
                event = Event.objects.filter(title=title).first()
                if event:
                    _, created = Enrollment.objects.get_or_create(user=request.user, event=event)
                    if created:
                        count += 1
            return JsonResponse({'success': True, 'synced': count})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request'})

def profile(request):
    if not request.user.is_authenticated:
        return redirect('account')
    
    notifications = request.user.notifications.filter(is_read=False).order_by('-created_at')
    pending_app = request.user.officer_applications.filter(status='pending').first()
    enrolled_events = Enrollment.objects.filter(user=request.user).select_related('event').order_by('-enrolled_at')
    
    context = {
        'notifications': notifications,
        'pending_app': pending_app,
        'enrolled_events': enrolled_events,
    }
    return render(request, 'profile.html', context)

@staff_member_required
def delete_user(request, user_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can delete users.')
        return redirect('admin-dashboard')
    if request.method == 'POST':
        user = get_object_or_404(User, id=user_id)
        if not user.is_superuser: 
            user.delete()
            messages.success(request, f'User {user.username} deleted.')
        return redirect('admin-dashboard')
    return redirect('admin-dashboard')

@staff_member_required
def create_event(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        day = request.POST.get('day')
        month = request.POST.get('month')
        time_range = request.POST.get('time_range')
        location = request.POST.get('location')
        spots_val = request.POST.get('spots_left')
        spots_left = f"{spots_val} spots left" if spots_val else ""
        event_type = request.POST.get('event_type')
        date_val = request.POST.get('date')
        start_time_val = request.POST.get('start_time')
        end_time_val = request.POST.get('end_time')
        is_featured = request.POST.get('is_featured') == 'on'
        
        Event.objects.create(
            title=title,
            description=description,
            day=day,
            month=month,
            date=date_val if date_val else None,
            start_time=start_time_val if start_time_val else None,
            end_time=end_time_val if end_time_val else None,
            time_range=time_range,
            location=location,
            spots_left=spots_left,
            event_type=event_type,
            is_featured=is_featured
        )
        messages.success(request, f'Event "{title}" created successfully.')
    return redirect('admin-dashboard')

@staff_member_required
def edit_event(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if request.method == 'POST':
        event.title = request.POST.get('title')
        event.description = request.POST.get('description')
        event.day = request.POST.get('day')
        event.month = request.POST.get('month')
        event.time_range = request.POST.get('time_range')
        event.location = request.POST.get('location')
        spots_val = request.POST.get('spots_left')
        event.spots_left = f"{spots_val} spots left" if spots_val else ""
        event.event_type = request.POST.get('event_type')
        event.is_featured = request.POST.get('is_featured') == 'on'
        date_val = request.POST.get('date')
        if date_val:
            event.date = date_val
            
        start_time_val = request.POST.get('start_time')
        if start_time_val:
            event.start_time = start_time_val
            
        end_time_val = request.POST.get('end_time')
        if end_time_val:
            event.end_time = end_time_val
            
        event.save()
        messages.success(request, f'Event "{event.title}" updated successfully.')
    return redirect('admin-dashboard')

@staff_member_required
def delete_event(request, event_id):
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        title = event.title
        event.delete()
        messages.success(request, f'Event "{title}" deleted successfully.')
    return redirect('admin-dashboard')

def account(request):
    next_url = request.GET.get('next')
    if request.user.is_authenticated:
        return redirect(next_url or 'profile')
    return render(request, 'account.html', {
        'register_form': StudentRegistrationForm(),
        'login_form': StudentLoginForm(),
        'panel': 'register',
        'next': next_url
    })

@login_required
def submit_testimonial(request):
    if request.method == 'POST':
        quote = request.POST.get('quote')
        if quote:
            course_name = request.user.get_course_display() if request.user.course else ""
            year_name = request.user.get_year_level_display() if request.user.year_level else ""
            role_str = f"{course_name}"
            if year_name:
                 role_str += f" - {year_name}"
            Testimonial.objects.create(
                quote=quote,
                author_name=request.user.get_full_name() or request.user.username,
                author_role=role_str,
                author_initials=request.user.username[0].upper()
            )
            messages.success(request, 'Feedback submitted successfully! It will appear on the site once approved.')
    return redirect('profile')

@login_required
def approve_testimonial(request, testimonial_id):
    if request.method == 'POST':
        if not request.user.is_staff:
            return redirect('index')
        testimonial = get_object_or_404(Testimonial, id=testimonial_id)
        testimonial.is_approved = not testimonial.is_approved
        testimonial.save()
        status = "approved" if testimonial.is_approved else "hidden"
        messages.success(request, f'Testimonial by {testimonial.author_name} is now {status}.')
        return redirect('admin-dashboard')
    return redirect('admin-dashboard')

@staff_member_required
def delete_adm_testimonial(request, testimonial_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can delete testimonials.')
        return redirect('admin-dashboard')
    if request.method == 'POST':
        testimonial = get_object_or_404(Testimonial, id=testimonial_id)
        name = testimonial.author_name
        testimonial.delete()
        messages.success(request, f'Testimonial by {name} deleted.')
        return redirect('admin-dashboard')
    return redirect('admin-dashboard')