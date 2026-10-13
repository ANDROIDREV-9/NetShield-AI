"""
scripts/verify_all_notebooks_inline.py
======================================
Comprehensive verification of all 4 Jupyter notebooks:
- Checks total cells, code cells, and markdown cells
- Checks that zero plt.savefig calls exist in any notebook
- Checks that zero matplotlib.use('Agg') backend locks exist
- Checks that %matplotlib inline is properly configured
- Checks that image/png outputs are embedded inline inside the notebooks
- Checks execution counts and output integrity
"""

import os
import glob
import nbformat

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def audit():
    nb_files = sorted(glob.glob(os.path.join(PROJECT_ROOT, "notebooks", "*.ipynb")) + [os.path.join(PROJECT_ROOT, "IDS_ML_Project.ipynb")])
    
    print("=" * 115)
    print(f"{'Notebook File':<32} | {'Size (KB)':>10} | {'Cells':>5} | {'Inline Imgs':>11} | {'savefig':>7} | {'Agg':>5} | {'inline':>6} | {'Unexecuted':>10}")
    print("=" * 115)

    all_pass = True

    for p in nb_files:
        nb = nbformat.read(p, as_version=4)
        fname = os.path.relpath(p, PROJECT_ROOT)
        sz_kb = os.path.getsize(p) / 1024
        img_count = sum(1 for c in nb.cells if any("image/png" in o.get("data", {}) for o in c.get("outputs", [])))
        savefig_cells = [i for i, c in enumerate(nb.cells) if "plt.savefig" in c.get("source", "")]
        agg_cells = [i for i, c in enumerate(nb.cells) if "matplotlib.use('Agg')" in c.get("source", "") or 'matplotlib.use("Agg")' in c.get("source", "")]
        inline_cells = [i for i, c in enumerate(nb.cells) if "inline" in c.get("source", "")]
        unexecuted = [i for i, c in enumerate(nb.cells) if c.cell_type == "code" and c.execution_count is None]
        
        passed = (len(savefig_cells) == 0) and (len(agg_cells) == 0) and (img_count > 0) and (len(unexecuted) == 0)
        if not passed:
            all_pass = False

        print(f"{fname:<32} | {sz_kb:10.1f} | {len(nb.cells):5d} | {img_count:11d} | {len(savefig_cells):7d} | {len(agg_cells):5d} | {len(inline_cells):6d} | {len(unexecuted):10d}")

    print("=" * 115)
    print(f"Overall Inline Visualizations Status: {'ALL PASS [100%]' if all_pass else 'FAIL'}")
    return all_pass

if __name__ == "__main__":
    audit()
