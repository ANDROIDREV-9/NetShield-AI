#!/usr/bin/env python
# Direct Regression Notebook Generator
import os, sys, json, uuid

# Cell helper
def make_cell(c_type, src):
    return {
        'cell_type': c_type,
        'id': uuid.uuid4().hex[:8],
        'metadata': {},
        'source': [s + '\n' for s in src.trim().split('\n')]
    }
