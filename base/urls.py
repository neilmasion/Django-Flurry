from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.index, name='index'),
    path('events/', views.events_list, name='events'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('profile/', views.profile, name='profile'),
    path('update-profile/', views.update_profile, name='update-profile'),
    path('account/', views.account, name='account'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('delete-user/<int:user_id>/', views.delete_user, name='delete-user'),
    path('create-event/', views.create_event, name='create-event'),
    path('edit-event/<int:event_id>/', views.edit_event, name='edit-event'),
    path('delete-event/<int:event_id>/', views.delete_event, name='delete-event'),
    path('submit-testimonial/', views.submit_testimonial, name='submit-testimonial'),
    path('enroll-event/<int:event_id>/', views.enroll_event, name='enroll-event'),
    path('sync-enrollments/', views.sync_enrollments, name='sync-enrollments'),
    path('approve-testimonial/<int:testimonial_id>/', views.approve_testimonial, name='approve-testimonial'),
    path('delete-testimonial/<int:testimonial_id>/', views.delete_adm_testimonial, name='delete-testimonial'),
    path('update-role/<int:user_id>/', views.update_role, name='update-role'),
    path('apply-for-officer/', views.apply_for_officer, name='apply-for-officer'),
    path('handle-officer-application/<int:app_id>/', views.handle_officer_application, name='handle-officer-application'),
    path('notification-read/<int:notification_id>/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications-mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    path('notifications-clear-all/', views.clear_all_notifications, name='clear-all-notifications'),
    
    # Email Verification
    path('send-verification-email/', views.send_verification_email, name='send-verification-email'),
    path('verify-email/<uuid:token>/', views.verify_email, name='verify-email'),
    path('verify-email-sent/', views.verify_email_sent, name='verify-email-sent'),
    
    # Password Reset
    path('password-reset/', auth_views.PasswordResetView.as_view(template_name='registration/password_reset_form.html'), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(template_name='registration/password_reset_done.html'), name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name='registration/password_reset_confirm.html'), name='password_reset_confirm'),
    path('password-reset-complete/', auth_views.PasswordResetCompleteView.as_view(template_name='registration/password_reset_complete.html'), name='password_reset_complete'),
]
