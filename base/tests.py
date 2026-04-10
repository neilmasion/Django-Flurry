from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from .models import ActivityLog, Connection, Enrollment, Event, Testimonial


class EventCapacityModelTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			email='member@example.com',
			username='member',
			password='password123',
		)

	def test_total_capacity_falls_back_to_spots_left_text(self):
		event = Event.objects.create(
			title='Fallback Event',
			description='desc',
			day='10',
			month='APR',
			time_range='10:00 AM - 12:00 PM',
			location='Room A',
			spots_left='20 spots left',
			event_type='workshop',
		)

		self.assertEqual(event.total_capacity, 20)

	def test_total_capacity_prefers_numeric_field(self):
		event = Event.objects.create(
			title='Numeric Event',
			description='desc',
			day='11',
			month='APR',
			time_range='1:00 PM - 3:00 PM',
			location='Room B',
			spots_left='99 spots left',
			spots_capacity=25,
			event_type='workshop',
		)

		self.assertEqual(event.total_capacity, 25)

	def test_spots_remaining_uses_enrollment_count(self):
		event = Event.objects.create(
			title='Capacity Event',
			description='desc',
			day='12',
			month='APR',
			time_range='2:00 PM - 4:00 PM',
			location='Room C',
			spots_left='2 spots left',
			spots_capacity=2,
			event_type='workshop',
		)

		Enrollment.objects.create(user=self.user, event=event)
		self.assertEqual(event.spots_remaining, 1)
		self.assertFalse(event.is_full)


class ConnectionConstraintTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()

	def test_cannot_create_self_connection(self):
		user = self.user_model.objects.create_user(
			email='self@example.com',
			username='selfuser',
			password='password123',
		)

		with self.assertRaises(IntegrityError):
			with transaction.atomic():
				Connection.objects.create(user_from=user, user_to=user, status='pending')


class TestimonialAccessTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.admin_user = self.user_model.objects.create_user(
			email='admin@example.com',
			username='adminuser',
			password='password123',
			role='admin',
			is_staff=True,
		)
		self.officer_user = self.user_model.objects.create_user(
			email='officer@example.com',
			username='officeruser',
			password='password123',
			role='officer',
			is_staff=True,
		)
		self.testimonial = Testimonial.objects.create(
			quote='Great club!',
			author_name='Student One',
			author_role='IT - 3rd Year',
			author_initials='SO',
		)

	def test_officer_cannot_approve_testimonial(self):
		self.client.login(username='officer@example.com', password='password123')
		response = self.client.post(reverse('approve-testimonial', args=[self.testimonial.id]))

		self.assertRedirects(response, reverse('admin-dashboard'))
		self.testimonial.refresh_from_db()
		self.assertFalse(self.testimonial.is_approved)

	def test_admin_can_approve_testimonial(self):
		self.client.login(username='admin@example.com', password='password123')
		response = self.client.post(reverse('approve-testimonial', args=[self.testimonial.id]))

		self.assertRedirects(response, reverse('admin-dashboard'))
		self.testimonial.refresh_from_db()
		self.assertTrue(self.testimonial.is_approved)

	def test_officer_dashboard_hides_testimonial_section(self):
		self.client.login(username='officer@example.com', password='password123')
		response = self.client.get(reverse('admin-dashboard'))

		self.assertEqual(response.status_code, 200)
		self.assertNotContains(response, 'data-section="testimonials"')
		self.assertNotContains(response, 'Testimonials & Feedback')


class LoginEmailVerificationTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.admin_user = self.user_model.objects.create_user(
			email='loginadmin@example.com',
			username='loginadmin',
			password='password123',
			role='admin',
			is_staff=True,
			is_email_verified=False,
		)
		self.officer_user = self.user_model.objects.create_user(
			email='loginofficer@example.com',
			username='loginofficer',
			password='password123',
			role='officer',
			is_staff=True,
			is_email_verified=False,
		)

	def test_unverified_admin_can_login(self):
		response = self.client.post(reverse('login'), {
			'email': 'loginadmin@example.com',
			'password': 'password123',
		})

		self.assertRedirects(response, reverse('index'))
		self.assertEqual(int(self.client.session.get('_auth_user_id')), self.admin_user.id)

	def test_unverified_officer_must_verify_before_login(self):
		response = self.client.post(reverse('login'), {
			'email': 'loginofficer@example.com',
			'password': 'password123',
		})

		self.assertRedirects(response, reverse('verify-email-sent'))
		self.assertEqual(self.client.session.get('verification_email'), 'loginofficer@example.com')
		self.assertIsNone(self.client.session.get('_auth_user_id'))


class AdminProfileVerificationUiTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.admin_user = self.user_model.objects.create_user(
			email='profileadmin@example.com',
			username='profileadmin',
			password='password123',
			role='admin',
			is_staff=True,
			is_email_verified=False,
		)

	def test_admin_profile_hides_unverified_badge_and_verify_button(self):
		self.client.login(username='profileadmin@example.com', password='password123')
		response = self.client.get(reverse('profile'))

		self.assertEqual(response.status_code, 200)
		self.assertNotContains(response, 'Unverified')
		self.assertNotContains(response, 'Verify Email')


class ActivityLogDashboardTests(TestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.admin_user = self.user_model.objects.create_user(
			email='activityadmin@example.com',
			username='activityadmin',
			password='password123',
			role='admin',
			is_staff=True,
		)
		self.officer_user = self.user_model.objects.create_user(
			email='activityofficer@example.com',
			username='activityofficer',
			password='password123',
			role='officer',
			is_staff=True,
		)

	def test_create_event_generates_activity_log(self):
		self.client.force_login(self.officer_user)
		response = self.client.post(reverse('create-event'), {
			'title': 'Ops Planning',
			'description': 'Weekly operations planning',
			'day': '10',
			'month': 'APR',
			'time_range': '1:00 PM - 2:00 PM',
			'location': 'Lab 1',
			'spots_left': '30',
			'event_type': 'workshop',
		})

		self.assertRedirects(response, reverse('admin-dashboard'))
		self.assertTrue(ActivityLog.objects.filter(actor=self.officer_user, action_type='event_create').exists())

	def test_admin_dashboard_displays_recent_activity_summary(self):
		ActivityLog.objects.create(
			actor=self.officer_user,
			action_type='event_create',
			summary='Created event: Ops Planning.',
		)

		self.client.force_login(self.admin_user)
		response = self.client.get(reverse('admin-dashboard'))

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Recent Activities')
		self.assertContains(response, 'Created event: Ops Planning.')