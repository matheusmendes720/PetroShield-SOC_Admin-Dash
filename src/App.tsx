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
import { SOCPhase, SOCState, LogEntry, ThreatEvent } from './types';
import { MOCK_THREATS, AGENT_LIST } from './simulationData';

// --- Componentes de Interface AxeGuard ---

/**
 * @component AxeTorch
 * Representação visual estética da "Tocha de Segurança" do PetroShield.
 * Utiliza Framer Motion para simular cintilação e brilho atmosférico.
 */
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

/**
 * @component TerminalWindow
 * Janela TUI (Terminal User Interface) para stream de logs em tempo real.
 * Implementa auto-scroll dinâmico e tipagem visual baseada no agente emissor.
 * Funciona como o "Feed de Auditoria" da BFF em memória.
 */
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

/**
 * @component MetricCard
 * Widget de visualização de KPI (Key Performance Indicator).
 * Utilizado para exibir métricas protegidas e ROI de segurança na Dashboard.
 */
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

interface AgentStatusProps {
  key?: string;
  agent: {
    id: string;
    name: string;
    task: string;
  };
  phase: SOCPhase;
}

/**
 * @component AgentStatusCard
 * Representação dinâmica do ciclo de vida de um agente autônomo.
 * Gerencia estados visuais (IDLE vs ATIVO) e animações de processamento.
 * Implementa lógica de "Saúde do Agente" e indicadores de CPU.
 */
const AgentStatusCard = ({ agent, phase }: AgentStatusProps) => {
  const getAgentDetails = () => {
    switch (agent.id) {
      case 'SUPERVISOR':
        if (phase === 'INITIALIZING') return { status: 'INICIALIZANDO', active: true, color: 'text-accent-blue', icon: Cpu };
        if (['RESPOND', 'LESSONS_LEARNT'].includes(phase)) return { status: 'ORQUESTRANDO', active: true, color: 'text-accent-blue', icon: Activity };
        return { status: 'IDLE', active: false, color: 'text-text-muted', icon: Shield };
      case 'EDGE_DLP':
        if (phase === 'MONITOR') return { status: 'ESCANEANDO', active: true, color: 'text-accent-amber', icon: Activity };
        if (phase === 'DETECT') return { status: 'ALERTA', active: true, color: 'text-accent-red', icon: AlertTriangle };
        if (phase === 'RESPOND') return { status: 'ISOLANDO', active: true, color: 'text-accent-red', icon: Lock };
        if (phase === 'IR_RECOVERY') return { status: 'PATCHING', active: true, color: 'text-accent-green', icon: CheckCircle2 };
        return { status: 'IDLE', active: false, color: 'text-text-muted', icon: Shield };
      case 'RAG_INTEL':
        if (phase === 'ANALYSE') return { status: 'CONSULTANDO', active: true, color: 'text-accent-blue', icon: Database };
        return { status: 'SINCRONIZADO', active: false, color: 'text-accent-green', icon: CheckCircle2 };
      case 'THREAT_HUNTER':
        if (phase === 'HUNT') return { status: 'CAÇANDO', active: true, color: 'text-accent-blue', icon: Activity };
        return { status: 'IDLE', active: false, color: 'text-text-muted', icon: Shield };
      default:
        return { status: 'IDLE', active: false, color: 'text-text-muted', icon: Shield };
    }
  };

  const details = getAgentDetails();
  const Icon = details.icon;

  return (
    <div className={`flex items-center justify-between p-3 bg-white/5 border-l-4 rounded-r-sm transition-all duration-300 ${details.active ? 'border-accent-blue bg-accent-blue/5' : 'border-border-dim opacity-60'}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          {details.active && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute inset-0 rounded-full blur-sm ${details.color.replace('text-', 'bg-')}`}
            />
          )}
          <div className={`relative p-2 rounded-full bg-black/40 border border-white/10 ${details.active ? details.color : 'text-text-muted'}`}>
            <Icon size={14} />
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[12px] font-bold tracking-tight">{agent.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              {details.active ? (
                <motion.div 
                  animate={{ width: ['40%', '80%', '60%'] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-full bg-accent-blue" 
                />
              ) : (
                <div className="h-full w-[20%] bg-text-muted" />
              )}
            </div>
            <span className="text-[8px] text-text-muted uppercase">Saúde: 98%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${details.active ? `${details.color} bg-white/10` : 'text-text-muted bg-white/5'}`}>
          {details.status}
        </span>
        {details.active && (
          <div className="flex gap-0.5">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ height: [2, 8, 4] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                className={`w-0.5 ${details.color.replace('text-', 'bg-')}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
    
    // Logs Iniciais
    addLog('system', 'PetroShield_Core', 'Inicializando Framework Multi-Agente AxeGuard...');
    setTimeout(() => addLog('system', 'PetroShield_Core', 'Carregando Subgrafos: [Supervisor, Edge_DLP, RAG_Intel, CLevel_Reporter, Threat_Hunter]'), 500);
    setTimeout(() => addLog('system', 'PetroShield_Core', 'Monitorando Telemetria SCADA (Nó Camaçari) na porta 443...'), 1000);
    setTimeout(() => startCycle(), 2000);
  }, []);

  const addLog = (type: LogEntry['type'], agent: string, message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
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

  /**
   * Gera uma análise heurística local quando a IA atinge o limite de taxa (429)
   * ou quando o sistema prefere processamento "on-edge".
   */
  const getHeuristicAnalysis = (threat: ThreatEvent) => {
    const insights = [
      `Anomalia detectada em ${threat.source}. Assinatura de comportamento sugere ${threat.type}. Recomendado isolamento imediato.`,
      `Padrão de tráfego em ${threat.source} correlaciona-se com táticas de ${threat.severity === 'CRITICAL' ? 'Exfiltração Ativa' : 'Reconhecimento'}.`,
      `Integridade de dados em risco em ${threat.source}. Protocolo LockShield sugere verificação de firmware CRC.`,
      `Alerta de alta severidade em ${threat.source}. Vetor de ataque: ${threat.type}. Acionando camadas de defesa proativa.`,
      `Insight Heurístico: Bloqueio Zero-Trust recomendado para conter a propagação de ${threat.type}.`
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  const startCycle = async () => {
    // 0. HUNT (PROACTIVE PHASE)
    updatePhase('HUNT');
    addLog('system', 'Supervisor', 'Redirecionando ciclo para estado de `CAÇA` proativa...');
    addLog('agent', 'Threat_Hunter', 'Executando varredura heurística em busca de anomalias em rede...');
    addLog('tool', 'Threat_Hunter', 'Mapeando vetores de ataque potenciais e spot firewalls ativos.');
    
    await wait(3000);
    
    // Implementar lógica onde o Hunter pode ou não encontrar algo
    const foundSomething = Math.random() > 0.3;

    if (foundSomething) {
      addLog('alert', 'Threat_Hunter', '[INCIDENTE_DETECTADO] Padrão malicioso identificado em zona de baixa confiança!');
      await wait(1000);
      
      // 1. MONITOR
      updatePhase('MONITOR');
      addLog('system', 'Supervisor', 'Iniciando monitoramento intensivo de fluxo de dados...');
      addLog('tool', 'Edge_DLP', 'Ingerindo Fluxo IoT: 4.8 MB/s do Polo Petroquímico de Camaçari.');
      
      await wait(2000);

      // 2. DETECT
      const threat = MOCK_THREATS[Math.floor(Math.random() * MOCK_THREATS.length)];
      setState(prev => ({ ...prev, currentIncident: threat, phase: 'DETECT' }));
      addLog('alert', 'Edge_DLP', `[ALERTA_CRÍTICO] ${threat.type} detectado em ${threat.source}`);
      addLog('agent', 'Edge_DLP', `Combinando assinatura de anomalia para: ${threat.description}`);

      await wait(2500);

      // 3. ANALYSE (AI Driven with Heuristic Fallback)
      updatePhase('ANALYSE');
      addLog('system', 'RAG_Intel', 'Executando context_engineering_chain...');
      addLog('rag', 'RAG_Intel', 'Consultando Banco de Dados MITRE ICS e Arquivos Forenses Internos...');
      
      let aiAnalysis = getHeuristicAnalysis(threat);
      let usingAI = false;

      if (aiRef.current) {
          try {
              const resp = await aiRef.current.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: `Analise esta ameaça de cibersegurança em um contexto técnico de óleo e gás: ${threat.description}. Seja conciso, responda apenas 1 frase curta em português sem negrito.`,
              });
              if (resp.text) {
                aiAnalysis = resp.text;
                usingAI = true;
              }
          } catch (e: any) {
              console.warn("AI Analysis Failed. Falling back to Heuristic Mode.", e);
              if (e?.status === 429 || (e?.message && e.message.includes('429'))) {
                  addLog('system', 'RAG_Intel', 'AVISO: Limite de cota atingido. Mudando para MODO HEURÍSTICO LOCAL.');
              } else {
                  addLog('system', 'RAG_Intel', 'Falha na conexão neural. Acionando análise de backup.');
              }
          }
      }
      addLog('agent', 'RAG_Intel', `${usingAI ? 'INSIGHT IA' : 'ANÁLISE HEURÍSTICA'}: ${aiAnalysis}`);

      await wait(4000); // Increased wait to slow down and protect quota

      // 4. RESPOND
      updatePhase('RESPOND');
      addLog('agent', 'Supervisor', 'Escalando protocolo de extração. Roteando para subgrafo de `RESPOSTA`.');
      addLog('tool', 'Edge_DLP', `AÇÃO: Executando Ferramenta block_port_and_isolate_subnet(target_ip="${threat.source}", strict=True)`);
      addLog('system', 'Edge_DLP', 'Isolando VLAN 40. Propagação interrompida.');

      await wait(2000);

      // 5. IR RECOVERY
      updatePhase('IR_RECOVERY');
      addLog('agent', 'Recovery_Engine', 'Atualizando firmware S7-1500. Verificando integridade CRC.');
      addLog('system', 'Recovery_Engine', 'Nó 10.0.0.12 estabilizado. Operações normais retomadas.');
      
      setState(prev => ({
          ...prev,
          metrics: {
              ...prev.metrics,
              threatsBlocked: prev.metrics.threatsBlocked + 1,
              uptimeEvaded: prev.metrics.uptimeEvaded + (Math.random() * 5),
              moneySafeguarded: prev.metrics.moneySafeguarded + 80000,
              complianceStatus: Math.min(100, prev.metrics.complianceStatus + 0.1),
              networkHealth: Math.min(100, Math.max(0, 95 + (Math.random() * 5)))
          }
      }));

      await wait(3000);

      // 6. LESSONS LEARNT
      updatePhase('LESSONS_LEARNT');
      addLog('agent', 'CLevel_Reporter', 'Gerando relatório de incidente automatizado para revisão da diretoria.');
      addLog('rag', 'Supervisor', 'Indexando hash de vetor em memória de longo prazo. Vacinação multi-tenant concluída.');

      await wait(3000);
    } else {
      addLog('system', 'Threat_Hunter', 'Nenhuma ameaça emergente detectada. Mantendo vigilância proativa.');
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          networkHealth: Math.min(100, prev.metrics.networkHealth + 0.05)
        }
      }));
      await wait(3000);
    }

    // Reiniciar ciclo
    setTimeout(() => {
        updatePhase('STANDBY');
        addLog('system', 'Supervisor', 'Sistema em repouso. Entrando em modo STANDBY.');
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
            PETROSHIELD <span className="font-light opacity-60">AXEGUARD</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-[12px] font-mono whitespace-nowrap">
            <div className="flex gap-1"><span className="text-text-muted">LATÊNCIA:</span> 14ms</div>
            <div className="flex gap-1"><span className="text-text-muted">NÓ:</span> CAMAÇARI_BR_01</div>
            <div className="flex gap-1"><span className="text-text-muted">UPTIME:</span> 184:12:09</div>
            <div className="text-accent-green font-bold"><span className="text-text-muted">PROTOCOLO_SEG:</span> ATIVO</div>
        </div>
      </header>

      {/* Main Grid: column dimensions */}
      <main className="flex-1 grid grid-cols-[640px_1fr] bg-border-dim gap-[2px] overflow-hidden">
        
        {/* Painel TUI (Esquerda) */}
        <section className="bg-bg p-4 flex flex-col overflow-hidden">
          <div className="tui-toolbar mb-2 pb-1 uppercase">Stream: Logs_Orquestração_Ao_Vivo v2.5 [PT-BR]</div>
          <TerminalWindow logs={state.logs} />
          
          <div className="mt-3 flex gap-2 font-mono text-[13px] items-center">
            <span className="text-accent-green">axeguard@soc:~$</span>
            <span>node orquestrador.ts --caça-proativa --verbose</span>
            <span className="w-2 h-3.5 bg-accent-green animate-pulse" />
          </div>
        </section>

        {/* Painel Dashboard (Direita) */}
        <section className="bg-surface p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div>
            <h2 className="text-[14px] font-bold uppercase tracking-[2px] text-accent-blue mb-1">Métricas Executivas</h2>
            <p className="text-[11px] text-text-muted">Tensões na Cadeia de Valor em Tempo Real</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Ameaça Atual</div>
                <div className={`text-2xl font-bold font-mono ${state.phase === 'DETECT' ? 'text-accent-red' : 'text-accent-green'}`}>
                    {state.phase === 'DETECT' ? "CRÍTICA" : (state.phase === 'HUNT' ? "CAÇANDO..." : "ESTÁVEL")}
                </div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Perda Evitada</div>
                <div className="text-2xl font-bold font-mono">
                    R$ {(state.metrics.moneySafeguarded/1000).toFixed(0)}K
                </div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Anomalias 24H</div>
                <div className="text-2xl font-bold font-mono">4.821</div>
            </div>
            <div className="bg-bg border border-border-dim p-4 rounded-lg">
                <div className="text-[10px] uppercase text-text-muted tracking-widest mb-2 font-bold">Downtime Salvo</div>
                <div className="text-2xl font-bold font-mono">14.2h</div>
            </div>
          </div>

          {/* Detalhes do Incidente */}
          <AnimatePresence mode="wait">
            {state.currentIncident && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black/40 border border-border-dim p-4 space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Lock size={48} className="text-accent-red" />
                </div>
                
                <h3 className="text-xs font-bold text-accent-red uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                  <AlertTriangle size={14} /> Detalhes do Incidente Proativo
                </h3>

                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <div className="text-text-muted uppercase text-[9px] mb-0.5">ID Alerta</div>
                    <div className="font-mono text-accent-blue">{state.currentIncident.id}</div>
                  </div>
                  <div>
                    <div className="text-text-muted uppercase text-[9px] mb-0.5">Severidade</div>
                    <div className={`font-bold ${state.currentIncident.severity === 'CRITICAL' ? 'text-accent-red' : 'text-accent-amber'}`}>
                      {state.currentIncident.severity}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-text-muted uppercase text-[9px] mb-0.5">Origem da Ameaça</div>
                    <div className="text-white font-bold">{state.currentIncident.source}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-text-muted uppercase text-[9px]">Análise Forense Preliminar</div>
                  <div className="text-[12px] leading-relaxed bg-white/5 p-2 border border-white/5 rounded italic text-text-main">
                    "{state.currentIncident.description}"
                  </div>
                </div>

                {state.currentIncident.mitigationSteps && (
                  <div className="space-y-2">
                    <div className="text-text-muted uppercase text-[9px] flex justify-between">
                      <span>Protocolo de Resposta Agente</span>
                      <span className="text-accent-green">Ativo</span>
                    </div>
                    <div className="space-y-1">
                      {state.currentIncident.mitigationSteps.map((step, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="flex items-start gap-2 text-[10px] text-accent-green font-mono"
                        >
                          <span className="opacity-50 tracking-tighter">[{idx + 1}]</span>
                          <span>{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <div className="text-[10px] uppercase text-text-muted tracking-widest font-bold">Pool de Agentes Ativos</div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'SUPERVISOR', name: 'SUPERVISOR_V2', task: 'Lógica de Orquestração' },
                { id: 'THREAT_HUNTER', name: 'THREAT_HUNTER', task: 'Caça Proativa de Ameaças' },
                { id: 'EDGE_DLP', name: 'EDGE_DLP_PROB', task: 'Inspeção Profunda de Pacotes' },
                { id: 'RAG_INTEL', name: 'RAG_INTEL_OPS', task: 'Contextualizador MITRE' },
              ].map(agent => (
                <AgentStatusCard 
                  key={agent.id} 
                  agent={agent} 
                  phase={state.phase} 
                />
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="text-[10px] uppercase text-text-muted tracking-widest mb-3 font-bold">Cobertura de Táticas MITRE (ICS)</div>
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
        <div>FONTE_LOGS: /var/log/axeguard/fluxo_agente.log</div>
        <div>CRIPTOGRAFIA: AES-256-GCM [FIPS-140-2]</div>
        <div>HORA DO SISTEMA: {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString()} UTC</div>
      </footer>
    </div>
  );
}
