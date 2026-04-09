import requests
from base.models import Showcase

suspended_phrase = "this service has been suspended by its owner"
checked = []
flagged_ids = []

for s in Showcase.objects.filter(is_approved=True).exclude(website_url=''):
    url = s.website_url.strip()
    status = 'unknown'
    note = ''
    try:
        r = requests.get(url, timeout=10, allow_redirects=True)
        body = (r.text or '').lower()
        if suspended_phrase in body:
            status = 'suspended'
            flagged_ids.append(s.id)
        else:
            status = f'ok:{r.status_code}'
    except Exception as e:
        status = 'error'
        note = str(e)
    checked.append((s.id, url, status, note))

if flagged_ids:
    Showcase.objects.filter(id__in=flagged_ids).update(is_approved=False)

print('CHECKED_COUNT', len(checked))
print('FLAGGED_COUNT', len(flagged_ids))
for row in checked:
    sid, url, status, note = row
    if status == 'suspended':
        print('FLAGGED', sid, url)
print('DONE')
