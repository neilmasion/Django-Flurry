# Django Flurry

A comprehensive Django-based web application designed to manage community events, user roles, testimonials, and workshop registrations.

## 🚀 Features

### 🔐 1. Advanced Authentication & User Profiles
*   **Email-based Login:** Users log in securely using their email and passwords.
*   **Detailed User Profiles:** Upon registration, users can select their Course (IT, CS, etc.) and Year Level. 
*   **Role-Based Access Control (RBAC):** Users are assigned roles (`Admin`, `Officer`, or regular `Member`), which control what they can see and do on the site.

### 🛠️ 2. Admin & Officer Dashboard Capabilities
*   **User Management:** Admins can change user roles (promote to Officer or demote) and delete user accounts. Officers have restricted privileges to prevent them from accidentally deleting users or changing roles.
*   **Event Management:** Admins can manage events and workshops (including deleting old ones).
*   **Login Error Handling:** An invalid login on the admin page correctly displays an on-page error message instead of redirecting the user away.
*   **"Back to Site" Navigation:** Admins have a convenient button to quickly return to the main public-facing website.

### 📅 3. Events & Workshop Catalog
*   **Diverse Event Types:** The system supports Featured Events, Workshops, and Tech Talks.
*   **Event Details:** Displays scheduling (day, month, time), location, dynamic "spots left" tracking, and skill levels (Beginner, Intermediate, Advanced).
*   **Workshop Registration:** Members can register for workshops, and their registrations properly sync and display on their personal User Profile page.

### 💬 4. Testimonial System
*   **User Submissions:** Members can write and submit testimonials about their experiences.
*   **Moderation Workflow:** Testimonials don't go live immediately. Admins have a dashboard to review, approve, or delete pending testimonials before they appear on the site.

### 📬 5. Public Pages & Interactivity
*   **Working Contact Form:** The public contact form correctly captures messages, subjects, and emails, saving them securely to the database.
*   **Dynamic Analytics/Stats:** A dedicated model handles community statistics (like 120+ members, 30+ workshops, etc.) so they can be easily updated via the admin panel.

---

## 💻 Local Setup Instructions

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

## 📱 How to View the Website on Other Devices (Phones, Tablets, etc.)

If you want to test how your website looks on your phone or share it with another device on the **same Wi-Fi network**, follow these steps:

### Step 1: Find your computer's local IP address
* **Windows:** Open Command Prompt (cmd) and type `ipconfig`. Look for the "IPv4 Address" under your active Wi-Fi or Ethernet adapter (it will look something like `192.168.x.x` or `10.0.x.x`).
* **Mac:** Open System Settings > Network > Wi-Fi > Details. You will see your IP address listed there.

### Step 2: Allow network traffic in Django
Before another device can connect, you must explicitly allow it in Django's settings.
1. Open `flurry_project/settings.py` in your code editor.
2. Find the line `ALLOWED_HOSTS = []`.
3. Change it to allow all local IPs by setting it to `['*']` *temporarily* for local testing, or explicitly add your IP address like `ALLOWED_HOSTS = ['192.168.1.5', 'localhost', '127.0.0.1']`.

### Step 3: Run the server on the network
Instead of the standard `runserver` command, tell Django to listen on all network interfaces by adding `0.0.0.0:8000`:
```bash
python manage.py runserver 0.0.0.0:8000
```

### Step 4: Open it on your phone
1. Make sure your phone is connected to the exact same Wi-Fi network as your computer.
2. Open the web browser on your phone.
3. Type in your computer's IP address followed by `:8000`. 
   * *Example:* `http://192.168.1.5:8000`

> **Note:** Do not forget the `http://` part, sometimes mobile browsers force `https://` by default, which won't work for local Django servers.
