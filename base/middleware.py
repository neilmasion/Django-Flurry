class MimeTypeFixMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        path = request.path.lower()
        
        # Check if it's a JS or CSS file
        if path.endswith('.js') or path.endswith('.mjs'):
            # DEBUG LOG
            print(f"DEBUG: MIME Fix Applied for JS: {path}")
            response['Content-Type'] = 'application/javascript'
            # Force the header as strictly as possible
            response.headers['Content-Type'] = 'application/javascript'
        elif path.endswith('.css'):
            # DEBUG LOG
            print(f"DEBUG: MIME Fix Applied for CSS: {path}")
            response['Content-Type'] = 'text/css'
            response.headers['Content-Type'] = 'text/css'
            
        return response
