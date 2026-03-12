from django.contrib import admin
from .models import MemberStats, Event, WorkshopCatalogItem, Testimonial, User, ContactMessage

admin.site.register(User)
admin.site.register(ContactMessage)
admin.site.register(MemberStats)
admin.site.register(Event)
admin.site.register(WorkshopCatalogItem)
admin.site.register(Testimonial)