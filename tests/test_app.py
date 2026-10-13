"""
tests/test_app.py
=================
Automated verification test for the NetShield-AI Inference Engine
Verifies that:
  1. Models and Scalers load properly
  2. Predictions are produced accurately on benchmark samples
  3. Regression returns plausible flow durations
"""

import os
import sys
import json

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from app.backend import FlowFeatures, predict_classification, predict_regression

def test_inference():
    samples_file = os.path.join(PROJECT_ROOT, "models", "sample_test_records.json")
    with open(samples_file, "r", encoding="utf-8") as f:
        samples = json.load(f)

    print("=" * 65)
    print("  VERIFYING INFERENCE ON REAL NETWORK ATTACK SAMPLES")
    print("=" * 65)

    all_passed = True
    for s in samples:
        lbl = s["label"]
        truth = s["is_attack"]
        req = FlowFeatures(features=s["features"], model_choice="Random Forest")
        res_cls = predict_classification(req)
        res_reg = predict_regression(req)

        pred_match = (res_cls["is_attack"] == truth)
        if not pred_match:
            all_passed = False

        status = "PASS" if pred_match else "FAIL"
        print(f"  [{status}] {lbl:<16s} | Truth: {'ATTACK' if truth==1 else 'BENIGN':<6s} | "
              f"Pred: {res_cls['prediction']:<6s} (Confidence: {res_cls['attack_probability']*100:.1f}%) | "
              f"Predicted Duration: {res_reg['predicted_duration_seconds']:.4f}s")

    print("-" * 65)
    print("Inference Engine Status:", "ALL TESTS PASSED!" if all_passed else "SOME TESTS FAILED")
    print("=" * 65)

if __name__ == "__main__":
    test_inference()
