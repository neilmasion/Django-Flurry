from django.urls import path, include
from base import views

urlpatterns = [
    path('admin/', views.admin_dashboard, name='admin-dashboard'),
    path('manager_console/', views.admin_dashboard, name='manager-console'),
    path('', include('base.urls')),
]