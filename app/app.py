"""
app/app.py
==========
Master launcher for the NetShield-AI GUI and REST API.

Usage:
  python app/app.py              # Launches Streamlit Web GUI directly
  python app/app.py --api        # Launches FastAPI Backend REST Server on port 8000
"""

import os
import sys
import argparse
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def main():
    parser = argparse.ArgumentParser(description="NetShield-AI Application Launcher")
    parser.add_argument("--api", action="store_true", help="Launch FastAPI REST server instead of Streamlit GUI")
    parser.add_argument("--port", type=int, default=8501, help="Port to run the application on")
    args = parser.parse_args()

    if args.api:
        print("[*] Launching NetShield-AI FastAPI Inference Engine on http://127.0.0.1:8000...")
        import uvicorn
        try:
            from app.backend import app as fastapi_app
        except ImportError:
            from backend import app as fastapi_app
        uvicorn.run(fastapi_app, host="127.0.0.1", port=8000)
    else:
        frontend_path = os.path.join(PROJECT_ROOT, "app", "frontend.py")
        print(f"[*] Launching NetShield-AI Streamlit Interactive Dashboard on port {args.port}...")
        cmd = [sys.executable, "-m", "streamlit", "run", frontend_path, "--server.port", str(args.port)]
        subprocess.run(cmd)

if __name__ == "__main__":
    main()
