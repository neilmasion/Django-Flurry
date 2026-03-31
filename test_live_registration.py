import requests
import re

session = requests.Session()

# 1. Get the registration page
url = "https://awsccflurr.me/account/"
response = session.get(url)

if response.status_code != 200:
    print(f"Failed to load page. Status: {response.status_code}")
    exit(1)

# Extract CSRF token
csrf_token_match = re.search(r'name="csrfmiddlewaretoken" value="([^"]+)"', response.text)
if not csrf_token_match:
    print("Could not find CSRF token.")
    exit(1)
    
csrf_token = csrf_token_match.group(1)
print(f"Found CSRF token: {csrf_token}")

# 2. Submit the registration form
post_data = {
    'csrfmiddlewaretoken': csrf_token,
    'username': 'neilmasion1234',
    'first_name': 'Neil',
    'last_name': 'Masion',
    'email': 'neilmasion1234@gmail.com',
    'school': 'University of Testing',
    'course': 'IT',
    'year_level': '1st',
    'password1': 'StrongTestPass123!',
    'password2': 'StrongTestPass123!',
}

headers = {
    'Referer': url,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

print("Submitting registration...")
post_url = "https://awsccflurr.me/account/" # Or whatever the register endpoint maps to
# Actually, the form action might be /account/ or /register/ depending on urls.py
# Let's post to the same URL for now, or check generic action redirect. The action in form is {% url 'register' %}
post_response = session.post("https://awsccflurr.me/register/", data=post_data, headers=headers, allow_redirects=False)

print(f"Response Status: {post_response.status_code}")

if post_response.status_code == 500:
    print("500 Internal Server Error encountered.")
elif post_response.status_code == 302:
    print(f"Redirected to: {post_response.headers.get('Location')}")
    print("Registration likely successful!")
else:
    print("Registration failed or didn't redirect.")
    print(post_response.text[:500])
