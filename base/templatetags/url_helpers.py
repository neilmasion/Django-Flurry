from django import template

register = template.Library()


@register.filter
def normalize_url(value):
    """Ensure external links have a scheme so browser opens them correctly."""
    if not value:
        return '#'

    value = str(value).strip()
    if value.startswith(('http://', 'https://', '//')):
        return value

    return f'https://{value}'
