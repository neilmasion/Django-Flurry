from pathlib import Path

from django.core.files.storage import FileSystemStorage


class NormalizedFileSystemStorage(FileSystemStorage):
    """Resolve legacy media names to existing local files for localhost rendering."""

    IMAGE_EXT_PRIORITY = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

    def _normalize_name(self, name):
        if name and name.startswith("media/"):
            return name[len("media/") :]
        return name

    def _resolve_legacy_name(self, name):
        normalized = self._normalize_name(name)
        if not normalized:
            return normalized

        if self.exists(normalized):
            return normalized

        rel_path = Path(normalized)
        base_dir = Path(self.location) / rel_path.parent
        if not base_dir.exists() or not base_dir.is_dir():
            return normalized

        stem = rel_path.stem if rel_path.suffix else rel_path.name
        candidate_stems = [stem]
        if "_" in stem:
            candidate_stems.append(stem.rsplit("_", 1)[0])

        files = [p for p in base_dir.iterdir() if p.is_file()]

        # Prefer exact stem matches with common image extensions.
        for expected_ext in self.IMAGE_EXT_PRIORITY:
            for base_stem in candidate_stems:
                exact = next((p for p in files if p.stem == base_stem and p.suffix.lower() == expected_ext), None)
                if exact is not None:
                    return str((rel_path.parent / exact.name).as_posix())

        # Fallback to first file that starts with the most likely stem.
        for base_stem in candidate_stems:
            starts_with = next((p for p in files if p.stem.startswith(base_stem)), None)
            if starts_with is not None:
                return str((rel_path.parent / starts_with.name).as_posix())

        return normalized

    def url(self, name):
        return super().url(self._resolve_legacy_name(name))
