from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from .models import MemberStats, Event, WorkshopCatalogItem, Testimonial, User, ContactMessage
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
    stats = MemberStats.objects.first()
    featured_events = Event.objects.filter(is_featured=True)[:1]
    other_events = Event.objects.filter(is_featured=False)[:3]
    testimonials = Testimonial.objects.filter(is_approved=True)
    
    context = {
        'stats': stats,
        'featured_events': featured_events,
        'other_events': other_events,
        'testimonials': testimonials,
    }
    return render(request, 'index.html', context)

def events_list(request):
    featured_events = Event.objects.filter(is_featured=True)
    other_events = Event.objects.filter(is_featured=False)
    workshops = WorkshopCatalogItem.objects.all()
    
    context = {
        'featured_events': featured_events,
        'other_events': other_events,
        'workshops': workshops,
    }
    return render(request, 'events.html', context)

def about(request):
    return render(request, 'about.html')

def contact(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
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
    
    total_users = User.objects.count()
    total_events = Event.objects.count()
    total_messages = ContactMessage.objects.count()
    recent_users = User.objects.order_by('-date_joined')[:5]
    all_users = User.objects.all().order_by('-date_joined')
    all_events = Event.objects.all().order_by('-id')
    all_messages = ContactMessage.objects.all().order_by('-created_at')
    all_testimonials = Testimonial.objects.all().order_by('-id')
    
    context = {
        'total_users': total_users,
        'total_events': total_events,
        'total_messages': total_messages,
        'recent_users': recent_users,
        'all_users': all_users,
        'all_events': all_events,
        'all_messages': all_messages,
        'all_testimonials': all_testimonials,
    }
    return render(request, 'admin.html', context)

def profile(request):
    if not request.user.is_authenticated:
        return redirect('account')
    return render(request, 'profile.html')

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
def delete_event(request, event_id):
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        event.delete()
        messages.success(request, f'Event {event.title} deleted.')
        return redirect('admin-dashboard')
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