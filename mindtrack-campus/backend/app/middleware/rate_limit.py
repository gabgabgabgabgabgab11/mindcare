from slowapi import Limiter
from slowapi.util import get_remote_address

# One shared Limiter instance, imported by both main.py (registration)
# and any route module that needs @limiter.limit(...).
# key_func=get_remote_address means limits are tracked per client IP —
# sufficient for a capstone; a production system behind a load
# balancer would need X-Forwarded-For handling, which is out of scope
limiter = Limiter(key_func=get_remote_address)