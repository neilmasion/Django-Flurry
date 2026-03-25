from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from base import views

urlpatterns = [
    path('admin/', views.admin_dashboard, name='admin-dashboard'),
    path('manager_console/', views.admin_dashboard, name='manager-console'),
    path('', include('base.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)