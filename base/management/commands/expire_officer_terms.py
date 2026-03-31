from django.core.management.base import BaseCommand
from django.utils import timezone

from base.models import Notification, User


class Command(BaseCommand):
    help = 'Demote officers whose term has ended.'

    def handle(self, *args, **options):
        today = timezone.now().date()
        expired_officers = User.objects.filter(
            role='officer',
            officer_ends_at__isnull=False,
            officer_ends_at__lt=today,
        )

        updated_count = 0
        for user in expired_officers:
            user.role = 'member'
            if not user.is_superuser:
                user.is_staff = False
            user.department = None
            user.officer_started_at = None
            user.officer_ends_at = None
            user.save(update_fields=['role', 'is_staff', 'department', 'officer_started_at', 'officer_ends_at'])

            Notification.objects.create(
                user=user,
                message='Your officer term has ended and your account has been moved back to member.',
                link='/profile/'
            )
            updated_count += 1

        self.stdout.write(self.style.SUCCESS(f'Auto-demoted {updated_count} officer(s).'))
