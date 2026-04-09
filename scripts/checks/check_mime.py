import mimetypes
import os

# Check current MIME type for .js
print(f"Before add_type: {mimetypes.guess_type('test.js')}")

# Explicitly add type
mimetypes.add_type("application/javascript", ".js", True)

# Check again
print(f"After add_type: {mimetypes.guess_type('test.js')}")

# Check if WhiteNoise is present and if it might be causing issues
try:
    import whitenoise
    print("WhiteNoise is installed")
except ImportError:
    print("WhiteNoise not installed")
