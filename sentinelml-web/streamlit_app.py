"""
SentinelML — Streamlit Community Cloud entrypoint
=================================================
Serves the pre-built React/Vite console (a single self-contained HTML file in
``streamlit_bundle/index.html``) inside a Streamlit page.

Deploy:  main file path = ``sentinelml-web/streamlit_app.py``  (this file).
No Python ML dependencies are needed — the UI runs entirely in the browser.

This file lives in its own folder and does not touch the project's existing
root ``streamlit_app.py`` / ``app/`` files.
"""
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

BUNDLE = Path(__file__).parent / "streamlit_bundle" / "index.html"

st.set_page_config(
    page_title="SentinelML — CICIDS 2017 Intrusion Intelligence",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Remove Streamlit chrome so the console fills the page.
st.markdown(
    """
    <style>
      #MainMenu, header[data-testid="stHeader"], footer {visibility: hidden; height: 0;}
      .block-container {padding: 0 !important; max-width: 100% !important;}
      iframe {border: 0; display: block;}
      [data-testid="stSidebar"] {display: none;}
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(show_spinner=False)
def load_bundle(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


if not BUNDLE.exists():
    st.error(
        "UI bundle not found. Run `npm install && npm run build:streamlit` inside "
        "`sentinelml-web/` and commit `streamlit_bundle/index.html`."
    )
    st.stop()

# Viewport height of the embedded console (override with ?h=900).
try:
    height = int(st.query_params.get("h", 1000))
except (TypeError, ValueError):
    height = 1000

html = load_bundle(str(BUNDLE))
if hasattr(st, "iframe"):  # Streamlit >= 1.5x: st.iframe replaces components.v1.html
    st.iframe(html, height=height)
else:  # older Streamlit releases
    components.html(html, height=height, scrolling=True)
