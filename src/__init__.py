import os
import sys

# Ensure src directory is in sys.path so modules can import siblings cleanly
_src_dir = os.path.dirname(os.path.abspath(__file__))
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)
