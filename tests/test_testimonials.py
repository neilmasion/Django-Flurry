import os
from playwright.sync_api import sync_playwright

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Testing: Logging in as a standard user...")
        page.goto('http://127.0.0.1:8000/account/')
        page.fill('input[name="username"]', 'teststudent')
        page.evaluate('''() => {
            const forms = document.querySelectorAll('form');
            forms.forEach(f => {
                if(f.action.includes('login')) {
                    f.querySelector('input[name="password"]').value = 'student123';
                    f.submit();
                }
            });
        }''')
        page.wait_for_load_state('networkidle')
        
        print("Testing: Submitting a testimonial from Profile...")
        page.goto('http://127.0.0.1:8000/profile/')
        page.click('.profile-tab[data-tab="feedback"]')
        page.fill('#testimonialQuote', 'This is an amazing cloud club!')
        page.click('text="Submit Testimonial"')
        page.wait_for_load_state('networkidle')
        page.goto('http://127.0.0.1:8000/logout/')
        
        print("Testing: Verifying testimonial is hidden by default...")
        page.goto('http://127.0.0.1:8000/')
        content = page.content()
        assert 'This is an amazing cloud club!' not in content, "Testimonial should not be visible before approval!"
        
        print("Testing: Logging in as Admin...")
        page.goto('http://127.0.0.1:8000/manager_console')
        page.fill('#adminEmail', 'testadmin')
        page.fill('#adminPass', 'admin123')
        page.click('text="Sign In"')
        page.wait_for_load_state('networkidle')
        
        print("Testing: Approving the testimonial...")
        page.click('button[data-section="testimonials"]')
        page.evaluate('''() => {
            const approveForms = document.querySelectorAll('form[action*="approve-testimonial"]');
            if(approveForms.length > 0) {
                approveForms[0].submit();
            }
        }''')
        page.wait_for_load_state('networkidle')
        
        print("Testing: Verifying testimonial is visible after approval...")
        page.goto('http://127.0.0.1:8000/')
        content = page.content()
        assert 'This is an amazing cloud club!' in content, "Testimonial should be visible after approval!"

        print("✅ All Testimonial tests passed successfully!")
        browser.close()

if __name__ == '__main__':
    run_test()
