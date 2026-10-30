"""Pytest configuration shared by the backend test suite."""

import asyncio
import sys


# Starlette's TestClient uses a socket pair.  On current Windows/Python 3.14
# combinations, the default Proactor policy can hang while creating it.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
