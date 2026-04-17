import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Terminal, 
  BarChart3, 
  AlertTriangle, 
  Cpu, 
  Lock, 
  Activity, 
  Database,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { SOCPhase, SOCState, LogEntry } from './types';
import { MOCK_THREATS, AGENT_LIST } from './simulationData';

// --- Components ---

const AxeTorch = () => {
  return (
    <div className="relative w-16 h-24 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.1, 0.9, 1.05, 1],
          opacity: [0.8, 1, 0.9, 1, 0.8],
        }}
        transition={{ repeat: Infinity, duration: 0.15 }}
        className="absolute bottom-10 w-8 h-8 rounded-full bg-petro-orange blur-lg"
      />
      <motion.div
        animate={{
          height: [30, 45, 35, 50, 40],
          y: [0, -5, 0, -8, 0],
        }}
        transition={{ repeat: Infinity, duration: 0.2 }}
        className="absolute bottom-10 w-6 bg-gradient-to-t from-petro-orange via-orange-400 to-matrix-green rounded-full opacity-80"
        style={{ filter: 'blur(4px)' }}
      />
      <div className="absolute bottom-0 w-4 h-12 bg-gray-800 rounded-b-sm border-t-2 border-gray-600 shadow-xl z-10" />
      <div className="absolute bottom-10 w-6 h-1 bg-petro-orange z-20" />
    </div>
  );
};

const TerminalWindow = ({ logs }: { logs: LogEntry[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 overflow-hidden tui-border bg-black/80 flex flex-col font-mono text-sm shadow-[0_0_15px_rgba(0,255,65,0.1)]">
      <div className="bg-matrix-green/10 px-3 py-1 flex justify-between items-center border-b border-matrix-green/30">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-matrix-green" />
          <span className="text-matrix-green text-xs font-bold uppercase tracking-widest">
            AxeGuard_Orchestrator_v2.0 [LIVE]
          </span>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-matrix-green" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar"
      >
        {logs.map((log) => {
          let textColor = 'text-white';
          if (log.type === 'agent') textColor = 'text-amber-400';
          if (log.type === 'alert') textColor = 'text-cyber-red font-bold';
          if (log.type === 'tool') textColor = 'text-cyber-cyan italic';
          if (log.type === 'rag') textColor = 'text-purple-400';
          if (log.type === 'system') textColor = 'text-matrix-green/70';

          return (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 items-start ${textColor}`}
            >
              <span className="text-matrix-green/40 whitespace-nowrap">[{log.timestamp}]</span>
              <span className="text-cyber-cyan/60 min-w-[120px] uppercase">[{log.agent}]</span>
              <span className="flex-1 break-words">{log.message}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="p-2 border-t border-matrix-green/20 bg-matrix-green/5 flex gap-2 text-xs">
        <span className="text-matrix-green font-bold">axeguard@soc:~$</span>
        <span className="text-matrix-green/60 animate-pulse">|</span>
        <div className="flex-1" />
        <span className="text-white/40">NODE_COUNT: 06</span>
        <span className="text-white/40">|</span>
        <span className="text-white/40">DLP_ACTIVE: TRUE</span>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon: Icon, colorClass = "text-matrix-green" }: any) => (
  <div className="tui-border bg-black/40 p-3 space-y-1 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity`}>
      <Icon size={24} className={colorClass} />
    </div>
    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{title}</div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      <span className="text-[10px] text-gray-500">{unit}</span>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [state, setState] = useState<SOCState>({
    phase: 'INITIALIZING',
    currentIncident: null,
    logs: [],
    metrics: {
      threatsBlocked: 1242,
      uptimeEvaded: 48,
      moneySafeguarded: 580000,
      complianceStatus: 94
    },
    connectedAgents: AGENT_LIST
  });

  const aiRef = useRef<any>(null);

  useEffect(() => {
    if (process.env.GEMINI_API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    
    // Initial logs
    addLog('system', 'PetroShield_Core', 'Initializing AxeGuard Multi-Agent Framework...');
    setTimeout(() => addLog('system', 'PetroShield_Core', 'Loading Subgraphs: [Supervisor, Edge_DLP, RAG_Intel, CLevel_Reporter]'), 500);
    setTimeout(() => addLog('system', 'PetroShield_Core', 'Listening to SCADA Telemetry (Camaçari Node) on port 443...'), 1000);
    setTimeout(() => startCycle(), 2000);
  }, []);

  const addLog = (type: LogEntry['type'], agent: string, message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB'),
      agent,
      message,
      type
    };
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog].slice(-100)
    }));
  };

  const updatePhase = (phase: SOCPhase) => setState(prev => ({ ...prev, phase }));

  const startCycle = async () => {
    // 1. MONITOR
    updatePhase('MONITOR');
    addLog('system', 'Supervisor', 'Routing lifecycle to `MONITOR` state...');
    addLog('tool', 'Edge_DLP', 'Ingesting IoT Flow: 4.8 MB/s from Camaçari Petrochemical Hub.');
    
    await wait(2000);

    // 2. DETECT
    const threat = MOCK_THREATS[Math.floor(Math.random() * MOCK_THREATS.length)];
    setState(prev => ({ ...prev, currentIncident: threat, phase: 'DETECT' }));
    addLog('alert', 'Edge_DLP', `[CRITICAL_ALERT] ${threat.type} detected at ${threat.source}`);
    addLog('agent', 'Edge_DLP', `Anomaly signature match for ${threat.description}`);

    await wait(2500);

    // 3. ANALYSE (AI Driven)
    updatePhase('ANALYSE');
    addLog('system', 'RAG_Intel', 'Executing context_engineering_chain...');
    addLog('rag', 'RAG_Intel', 'Querying MITRE ICS Database & Internal Forensic Archives...');
    
    let aiAnalysis = "LockBit variant detected. Target: Industrial Controller. Lateral propagation probability is HIGH.";
    if (aiRef.current) {
        try {
            const resp = await aiRef.current.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze this cybersecurity threat in a technical oil & gas context: ${threat.description}. Be concise, 1 sentence.`,
            });
            aiAnalysis = resp.text || aiAnalysis;
        } catch (e) {
            console.error(e);
        }
    }
    addLog('agent', 'RAG_Intel', `AI INSIGHT: ${aiAnalysis}`);

    await wait(3000);

    // 4. RESPOND
    updatePhase('RESPOND');
    addLog('agent', 'Supervisor', 'Escalating extraction protocol. Routing to `RESPOND` subgraph.');
    addLog('tool', 'Edge_DLP', `ACTION: Executing Tool block_port_and_isolate_subnet(target_ip="${threat.source}", strict=True)`);
    addLog('system', 'Edge_DLP', 'Isolating VLAN 40. Propagation halted.');

    await wait(2000);

    // 5. IR RECOVERY
    updatePhase('IR_RECOVERY');
    addLog('agent', 'Recovery_Engine', 'Patching S7-1500 firmware. Verifying CRC integrity.');
    addLog('system', 'Recovery_Engine', 'Node 10.0.0.12 stabilized. Normal ops resuming.');
    
    setState(prev => ({
        ...prev,
        metrics: {
            ...prev.metrics,
            threatsBlocked: prev.metrics.threatsBlocked + 1,
            uptimeEvaded: prev.metrics.uptimeEvaded + (Math.random() * 5),
            moneySafeguarded: prev.metrics.moneySafeguarded + 80000
        }
    }));

    await wait(2000);

    // 6. LESSONS LEARNT
    updatePhase('LESSONS_LEARNT');
    addLog('agent', 'CLevel_Reporter', 'Generating automated incident report for board review.');
    addLog('rag', 'Supervisor', 'Indexing vector hash to long-term memory. Multi-tenant vaccination complete.');

    await wait(2000);

    // Restart the cycle with a bit of delay
    setTimeout(() => {
        addLog('system', 'Supervisor', 'System resting. Entering STANDBY mode.');
        setTimeout(() => startCycle(), 5000);
    }, 1000);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="h-screen w-screen bg-bg flex flex-col relative overflow-hidden text-text-main font-sans">
      <div className="scanline" />
      
      {/* Header (60px) */}
      <header className="h-[60px] bg-surface border-b-2 border-border-dim px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-blue rounded flex items-center justify-center font-bold text-bg">AX</div>
          <div className="text-lg font-bold tracking-tight">
            AXEGUARD <span className="font-light opacity-60">CORE_SOC</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-[12px] font-mono whitespace-nowrap">
            <div className="flex gap-1"><span className="text-text-muted">LATENCY:</span> 14ms</div>
            <div className="flex gap-1"><span className="text-text-muted">NODE:</span> CAMAÇARI_BR_01</div>
            <div className="flex gap-1"><span className="text-text-muted">UPTIME:</span> 184:12:09</div>
            <div className="text-accent-green font-bold"><span className="text-text-muted">SEC_PROTOCOL:</span> ACTIVE</div>
        </div>
      </header>

      {/* Main Grid: 640px left column */}
      <main className="flex-1 grid grid-cols-[640px_1fr] bg-border-dim gap-[2px] overflow-hidden">
        
        {/* TUI Panel (Left) */}
        <section className="bg-bg p-4 flex flex-col overflow-hidden">
          <div className="tui-toolbar mb-2 pb-1">STREAM: LIVE_ORCHESTRATION_LOGS v2.4</div>
          <TerminalWindow logs={state.logs} />
          
          <div className="mt-3 flex gap-2 font-mono text-[13px] items-center">
            <span className="text-accent-green">axeguard@soc:~$</span>
            <span>node orchestrator.ts --expand --verbose</span>
            <span className="w-2 h-3.5 bg-accent-green animate-pulse" />
          </div>
        </section>

        {/* Dashboard Panel (Right) */}
        <section className="bg-surface p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-[14px] font-bold uppercase tracking-[2px] text-accent-blue mb-1">Executive Metrics</h2>
            <p className="text-[11px] text-text-muted">Real-time Value Chain Tensions</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Current Threat</div>
                <div className={`text-2xl font-bold font-mono ${state.phase === 'DETECT' ? 'text-accent-red' : 'text-accent-green'}`}>
                    {state.phase === 'DETECT' ? "CRITICAL" : "STABLE"}
                </div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Loss Prevented</div>
                <div className="text-2xl font-bold font-mono">
                    R$ {(state.metrics.moneySafeguarded/1000).toFixed(0)}K
                </div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Anomalies 24H</div>
                <div className="text-2xl font-bold font-mono">4,821</div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Downtime Saved</div>
                <div className="text-2xl font-bold font-mono">14.2h</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] uppercase text-text-muted tracking-widest font-bold">Active Agent Pool</div>
            <div className="flex flex-col gap-3">
              {[
                { name: 'SUPERVISOR_V2', task: 'Orchestration Logic', status: 'IDLE', color: 'text-accent-blue' },
                { name: 'EDGE_DLP_PROB', task: 'Deep Packet Inspection', status: state.phase === 'MONITOR' ? 'SCANNING' : 'IDLE', color: 'text-accent-amber' },
                { name: 'RAG_INTEL_OPS', task: 'MITRE Contextualizer', status: 'SYNCED', color: 'text-accent-blue' },
              ].map(agent => (
                <div key={agent.name} className="flex items-center justify-between p-2.5 bg-white/5 border-l-3 border-accent-blue rounded-r-sm">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold">{agent.name}</span>
                    <span className="text-[10px] text-text-muted">{agent.task}</span>
                  </div>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${agent.status === 'SCANNING' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="text-[10px] uppercase text-text-muted tracking-widest mb-3 font-bold">MITRE Tactic Coverage (ICS)</div>
            <div className="grid grid-cols-5 gap-1">
                {['INTR', 'EXEC', 'PERS', 'PRIV', 'EVAS', 'DISC', 'LATM', 'COLL', 'C&C', 'EXFI'].map((code, i) => (
                    <div key={code} className={`aspect-square bg-[#1a1d23] border border-border-dim flex items-center justify-center text-[8px] text-center p-0.5
                      ${[1, 4].includes(i) ? 'bg-accent-red text-white border-[#ff0000]' : ''}
                      ${[0, 2, 6, 9].includes(i) ? 'bg-accent-green/20 text-accent-green border-accent-green' : 'text-[#444]'}
                    `}>
                        {code}
                    </div>
                ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer (40px) */}
      <footer className="h-[40px] bg-surface border-t border-border-dim px-6 flex items-center justify-between font-mono text-[10px] text-text-muted shrink-0">
        <div>LOG_SOURCE: /var/log/axeguard/agentic_flow.log</div>
        <div>ENCRYPTION: AES-256-GCM [FIPS-140-2]</div>
        <div>SYSTEM TIME: {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString()} UTC</div>
      </footer>
    </div>
  );
}
