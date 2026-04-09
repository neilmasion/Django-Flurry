# ERD Update Checklist

Use this checklist to align your diagram with the current Django schema.

## Source of truth
- Models file: base/models.py
- Latest schema migration for these updates: base/migrations/0032_event_spots_capacity_and_more.py

## Entities to include
- User
- ContactMessage
- MemberStats
- Event
- WorkshopCatalogItem
- Testimonial
- OfficerApplication
- Notification
- Connection
- Enrollment
- Showcase
- ShowcaseImage
- ShowcaseComment
- Showcase_likes (auto M2M join table)
- Showcase_saves (auto M2M join table)

## Field updates required in diagram
- Event
  - Add spots_capacity (PositiveInteger, nullable)
  - Keep spots_left (CharField) only as display/backward-compatible text

## Relationship checks
- ContactMessage.user -> User (FK, nullable)
- OfficerApplication.user -> User (FK)
- Notification.user -> User (FK)
- Enrollment.user -> User (FK)
- Enrollment.event -> Event (FK)
- Showcase.user -> User (FK)
- ShowcaseImage.showcase -> Showcase (FK)
- ShowcaseComment.showcase -> Showcase (FK)
- ShowcaseComment.user -> User (FK)
- ShowcaseComment.parent -> ShowcaseComment (self FK, nullable)
- Connection.user_from -> User (FK)
- Connection.user_to -> User (FK)
- Showcase.likes <-> User (M2M, join table base_showcase_likes)
- Showcase.saves <-> User (M2M, join table base_showcase_saves)

## Constraints to reflect (notes or annotations)
- Enrollment unique pair: (user, event)
- Connection unique pair: (user_from, user_to)
- Connection check constraint: user_from != user_to
- User.email is unique

## Indexes to reflect (optional in visual ERD, required in docs)
- Event: (date, event_type)
- Notification: (user, is_read, -created_at)
- Connection: (user_to, status, -created_at)
- Connection: (user_from, status, -created_at)
- Enrollment: (event, -enrolled_at)
- Enrollment: (user, -enrolled_at)
- ShowcaseComment: (showcase, -created_at)
- ShowcaseComment: (user, -created_at)

## Verification steps
1. Run: c:/Users/Dell/Desktop/Django-Flurry/.venv/Scripts/python.exe manage.py makemigrations --check
2. Confirm output is: No changes detected
3. If your ERD tool supports reverse-engineering, regenerate from DB and verify Event includes spots_capacity
4. If your ERD tool does not show check constraints/indexes, add them as text annotations

## Exact code anchors
- Event class: base/models.py:111
- Event.spots_capacity: base/models.py:124
- Event index meta: base/models.py:132
- Notification index meta: base/models.py:239
- Connection unique/check/index meta: base/models.py:259
- Enrollment unique/index meta: base/models.py:280
- Showcase M2M likes/saves: base/models.py:296
- ShowcaseComment indexes: base/models.py:325
