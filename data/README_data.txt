CICIDS 2017 — Canadian Institute for Cybersecurity Intrusion Detection Dataset
================================================================================

Citation:
  Iman Sharafaldin, Arash Habibi Lashkari, and Ali A. Ghorbani,
  "Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic
  Characterization", 4th International Conference on Information Systems
  Security and Privacy (ICISSP), 2018.

Download:
  https://www.unb.ca/cic/datasets/ids-2017.html

Files (8 CSVs, ~900 MB total):
  Monday-WorkingHours.pcap_ISCX.csv          — Benign traffic only
  Tuesday-WorkingHours.pcap_ISCX.csv         — FTP-Patator, SSH-Patator
  Wednesday-workingHours.pcap_ISCX.csv       — DoS Hulk, GoldenEye, Slowloris, SlowHTTPTest, Heartbleed
  Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv   — Web Attacks (Brute Force, XSS, SQL Injection)
  Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv — Infiltration
  Friday-WorkingHours-Morning.pcap_ISCX.csv  — Botnet ARES
  Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv — DDoS LOIT
  Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv — PortScan

Schema:
  79 columns extracted by CICFlowMeter from raw PCAP files.
  Final column: "Label" (attack category or "BENIGN").

NOTE: CSV files are excluded from Git via .gitignore due to file size.
      Download the dataset and place all 8 CSVs in the project root directory.
