"""
scripts/embed_inline_plots_ids_nb.py
====================================
Transforms IDS_ML_Project.ipynb:
1. Replaces matplotlib.use("Agg") with %matplotlib inline in Cell 2.
2. Removes all plt.savefig(...) calls and print("Saved: ...") statements.
3. Embeds all 16 generated diagnostic plots as inline base64 image/png display outputs directly in the notebook JSON.
"""

import os
import re
import base64
import nbformat

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NB_PATH = os.path.join(PROJECT_ROOT, "IDS_ML_Project.ipynb")

PNG_MAP = {
    5: "plot_01_label_distribution.png",
    14: "plot_02_correlation_heatmap.png",
    15: "plot_03_feature_importance.png",
    16: "plot_04_feature_distributions.png",
    19: "plot_05_imbalance_before.png",
    21: "plot_06_smote_comparison.png",
    31: "plot_07_roc_curves.png",
    32: "plot_08_classification_confusion.png",
    33: "plot_09_classification_comparison.png",
    34: "plot_10_pr_curves.png",
    37: "plot_11_regression_target.png",
    52: "plot_12_regression_comparison.png",
    53: "plot_13_actual_vs_predicted.png",
    55: "plot_14_multiclass_cm.png",
    56: "plot_15_cross_validation.png",
    57: "plot_16_pca.png",
}

def main():
    nb = nbformat.read(NB_PATH, as_version=4)
    print(f"Loaded {NB_PATH} with {len(nb.cells)} cells.")

    # 1. Update Cell 2 (matplotlib backend)
    c2 = nb.cells[2]
    c2.source = c2.source.replace('matplotlib.use("Agg")', '%matplotlib inline')

    # 2. Process each plot cell
    for idx, png_filename in PNG_MAP.items():
        c = nb.cells[idx]
        png_path = os.path.join(PROJECT_ROOT, png_filename)
        
        # Clean source: remove savefig and 'Saved: ...' prints
        src_lines = []
        for line in c.source.splitlines():
            if "plt.savefig(" in line:
                continue
            if re.match(r'^\s*print\(\s*["f\']Saved:\s*plot_\d+', line):
                continue
            src_lines.append(line)
        c.source = "\n".join(src_lines)
        
        # Clean outputs: remove 'Saved: plot_...' text stream
        cleaned_outputs = []
        for o in c.outputs:
            if o.get("output_type") == "stream":
                text = o.get("text", "")
                lines = [l for l in text.splitlines(True) if not l.strip().startswith("Saved: plot_")]
                if lines:
                    o["text"] = "".join(lines)
                    cleaned_outputs.append(o)
            elif o.get("output_type") == "display_data" and "image/png" in o.get("data", {}):
                # If there's an existing image, we'll replace or keep
                pass
            else:
                cleaned_outputs.append(o)
        
        # Read PNG and encode to base64
        if os.path.exists(png_path):
            with open(png_path, "rb") as img_f:
                b64_data = base64.b64encode(img_f.read()).decode("ascii")
            
            display_output = nbformat.v4.new_output(
                output_type="display_data",
                data={
                    "image/png": b64_data,
                    "text/plain": f"<Figure size for {png_filename}>"
                },
                metadata={}
            )
            cleaned_outputs.append(display_output)
            print(f"Cell {idx:2d}: Embedded {png_filename} ({os.path.getsize(png_path):,} bytes)")
        else:
            print(f"WARNING: File {png_path} not found!")

        c.outputs = cleaned_outputs

    with open(NB_PATH, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)

    print(f"Successfully updated {NB_PATH}!")

if __name__ == "__main__":
    main()
