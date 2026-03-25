# Django Flurry

A comprehensive Django-based web application designed to manage community events, user roles, testimonials, and workshop registrations.

## Features

### 1. Advanced Authentication & User Profiles
*   **Email-based Login:** Users log in securely using their email and passwords.
*   **Detailed User Profiles:** Upon registration, users can select their Course (IT, CS, etc.) and Year Level. 
*   **Role-Based Access Control (RBAC):** Users are assigned roles (`Admin`, `Officer`, or regular `Member`), which control what they can see and do on the site.

### 2. Admin & Officer Dashboard Capabilities
*   **User Management:** Admins can change user roles (promote to Officer or demote) and delete user accounts. Officers have restricted privileges to prevent them from accidentally deleting users or changing roles.
*   **Event Management:** Admins can manage events and workshops (including deleting old ones).
*   **Login Error Handling:** An invalid login on the admin page correctly displays an on-page error message instead of redirecting the user away.
*   **"Back to Site" Navigation:** Admins have a convenient button to quickly return to the main public-facing website.
*   **Officer Hierarchy:** The About page features a premium, animated organizational structure for club departments and roles.

### 3. Events & Workshop Catalog
*   **Diverse Event Types:** The system supports Featured Events, Workshops, and Tech Talks.
*   **Event Details:** Displays scheduling (day, month, time), location, dynamic "spots left" tracking, and skill levels (Beginner, Intermediate, Advanced).
*   **Workshop Registration:** Members can register for workshops, and their registrations properly sync across the Home and Events pages, providing a consistent "Enrolled ✓" status.
*   **Profile Sync:** Registered workshops are also displayed on the user's personal User Profile page.

### 4. Testimonial System
*   **User Submissions:** Members can write and submit testimonials about their experiences.
*   **Moderation Workflow:** Testimonials don't go live immediately. Admins have a dashboard to review, approve, or delete pending testimonials before they appear on the site.

### 5. Public Pages & Interactivity
*   **Working Contact Form:** The contact page is public for all visitors, but form submission is restricted to logged-in users to ensure verified inquiries and prevent spam. It correctly captures messages, subjects, and emails, saving them securely to the database.
*   **Dynamic Analytics/Stats:** A dedicated model handles community statistics (like 120+ members, 30+ workshops, etc.) so they can be easily updated via the admin panel.

---

## Local Setup Instructions

Follow these steps to run the application on your computer:

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd "Django Flurry"
   ```

2. **Create and activate a virtual environment:**
   * **Windows:**
     ```bash
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   * **Mac/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Run the development server:**
   ```bash
   python manage.py runserver
   ```
   Open your browser and navigate to `http://127.0.0.1:8000` to view the website.

---

## Use Neon Postgres Locally

1. Create a Neon database and copy the connection string.
2. Add an environment file based on `.env.example`.
3. Set `DATABASE_URL` like this:
   - `postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`
4. Install dependencies and run migrations:
   - `pip install -r requirements.txt`
   - `python manage.py migrate`

When `DATABASE_URL` is present, the project uses Postgres automatically.

---

## Deploy to Railway

1. Push this repository to GitHub.
2. In Railway, create a new project and choose Deploy from GitHub.
3. Set these Railway environment variables:
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS=.railway.app`
   - `DJANGO_CSRF_TRUSTED_ORIGINS=https://YOUR-APP.up.railway.app`
   - `DATABASE_URL` (your Neon URL with `sslmode=require`)
   - `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (optional if you use email features)
4. Railway will run the `Procfile` command:
   - `python manage.py migrate`
   - `python manage.py collectstatic`
   - `gunicorn flurry_project.wsgi`
5. Open the Railway public URL and verify the app is live.

---

## Deploy to Render (Recommended if Railway trial expired)

This repo now includes a Render blueprint file: `render.yaml`.

1. Push this repository to GitHub (already done if you're up to date).
2. In Render, choose **New +** > **Blueprint**.
3. Connect your GitHub repo and select this project.
4. Render reads `render.yaml` automatically.
5. Set required secret environment variables in Render:
   - `DJANGO_SECRET_KEY`
   - `DATABASE_URL` (Neon URL with `sslmode=require`)
   - `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (if email features are used)
6. Click **Apply** to deploy.

Render will run:
- Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start: `python manage.py migrate --noinput && gunicorn flurry_project.wsgi --log-file - --workers 2 --threads 4`

After deploy, open your Render URL and test login, media, and database writes.

---
