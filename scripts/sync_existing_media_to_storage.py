import argparse
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flurry_project.settings")

database_url = os.getenv("DATABASE_URL", "")
if not database_url or "YOUR_RENDER_DATABASE_URL" in database_url or "YOUR_" in database_url:
    raise SystemExit(
        "DATABASE_URL is missing or still a placeholder. Set DATABASE_URL to your real Render/Neon PostgreSQL URL before running this script."
    )

import django

django.setup()

from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage

from base.models import ShowcaseImage, User


def sync_field_file(obj, field_name: str, commit: bool) -> tuple[str, str]:
    field_file = getattr(obj, field_name)
    if not field_file:
        return ("skip", "empty")

    storage_name = field_file.name
    if default_storage.exists(storage_name):
        return ("ok", "already-in-storage")

    local_path = Path(settings.MEDIA_ROOT) / storage_name
    if not local_path.exists():
        return ("missing", str(local_path))

    if not commit:
        return ("would-upload", storage_name)

    with local_path.open("rb") as handle:
        saved_name = default_storage.save(storage_name, File(handle))

    if saved_name != storage_name:
        setattr(obj, field_name, saved_name)
        obj.save(update_fields=[field_name])
        return ("uploaded", f"renamed:{saved_name}")

    return ("uploaded", saved_name)


def run(commit: bool) -> None:
    print("Storage backend:", default_storage.__class__.__name__)
    print("Media root:", settings.MEDIA_ROOT)
    print("Commit mode:", commit)

    stats = {
        "ok": 0,
        "uploaded": 0,
        "would-upload": 0,
        "missing": 0,
        "skip": 0,
    }

    print("\nSyncing User.profile_picture...")
    for user in User.objects.exclude(profile_picture=""):
        status, detail = sync_field_file(user, "profile_picture", commit)
        stats[status] += 1
        print(f"User {user.id} ({user.email}): {status} -> {detail}")

    print("\nSyncing ShowcaseImage.image...")
    for image in ShowcaseImage.objects.all():
        status, detail = sync_field_file(image, "image", commit)
        stats[status] += 1
        print(f"ShowcaseImage {image.id}: {status} -> {detail}")

    print("\nSummary:")
    for key in ["uploaded", "would-upload", "ok", "missing", "skip"]:
        print(f"{key}: {stats[key]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Sync existing local media files into configured Django storage (e.g. Cloudinary)."
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Actually upload files. Without this flag, runs in dry-run mode.",
    )
    args = parser.parse_args()

    run(commit=args.commit)
