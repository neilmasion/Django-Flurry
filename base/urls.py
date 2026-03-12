from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('events/', views.events_list, name='events'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('profile/', views.profile, name='profile'),
    path('account/', views.account, name='account'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('delete-user/<int:user_id>/', views.delete_user, name='delete-user'),
    path('delete-event/<int:event_id>/', views.delete_event, name='delete-event'),
    path('submit-testimonial/', views.submit_testimonial, name='submit-testimonial'),
    path('approve-testimonial/<int:testimonial_id>/', views.approve_testimonial, name='approve-testimonial'),
    path('delete-testimonial/<int:testimonial_id>/', views.delete_adm_testimonial, name='delete-testimonial'),
    path('update-role/<int:user_id>/', views.update_role, name='update-role'),
]