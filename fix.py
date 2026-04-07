with open('templates/admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="section-testimonials"' in line:
        start_testimonials = i
    if 'id="section-users"' in line:
        start_users = i

end_testimonials = -1
for i, line in enumerate(lines[start_testimonials:]):
    if '</section>' in line:
        end_testimonials = start_testimonials + i
        break

testimonials_block = lines[start_testimonials:end_testimonials+1]
del lines[start_testimonials:end_testimonials+1]

lines.insert(start_users - 1, '\n')
for line in reversed(testimonials_block):
    lines.insert(start_users - 1, line)
lines.insert(start_users - 1, '\n')

with open('templates/admin.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)
