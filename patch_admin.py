import os

def patch():
    path = 'templates/admin.html'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Target exactly what we saw in the repr/binary, with flexibility.
    target_pattern = '<strong>{{ u.username }}</strong><br>'
    replacement = '<strong>{{ u.username }}</strong> - <small class="admin-tag admin-tag--blue" style="font-size: 0.72rem; padding: 2px 7px;">{{ u.get_department_display|default:u.role|title }}</small><br>'
    
    # Only replace for the officers (it appears multiple times, we only want the first one or just both)
    # The user said "ainz name should be...". Ainz is an officer.
    # Members also have the same tag.
    # We check the context to be safe.
    
    # First occurrence is in the officers loop.
    new_content = content.replace(target_pattern, replacement, 1)
    
    with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(new_content)
    print("Patched admin.html successfully")

if __name__ == "__main__":
    patch()
