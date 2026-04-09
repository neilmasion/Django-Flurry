from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Connection, Enrollment, Event


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