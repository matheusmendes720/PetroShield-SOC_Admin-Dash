import { ReactNode } from 'react';

export interface ThreatEvent {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  payload?: string;
  mitigation?: string;
}

export type SOCPhase = 
  | 'INITIALIZING'
  | 'MONITOR'
  | 'DETECT'
  | 'ANALYSE'
  | 'RESPOND'
  | 'IR_RECOVERY'
  | 'HUNT'
  | 'LESSONS_LEARNT';

export interface SOCState {
  phase: SOCPhase;
  currentIncident: ThreatEvent | null;
  logs: LogEntry[];
  metrics: {
    threatsBlocked: number;
    uptimeEvaded: number; // in hours
    moneySafeguarded: number; // in BRL (R$)
    complianceStatus: number; // 0-100
  };
  connectedAgents: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'system' | 'agent' | 'alert' | 'tool' | 'rag';
}
