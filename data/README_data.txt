Canadian Institute for Cybersecurity Intrusion Detection Dataset (CICIDS 2017)
================================================================================

Source:
https://www.unb.ca/cic/datasets/ids-2017.html

Citation:
Iman Sharafaldin, Arash Habibi Lashkari, and Ali A. Ghorbani, 
"Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization", 
4th International Conference on Information Systems Security and Privacy (ICISSP), Portugal, January 2018.

Dataset Files (8 PCAP-derived CSVs):
1. Monday-WorkingHours.pcap_ISCX.csv (176 MB)
   - Traffic: 100% BENIGN background traffic (529,918 records)
2. Tuesday-WorkingHours.pcap_ISCX.csv (135 MB)
   - Attacks: FTP-Patator (7,938), SSH-Patator (5,897)
3. Wednesday-workingHours.pcap_ISCX.csv (225 MB)
   - Attacks: DoS Hulk (231,073), DoS GoldenEye (10,293), DoS slowloris (5,796), DoS Slowhttptest (5,499), Heartbleed (11)
4. Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv (52 MB)
   - Attacks: Web Attack-Brute Force (1,507), Web Attack-XSS (652), Web Attack-SQL Injection (21)
5. Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv (83 MB)
   - Attacks: Infiltration (36)
6. Friday-WorkingHours-Morning.pcap_ISCX.csv (58 MB)
   - Attacks: Bot (1,966)
7. Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv (77 MB)
   - Attacks: DDoS (128,027)
8. Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv (76 MB)
   - Attacks: PortScan (158,930)

Total Records: 2,830,743 bidirectional network flows
Features: 78 statistical network flow metrics extracted by CICFlowMeter.

Placement:
Ensure all 8 CSV files are present in the project root:
c:\Users\manda\Downloads\MLREVIEW1\
The notebooks automatically ingest all 8 files from this directory.
