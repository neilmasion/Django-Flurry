from base.models import Notification

def notifications_context(request):
    if request.user.is_authenticated:
        # Show all notifications (read + unread) in the dropdown
        all_notifications = request.user.notifications.all().order_by('-created_at')[:10]
        unread_count = request.user.notifications.filter(is_read=False).count()
        return {
            'unread_notifications_count': unread_count,
            'all_notifications': all_notifications,
        }
    return {'unread_notifications_count': 0, 'all_notifications': []}
