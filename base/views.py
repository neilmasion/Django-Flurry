from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q, Count
from django.http import JsonResponse, Http404
from django.utils import timezone
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.conf import settings
from .models import MemberStats, Event, WorkshopCatalogItem, Testimonial, User, ContactMessage, OfficerApplication, Notification, Enrollment, Showcase, ShowcaseImage, ShowcaseComment, Connection
from .forms import StudentRegistrationForm, StudentLoginForm, ContactForm, ShowcaseForm
from django.core.mail import send_mail
from django.urls import reverse
from datetime import timedelta
import logging
import os
import requests
from email.utils import parseaddr

logger = logging.getLogger(__name__)


def _demote_to_member(user):
    user.role = 'member'
    if not user.is_superuser:
        user.is_staff = False
    user.department = None
    user.officer_started_at = None
    user.officer_ends_at = None


def _promote_to_officer(user, department, term_days=365):
    today = timezone.now().date()
    user.role = 'officer'
    user.is_staff = True
    user.department = department
    user.officer_started_at = today
    user.officer_ends_at = today + timedelta(days=term_days)

@staff_member_required
def update_role(request, user_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can change user roles.')
        return redirect('admin-dashboard')
    if request.method == 'POST':
        target_user = get_object_or_404(User, id=user_id)
        new_role = request.POST.get('role')
        if new_role in ['member', 'officer', 'admin']:
            if new_role == 'admin':
                target_user.role = 'admin'
                target_user.is_staff = True
            elif new_role == 'officer':
                department = request.POST.get('department') or target_user.department or 'tech'
                _promote_to_officer(target_user, department)
            else:
                _demote_to_member(target_user)

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
    return render(request, 'about.html')

def community(request):
    showcases = Showcase.objects.filter(is_approved=True).order_by('-created_at')
    form = ShowcaseForm()
    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.info(request, 'Please log in to submit your website.')
            return redirect(f"{reverse('account')}?panel=login&next={request.path}")
        form = ShowcaseForm(request.POST, request.FILES)
        if form.is_valid():
            showcase = form.save(commit=False)
            showcase.user = request.user
            showcase.save()
            
            # Handle multiple images
            for img in request.FILES.getlist('images'):
                ShowcaseImage.objects.create(showcase=showcase, image=img)
                
            messages.success(request, 'Your website has been successfully added to the showcase!')
            return redirect('community')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    # If the field is non_field_errors, just use 'Error'
                    field_name = 'Error' if field == '__all__' else field.replace('_', ' ').title()
                    messages.error(request, f"{field_name}: {error}")
    
    return render(request, 'community.html', {'showcases': showcases, 'form': form})

@login_required
def toggle_like(request, pk):
    showcase = get_object_or_404(Showcase, pk=pk)
    if request.user in showcase.likes.all():
        showcase.likes.remove(request.user)
        liked = False
    else:
        showcase.likes.add(request.user)
        liked = True
        # Send notification to author if it's not their own post
        if showcase.user != request.user:
            Notification.objects.create(
                user=showcase.user,
                message=f"{request.user.first_name or request.user.username} liked your project: {showcase.title}",
                link=reverse('community') + f"#showcase-{showcase.id}"
            )
    return JsonResponse({'liked': liked, 'count': showcase.total_likes})

@login_required
def toggle_save(request, pk):
    showcase = get_object_or_404(Showcase, pk=pk)
    if request.user in showcase.saves.all():
        showcase.saves.remove(request.user)
        saved = False
    else:
        showcase.saves.add(request.user)
        saved = True
    return JsonResponse({'saved': saved, 'count': showcase.total_saves})

@login_required
def add_comment(request, pk):
    if request.method == 'POST':
        showcase = get_object_or_404(Showcase, pk=pk)
        content = request.POST.get('content')
        parent_id = request.POST.get('parent_id')
        
        if not content:
            return JsonResponse({'error': 'Comment content is required.'}, status=400)
            
        comment = ShowcaseComment.objects.create(
            showcase=showcase,
            user=request.user,
            content=content
        )
        
        if parent_id:
            parent = get_object_or_404(ShowcaseComment, id=parent_id)
            comment.parent = parent
            comment.save()
            
            # Notify parent comment author
            if parent.user != request.user:
                Notification.objects.create(
                    user=parent.user,
                    message=f"{request.user.first_name or request.user.username} replied to your comment on {showcase.title}",
                    link=reverse('community') + f"#showcase-{showcase.id}"
                )
        else:
            # Notify project author for new top-level comment
            if showcase.user != request.user:
                Notification.objects.create(
                    user=showcase.user,
                    message=f"{request.user.first_name or request.user.username} commented on your project: {showcase.title}",
                    link=reverse('community') + f"#showcase-{showcase.id}"
                )
        
        return JsonResponse({
            'status': 'success',
            'id': comment.id,
            'user': request.user.first_name or request.user.username,
            'user_role': request.user.role,
            'user_photo': request.user.profile_picture.url if request.user.profile_picture else None,
            'is_self': True,  # It's an AJAX response to the user who just posted it
            'content': comment.content,
            'created_at': 'Just now',
            'parent_id': parent_id
        })
    return JsonResponse({'error': 'Invalid request method.'}, status=405)

def contact(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            # Store form data in session to recover after login
            request.session['pending_contact_form'] = request.POST.dict()
            messages.info(request, 'Please log in to send your message.')
            return redirect(f"{reverse('account')}?panel=login&next={request.path}")
            
        form = ContactForm(request.POST)
        if form.is_valid():
            contact_msg = form.save(commit=False)
            contact_msg.user = request.user
            contact_msg.name = f"{request.user.first_name} {request.user.last_name}"
            contact_msg.email = request.user.email
            contact_msg.save()
            
            # Clear pending form if any
            if 'pending_contact_form' in request.session:
                del request.session['pending_contact_form']
                
            messages.success(request, 'Your message has been sent successfully!')
            return redirect('contact')
    else:
        # Pre-fill from session if available
        initial_data = request.session.get('pending_contact_form', {})
        form = ContactForm(initial=initial_data)
        
    return render(request, 'contact.html', {'form': form})

def login_view(request):
    next_url = request.POST.get('next') or request.GET.get('next')
    admin_next_targets = {
        '/admin/',
        '/manager_console',
        '/manager_console/',
        '/admin-dashboard',
        '/admin-dashboard/',
    }

    def render_admin_login_with_error(message_text, login_form=None):
        messages.error(request, message_text)
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
            'login_form': login_form or StudentLoginForm(),
        }
        return render(request, 'admin.html', context)

    if request.method == 'POST':
        post_data = request.POST.copy()
        # Backward compatibility for forms that still submit `username`.
        if not post_data.get('email') and post_data.get('username'):
            post_data['email'] = post_data.get('username')
        form = StudentLoginForm(data=post_data)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            # Authenticate using email (since it's now the USERNAME_FIELD)
            user = authenticate(request, username=email, password=password)
            if user is not None:
                if user.role in ['admin', 'officer'] and not user.is_staff:
                    user.is_staff = True
                    user.save(update_fields=['is_staff'])

                admin_access = user.is_staff or user.is_superuser or user.role in ['admin', 'officer']
                if next_url and next_url in admin_next_targets and not admin_access:
                    return render_admin_login_with_error(
                        'Login successful, but this account has no admin access.',
                        form,
                    )

                if not user.is_email_verified and not (user.is_staff or user.is_superuser):
                    request.session['verification_email'] = user.email
                    return redirect('verify-email-sent')
                
                login(request, user)
                if next_url:
                    return redirect(next_url)
                return redirect('index')
            else:
                form.add_error(None, 'Invalid email or password.')
                if next_url and next_url in admin_next_targets:
                    return render_admin_login_with_error('Invalid email or password.', form)
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
        # If an unverified account exists with this email, delete it so they can start fresh
        email = request.POST.get('email', '').strip()
        if email:
            unverified_user = User.objects.filter(email=email, is_email_verified=False).first()
            if unverified_user:
                unverified_user.delete()
                
        form = StudentRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create welcome notification
            Notification.objects.create(
                user=user,
                message="Welcome to Flurry! We're glad to have you here. Explore our cloud workshops and community! Please remember to verify your email to unlock all features.",
                link=reverse('profile')
            )
            # Send automatic verification email
            email_sent, email_error = send_verification_email_logic(user, request)
            if not email_sent:
                request.session['verification_error_detail'] = email_error or 'Unknown email error'
                messages.error(request, "We couldn't send your verification email right now. Please use Resend Code on the next page.")
            
            # Store email in session to verify OTP
            request.session['verification_email'] = user.email
            
            # Do NOT login yet. Redirect to info page.
            return redirect('verify-email-sent')
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
    can_access_admin = (
        request.user.is_staff
        or request.user.is_superuser
        or request.user.role in ['admin', 'officer']
    )
    if not can_access_admin:
        messages.warning(request, 'Access denied. You do not have administrative privileges.')
        return redirect('index')
    if request.user.role in ['admin', 'officer'] and not request.user.is_staff:
        request.user.is_staff = True
        request.user.save(update_fields=['is_staff'])
    
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
    all_showcases = Showcase.objects.all().order_by('-created_at')
    
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
        'all_showcases': all_showcases,
        'today': today,
    }
    return render(request, 'admin.html', context)

@login_required
def apply_for_officer(request):
    if not request.user.is_email_verified:
        messages.error(request, 'Please verify your email before applying for an officer position.')
        return redirect('profile')
        
    if request.user.role == 'officer':
        messages.info(request, 'You are already an officer.')
        return redirect('profile')

    if request.user.officer_applications.filter(status='pending').exists():
        messages.info(request, 'You already have a pending officer application.')
        return redirect('profile')

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
        term_days_raw = request.POST.get('term_days', '365')
        try:
            term_days = max(1, int(term_days_raw))
        except (TypeError, ValueError):
            term_days = 365

        _promote_to_officer(user, application.department, term_days=term_days)
        user.save()
        end_date_str = user.officer_ends_at.strftime('%b %d, %Y') if user.officer_ends_at else 'N/A'
        Notification.objects.create(
            user=user,
            message=f"Your officer application for the {application.get_department_display()} department has been approved! Your term ends on {end_date_str}.",
            link=reverse('profile')
        )
        messages.success(request, f"Approved {user.username}'s application.")
    elif action == 'deny':
        application.status = 'denied'
        Notification.objects.create(
            user=application.user,
            message=f"Your officer application for the {application.get_department_display()} department has been denied.",
            link=reverse('profile')
        )
        messages.success(request, f"Denied {application.user.username}'s application.")
    
    application.save()
    return redirect('admin-dashboard')


@staff_member_required
def demote_officer(request, user_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can demote officers.')
        return redirect('admin-dashboard')

    if request.method != 'POST':
        return redirect('admin-dashboard')

    target_user = get_object_or_404(User, id=user_id)
    reason = request.POST.get('reason', 'Admin role update').strip()

    if target_user.role != 'officer':
        messages.info(request, f'{target_user.username} is not currently an officer.')
        return redirect('admin-dashboard')

    _demote_to_member(target_user)
    target_user.save()

    Notification.objects.create(
        user=target_user,
        message=f"Your officer role has been changed back to member. Reason: {reason}",
        link=reverse('profile')
    )
    messages.success(request, f'{target_user.username} has been moved back to member.')
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
    
    # Check if email is verified
    if not request.user.is_email_verified:
        return JsonResponse({'success': False, 'message': 'VERIFY_EMAIL_REQUIRED'})

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
    
    # Connections
    accepted_connections = Connection.objects.filter(
        (Q(user_from=request.user) | Q(user_to=request.user)),
        status='accepted'
    ).select_related('user_from', 'user_to')
    
    friends = []
    for c in accepted_connections:
        friends.append(c.user_to if c.user_from == request.user else c.user_from)
        
    pending_received = Connection.objects.filter(user_to=request.user, status='pending').select_related('user_from')
    pending_sent = Connection.objects.filter(user_from=request.user, status='pending').select_related('user_to')

    cooldown_active = False
    cooldown_remaining = None
    if request.user.last_username_update:
        cooldown_period = timezone.timedelta(days=3)
        if timezone.now() < request.user.last_username_update + cooldown_period:
            cooldown_active = True
            remaining = (request.user.last_username_update + cooldown_period) - timezone.now()
            cooldown_remaining = f"{remaining.days}d {remaining.seconds // 3600}h"
    saved_showcases = request.user.showcase_saves.filter(is_approved=True).order_by('-created_at')

    context = {
        'saved_showcases': saved_showcases,
        'notifications': notifications,
        'pending_app': pending_app,
        'enrolled_events': enrolled_events,
        'friends': friends,
        'pending_received': pending_received,
        'pending_sent': pending_sent,
        'is_email_verified': request.user.is_email_verified,
        'cooldown_active': cooldown_active,
        'cooldown_remaining': cooldown_remaining,
    }
    return render(request, 'profile.html', context)

def send_verification_email_logic(user, request):
    """Helper to send verification email without redirecting."""
    if user.is_email_verified:
        return False, "User is already verified."
        
    import random
    from django.template.loader import render_to_string
    from django.utils.html import strip_tags
    
    code = f"{random.randint(100000, 999999)}"
    user.email_verification_code = code
    user.save(update_fields=['email_verification_code'])
    
    subject = "Verify your Flurry account"
    html_message = render_to_string('emails/verify_email.html', {'user': user, 'code': code})
    plain_message = strip_tags(html_message)
    from_email = settings.DEFAULT_FROM_EMAIL
    if 'gmail' in settings.EMAIL_HOST.lower() and settings.EMAIL_HOST_USER:
        from_email = settings.EMAIL_HOST_USER

    sendgrid_api_key = os.getenv('SENDGRID_API_KEY') or os.getenv('EMAIL_HOST_PASSWORD', '')
    smtp_is_sendgrid = 'sendgrid' in settings.EMAIL_HOST.lower()
    if sendgrid_api_key and smtp_is_sendgrid:
        import requests
        from_name, from_addr = parseaddr(from_email)
        if not from_addr:
            from_addr = from_email

        payload = {
            'personalizations': [{'to': [{'email': user.email}]}],
            'from': {'email': from_addr, 'name': from_name or 'Flurry'},
            'subject': subject,
            'content': [
                {'type': 'text/plain', 'value': plain_message},
                {'type': 'text/html', 'value': html_message},
            ],
        }

        try:
            response = requests.post(
                'https://api.sendgrid.com/v3/mail/send',
                headers={
                    'Authorization': f'Bearer {sendgrid_api_key}',
                    'Content-Type': 'application/json',
                },
                json=payload,
                timeout=15,
            )
            if 200 <= response.status_code < 300:
                return True, None
            return False, f'SendGrid API {response.status_code}: {response.text[:180]}'
        except Exception as e:
            logger.exception("SendGrid API send failed for %s", user.email)
            return False, f"{e.__class__.__name__}: {str(e)}"

    # Send synchronously so failures are surfaced to the user.
    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True, None
    except Exception as e:
        logger.exception("Failed to send verification email to %s", user.email)
        return False, f"{e.__class__.__name__}: {str(e)}"

@login_required
def update_profile(request):
    if request.method == 'POST':
        user = request.user
        
        # Extract data from request
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            # Fallback for standard POST if needed, but we'll use JSON from JS
            data = request.POST

        first_name = data.get('first_name', user.first_name)
        last_name = data.get('last_name', user.last_name)
        bio = data.get('bio', '') # Bio is currently a placeholder in storage? No, let's see.
        course = data.get('course', user.course)
        year_level = data.get('year_level', user.year_level)
        school = data.get('school', user.school)
        new_username = data.get('username', user.username)

        # Handle Username Change Cooldown
        if new_username != user.username:
            if user.last_username_update:
                cooldown_period = timezone.timedelta(days=3)
                if timezone.now() < user.last_username_update + cooldown_period:
                    remaining = (user.last_username_update + cooldown_period) - timezone.now()
                    days = remaining.days
                    hours = remaining.seconds // 3600
                    return JsonResponse({
                        'success': False, 
                        'error': f'Username can only be changed once every 3 days. Please try again in {days}d {hours}h.'
                    })
            
            user.username = new_username
            user.last_username_update = timezone.now()

        # Update other fields
        user.first_name = first_name
        user.last_name = last_name
        user.course = course
        user.year_level = year_level
        user.school = school
        user.bio = bio
        
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully!',
            'username': user.username,
            'course_display': user.get_course_display(),
            'year_display': user.get_year_level_display(),
            'cooldown_active': True if new_username != user.username else False, # If changed, it's active now
            'cooldown_remaining': '3d 0h' if new_username != user.username else None
        })
    
    return JsonResponse({'success': False, 'error': 'Invalid request method.'})

@login_required
def upload_avatar(request):
    if request.method == 'POST' and request.FILES.get('profile_picture'):
        user = request.user
        user.profile_picture = request.FILES['profile_picture']
        user.save()
        return JsonResponse({
            'success': True,
            'url': user.profile_picture.url
        })
    elif request.method == 'POST' and request.POST.get('action') == 'remove':
        user = request.user
        if user.profile_picture:
            user.profile_picture.delete()
        user.save()
        return JsonResponse({'success': True})
        
    return JsonResponse({'success': False, 'error': 'Invalid request'})

def send_verification_email(request):
    user = None
    if request.user.is_authenticated:
        user = request.user
    elif 'verification_email' in request.session:
        email = request.session['verification_email']
        from .models import User
        user = User.objects.filter(email=email).first()
        
    if not user:
        messages.error(request, "Unable to resend email. Please log in first.")
        return redirect(f"{reverse('account')}?panel=login")

    if user.is_email_verified:
        messages.info(request, "Your email is already verified.")
        return redirect('profile')
        
    email_sent, email_error = send_verification_email_logic(user, request)
    if email_sent:
        messages.success(request, f"Verification email sent to {user.email}. Check your inbox and spam folder.")
    else:
        request.session['verification_error_detail'] = email_error or 'Unknown email error'
        messages.error(request, "Failed to send verification email. Please try again later.")
        
    return redirect('verify-email-sent')

def verify_email_sent(request):
    if request.user.is_authenticated:
        email = request.user.email
    else:
        email = request.session.get('verification_email')
    
    if request.method == 'POST':
        code = request.POST.get('code', '').strip()
        email_input = request.POST.get('email', '').strip() or email
        
        if not email_input:
            messages.error(request, "Email is missing. Please enter your email and code.")
            return render(request, 'verify_email_sent.html', {'email': email})
            
        user = User.objects.filter(email=email_input, email_verification_code=code).first()
        if user and user.email_verification_code:
            user.is_email_verified = True
            user.email_verification_code = None
            user.save(update_fields=['is_email_verified', 'email_verification_code'])
            
            Notification.objects.create(
                user=user,
                message="Congratulations! Your email has been verified successfully. You now have full access to all Flurry features, including officer applications!",
                link=reverse('profile')
            )
            
            if 'verification_email' in request.session:
                del request.session['verification_email']
                
            messages.success(request, "Email verified successfully! You can now log in.")
            return redirect(f"{reverse('account')}?panel=login")
        else:
            messages.error(request, "Invalid verification code or email.")
            
    error_detail = request.session.pop('verification_error_detail', None)
    return render(request, 'verify_email_sent.html', {'email': email, 'verification_error_detail': error_detail})

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
    panel = request.GET.get('panel', 'register')
    email = request.GET.get('email', '')
    
    if request.user.is_authenticated:
        return redirect(next_url or 'profile')
    
    # Initialize forms
    register_initial = {'email': email} if email else None
    register_form = StudentRegistrationForm(initial=register_initial)
    login_form = StudentLoginForm()
    
    return render(request, 'account.html', {
        'register_form': register_form,
        'login_form': login_form,
        'panel': panel,
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

@staff_member_required
def approve_showcase(request, showcase_id):
    if request.method == 'POST':
        showcase = get_object_or_404(Showcase, id=showcase_id)
        showcase.is_approved = not showcase.is_approved
        showcase.save()
        status = "approved" if showcase.is_approved else "hidden"
        messages.success(request, f'Showcase "{showcase.title}" is now {status}.')
    return redirect('admin-dashboard')

@staff_member_required
def delete_showcase(request, showcase_id):
    if request.user.role != 'admin' and not request.user.is_superuser:
        messages.error(request, 'Only Administrators can delete showcase items.')
        return redirect('admin-dashboard')
    if request.method == 'POST':
        showcase = get_object_or_404(Showcase, id=showcase_id)
        title = showcase.title
        showcase.delete()
        messages.success(request, f'Showcase "{title}" deleted successfully.')
    return redirect('admin-dashboard')

def public_profile(request, username):
    target_user = User.objects.filter(username=username).first()
    if not target_user:
        raise Http404("User not found.")
    # If it's me, go to my own private profile
    if request.user.is_authenticated and target_user == request.user:
        return redirect('profile')
    
    showcases = target_user.showcases.filter(is_approved=True).order_by('-created_at')
    
    # Connections for target user
    accepted_connections = Connection.objects.filter(
        (Q(user_from=target_user) | Q(user_to=target_user)),
        status='accepted'
    ).select_related('user_from', 'user_to')
    
    friends = []
    for c in accepted_connections:
        friends.append(c.user_to if c.user_from == target_user else c.user_from)
    
    connection_status = None
    connection_id = None
    if request.user.is_authenticated:
        conn = Connection.objects.filter(
            (Q(user_from=request.user, user_to=target_user) | Q(user_from=target_user, user_to=request.user))
        ).first()
        if conn:
            connection_status = conn.status
            connection_id = conn.id
            if conn.status == 'pending' and conn.user_to == request.user:
                connection_status = 'received_pending'

    context = {
        'target_user': target_user,
        'showcases': showcases,
        'connection_status': connection_status,
        'connection_id': connection_id,
    }
    return render(request, 'user_profile.html', context)

def public_profile_by_id(request, user_id):
    target_user = get_object_or_404(User, id=user_id)
    # Redirect to the canonical username URL if we want, or just render
    # Using the same logic as public_profile
    if request.user.is_authenticated and target_user == request.user:
        return redirect('profile')
    
    showcases = target_user.showcases.filter(is_approved=True).order_by('-created_at')
    
    accepted_connections = Connection.objects.filter(
        (Q(user_from=target_user) | Q(user_to=target_user)),
        status='accepted'
    ).select_related('user_from', 'user_to')
    
    friends = []
    for c in accepted_connections:
        friends.append(c.user_to if c.user_from == target_user else c.user_from)
    
    connection_status = None
    connection_id = None
    if request.user.is_authenticated:
        conn = Connection.objects.filter(
            (Q(user_from=request.user, user_to=target_user) | Q(user_from=target_user, user_to=request.user))
        ).first()
        if conn:
            connection_status = conn.status
            connection_id = conn.id
            if conn.status == 'pending' and conn.user_to == request.user:
                connection_status = 'requested'
    
    context = {
        'target_user': target_user,
        'showcases': showcases,
        'friends': friends,
        'connection_status': connection_status,
        'connection_id': connection_id,
        'is_public_view': True
    }
    return render(request, 'user_profile.html', context)

@login_required
def connect_user(request, user_id):
    target_user = get_object_or_404(User, id=user_id)
    if target_user == request.user:
        return JsonResponse({'success': False, 'error': 'You cannot connect with yourself.'})
    
    # Check if already connected or pending
    conn = Connection.objects.filter(
        (Q(user_from=request.user, user_to=target_user) | Q(user_from=target_user, user_to=request.user))
    ).first()
    
    if not conn:
        Connection.objects.create(user_from=request.user, user_to=target_user)
        Notification.objects.create(
            user=target_user,
            message=f"{request.user.first_name or request.user.username} sent you a connection request.",
            link=reverse('profile') + "?tab=connections"
        )
        return JsonResponse({'success': True, 'status': 'pending'})
    else:
        # If I sent it and it's pending, I can cancel it
        if conn.status == 'pending' and conn.user_from == request.user:
            conn.delete()
            return JsonResponse({'success': True, 'status': None})
        elif conn.status == 'accepted':
             return JsonResponse({'success': False, 'error': 'Already connected.'})
        else:
             return JsonResponse({'success': False, 'error': 'Action not allowed.'})

@login_required
def handle_connection(request, conn_id):
    conn = get_object_or_404(Connection, id=conn_id, user_to=request.user)
    import json
    try:
        data = json.loads(request.body)
        action = data.get('action') # 'accept' or 'decline'
    except:
        action = request.POST.get('action')
    
    if action == 'accept':
        conn.status = 'accepted'
        conn.save()
        Notification.objects.create(
            user=conn.user_from,
            message=f"{request.user.first_name or request.user.username} accepted your connection request!",
            link=reverse('profile') + "?tab=connections"
        )
        return JsonResponse({'success': True, 'status': 'accepted'})
    elif action == 'decline':
        conn.delete()
        return JsonResponse({'success': True, 'status': None})
    return JsonResponse({'success': False, 'error': 'Invalid action.'})

@login_required
def remove_connection(request, user_id):
    target_user = get_object_or_404(User, id=user_id)
    conn = Connection.objects.filter(
        (Q(user_from=request.user, user_to=target_user) | Q(user_from=target_user, user_to=request.user)),
        status='accepted'
    ).first()
    if conn:
        conn.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Connection not found.'})

def search_users(request):
    query = request.GET.get('q', '').strip()
    if not query or len(query) < 1:
        return JsonResponse({'users': []})
    
    users = User.objects.filter(
        Q(username__icontains=query) | 
        Q(first_name__icontains=query) | 
        Q(last_name__icontains=query)
    ).filter(email__endswith='@gmail.com') \
     .exclude(role='admin') \
     .exclude(is_superuser=True) \
     .exclude(username__icontains='tester') \
     .exclude(first_name__icontains='tester')         .exclude(last_name__icontains='tester').distinct()[:6]
    
    results = []
    for u in users:
        connection_status = None
        connection_id = None
        
        if request.user.is_authenticated:
            if u == request.user:
                connection_status = 'self'
            else:
                conn = Connection.objects.filter(
                    (Q(user_from=request.user, user_to=u) | Q(user_from=u, user_to=request.user))
                ).first()
                if conn:
                    connection_id = conn.id
                    if conn.status == 'accepted':
                        connection_status = 'accepted'
                    elif conn.user_from == request.user:
                        connection_status = 'pending'
                    else:
                        connection_status = 'received'

        results.append({
            'id': u.id,
            'username': u.username,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'profile_pic': u.profile_picture.url if u.profile_picture else None,
            'role': u.role,
            'email': u.email,
            'connection_status': connection_status,
            'connection_id': connection_id
        })
    
    return JsonResponse({'users': results})