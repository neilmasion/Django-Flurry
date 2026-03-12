import time
from selenium import webdriver
from selenium.webdriver.common.by import By

def test_flurry():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    
    try:
        print("Testing Contact Form...")
        driver.get("http://127.0.0.1:8000/contact/")
        time.sleep(1)
        
        driver.find_element(By.ID, "id_name").send_keys("Test User")
        driver.find_element(By.ID, "id_email").send_keys("test@example.com")
        driver.find_element(By.ID, "id_subject").send_keys("Workshops")
        driver.find_element(By.ID, "id_message").send_keys("Hello this is a test.")
        
        # Click submit
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1)
        
        # Check for success message
        try:
            success_msg = driver.find_element(By.CLASS_NAME, "form-success")
            print("Contact Form Submit SUCCESS: Found flash message:", success_msg.text)
        except Exception as e:
            print("Contact Form Submit FAILED: No flash message found", e)
            
        print("\nTesting Events Registration...")
        # First login so we can register
        driver.get("http://127.0.0.1:8000/account/")
        time.sleep(1)
        driver.find_element(By.NAME, "username").send_keys("admin")
        driver.find_element(By.NAME, "password").send_keys("adminpassword")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1)
        
        driver.get("http://127.0.0.1:8000/events/")
        time.sleep(1)
        
        # Click first register button
        enroll_btns = driver.find_elements(By.CLASS_NAME, "enroll-btn")
        if enroll_btns:
            enroll_btns[0].click()
            time.sleep(1)
            
            # Check local storage directly
            enrolled = driver.execute_script("return window.localStorage.getItem('enrolledWorkshops');")
            print(f"LocalStorage 'enrolledWorkshops': {enrolled}")
            
            # Go to profile
            driver.get("http://127.0.0.1:8000/profile/")
            time.sleep(1)
            
            # Switch to Workshops tab
            tabs = driver.find_elements(By.CLASS_NAME, "profile-tab")
            for tab in tabs:
                if tab.text == "Workshops":
                    tab.click()
                    break
            time.sleep(1)
            
            # Check if grid has items
            grid = driver.find_element(By.ID, "enrolledGrid")
            print(f"Enrolled Grid Content: {grid.get_attribute('innerHTML')[:100]}...")
            if "No workshops yet" not in grid.text:
                print("Events Registration Display SUCCESS!")
            else:
                print("Events Registration Display FAILED: 'No workshops yet' is still showing")
                
            # Check badge
            enrolled_stat = driver.find_element(By.ID, "statEnrolled").text
            print(f"Enrolled Stat count: {enrolled_stat}")
            
    finally:
        driver.quit()

if __name__ == "__main__":
    test_flurry()
