"""
streamlit_app.py
================
Root deployment entrypoint for NetShield-AI on Streamlit Community Cloud.
Automatically detected by Streamlit Community Cloud upon repository selection.
"""

import os
import sys

# Ensure repository root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Execute the core Streamlit frontend application
frontend_script = os.path.join(PROJECT_ROOT, "app", "frontend.py")
with open(frontend_script, "r", encoding="utf-8") as f:
    code = f.read()

exec(compile(code, frontend_script, "exec"), globals())
