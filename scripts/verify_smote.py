import joblib, pandas as pd, numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

PROJECT_ROOT = '.'
import sys
sys.path.insert(0, '.')
from src.data_loader import load_cicids
from src.preprocessing import clean
from src.feature_engineering import engineer

print("Loading dataset...")
df_raw = load_cicids(data_dir=PROJECT_ROOT, verbose=False)
df = clean(df_raw, verbose=False)
selected, _, _, _ = engineer(df, top_n=30, random_state=42, save_plots=False, verbose=False)

df_sample = df.sample(n=100_000, random_state=42)
X = df_sample[selected]
y = df_sample['label_binary']

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_tr_s = scaler.fit_transform(X_tr)
X_te_s = scaler.transform(X_te)

smote = SMOTE(random_state=42, k_neighbors=5)
X_tr_sm, y_tr_sm = smote.fit_resample(X_tr_s, y_tr)

rf = RandomForestClassifier(n_estimators=100, max_depth=16, min_samples_leaf=3, random_state=42, n_jobs=-1)
rf.fit(X_tr_sm, y_tr_sm)
print("Test accuracy with SMOTE:", rf.score(X_te_s, y_te))

for lbl in ['BENIGN', 'DoS Hulk', 'PortScan', 'DDoS', 'FTP-Patator']:
    sub = df[df['Label'] == lbl]
    sub_X = scaler.transform(sub[selected].head(200))
    preds = rf.predict(sub_X)
    target = 0 if lbl == 'BENIGN' else 1
    acc = (preds == target).mean()
    print(f"{lbl:<15}: {acc:.4f} accuracy")
