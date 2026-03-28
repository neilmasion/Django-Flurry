from pathlib import Path
import os

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
# Accept either key name so cloud env naming differences do not crash startup.
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('DJANGO_SECRET_KEY or SECRET_KEY is required')

DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() == 'true'

allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
default_allowed_hosts = ['127.0.0.1', 'localhost', '.railway.app', '.onrender.com']
for host in default_allowed_hosts:
    if host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host)

if os.getenv('RENDER', '').lower() == 'true':
    allow_all_on_render = os.getenv('DJANGO_ALLOW_ALL_HOSTS_ON_RENDER', 'true').lower() == 'true'
    if allow_all_on_render:
        ALLOWED_HOSTS = ['*']

csrf_trusted_origins_env = os.getenv('DJANGO_CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_trusted_origins_env.split(',') if o.strip()]

render_external_hostname = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_external_hostname:
    if render_external_hostname not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(render_external_hostname)
    render_origin = f'https://{render_external_hostname}'
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'base',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'flurry_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'base.context_processors.notifications_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'flurry_project.wsgi.application'
database_url = os.getenv('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': dj_database_url.parse(database_url, conn_max_age=600, ssl_require=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
USE_S3_MEDIA = os.getenv('USE_S3_MEDIA', 'False').lower() == 'true'

cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY', '')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET', '')
cloudinary_creds_present = all([
    cloudinary_cloud_name,
    cloudinary_api_key,
    cloudinary_api_secret,
])
USE_CLOUDINARY_MEDIA = os.getenv('USE_CLOUDINARY_MEDIA', 'False').lower() == 'true' or cloudinary_creds_present

if USE_CLOUDINARY_MEDIA:
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': cloudinary_cloud_name,
        'API_KEY': cloudinary_api_key,
        'API_SECRET': cloudinary_api_secret,
        'SECURE': True,
    }

    STORAGES = {
        'default': {
            'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
        }
    }

    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
elif USE_S3_MEDIA:
    aws_storage_bucket_name = os.getenv('AWS_STORAGE_BUCKET_NAME', '')
    aws_s3_region_name = os.getenv('AWS_S3_REGION_NAME', '')
    aws_s3_custom_domain = os.getenv('AWS_S3_CUSTOM_DOMAIN', '')

    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_STORAGE_BUCKET_NAME = aws_storage_bucket_name
    AWS_S3_REGION_NAME = aws_s3_region_name
    AWS_QUERYSTRING_AUTH = os.getenv('AWS_QUERYSTRING_AUTH', 'False').lower() == 'true'
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False

    if aws_s3_custom_domain:
        media_domain = aws_s3_custom_domain
    elif aws_storage_bucket_name and aws_s3_region_name:
        media_domain = f'{aws_storage_bucket_name}.s3.{aws_s3_region_name}.amazonaws.com'
    else:
        media_domain = ''

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
        }
    }

    MEDIA_URL = f'https://{media_domain}/' if media_domain else '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
        }
    }

    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'base.User'
LOGIN_URL = '/account/'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    SECURE_SSL_REDIRECT = os.getenv('DJANGO_SECURE_SSL_REDIRECT', 'True').lower() == 'true'
    SECURE_HSTS_SECONDS = int(os.getenv('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True').lower() == 'true'
    SECURE_HSTS_PRELOAD = os.getenv('DJANGO_SECURE_HSTS_PRELOAD', 'True').lower() == 'true'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.sendgrid.net')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '10'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'apikey')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Flurry <no-reply@example.com>')
