# **Arquitetura PetroShield AxeGuard: SOC Multi-Agente Autônomo**

Este documento descreve a infraestrutura técnica, os padrões de design e a lógica de orquestração do framework **PetroShield AxeGuard**.

## **1. Filosofia Arquitetural: "Client-Side BFF"**

Diferente de aplicações tradicionais que dependem de um backend centralizado para lógica de negócios e agregação de dados, o AxeGuard utiliza o padrão **Client-Side BFF (Backend for Frontend)**.

### **Características do Padrão:**
- **Estado de Memória Volátil**: Toda a orquestração do SOC e métricas são mantidas no estado do React (`SOCState`), simulando persistência sem a sobrecarga de um banco de dados real.
- **Lógica de Agente Local**: Os comportamentos dos agentes (Supervisor, Edge_DLP, etc.) são implementados como funções assíncronas puras que mutam o estado global em ciclos iterativos.
- **Circuit Breaker Heurístico**: Implementação de um fallback offline para análise de ameaças quando a API de IA externa (Gemini) excede os limites de cota, garantindo 99.9% de uptime da simulação.

---

## **2. Decomposição de Interface (UI/UX)**

O design segue uma grade técnica densa que mescla dois mundos:

### **A. Terminal User Interface (TUI)**
- **Função**: Stream de auditoria forense.
- **Tecnologia**: `TerminalWindow` com `scroll-to-bottom` automático.
- **Semântica de Cores**:
    - `Matrix Green`: Sistema/Normal.
    - `Cyber Red`: Crítico/Alerta.
    - `Amber Gold`: Agentes AI.
    - `Cyan`: Ferramentas/Logs técnicos.

### **B. Dashboard Digital Corporativo**
- **Função**: Visualização de KPIs executivos e governança.
- **Elementos**: Cards de métricas com indicadores de "Perda Evitada" e "Saúde da Rede".
- **Grid MITRE ICS**: Representação matricial da cobertura defensiva baseada em táticas reais de ataques a sistemas industriais.

---

## **3. Ciclo de Vida do Incidente (Agentic Workflow)**

O orquestrador `startCycle` segue um fluxo de grafo direcionado:

1.  **HUNT (Caça)**: O `Threat_Hunter` realiza varreduras proativas em nós de baixa confiança.
2.  **MONITOR (Monitoramento)**: Ingestão de telemetria SCADA das refinarias e plataformas.
3.  **DETECT (Detecção)**: O `Edge_DLP` identifica anomalias usando assinaturas de ameaças sintéticas.
4.  **ANALYSE (Análise)**: Inferência cognitiva via Gemini AI (ou Heurística de fallback) para entender o contexto do ataque.
5.  **RESPOND (Resposta)**: Execução de ferramentas automáticas (`block_port`, `isolate_vlan`).
6.  **IR_RECOVERY (Recuperação)**: Estabilização de firmware e restauração de operações normais.
7.  **LESSONS_LEARNT (Aprendizado)**: Indexação de vetores RAG para evitar reincidência.

---

## **4. Estruturas de Dados e Algoritmos**

### **Ameaças Sintéticas (`MOCK_THREATS`)**
Cada evento de ameaça é mapeado como uma `ThreatEvent`, contendo:
- **Assinaturas Forenses**: Paylogs hexadecimais realistas (ex: payloads S7Comm).
- **Passos de Mitigação Multi-Agente**: Instruções específicas por agente para demonstração de colaboração.

### **Lógica de Análise Heurística**
```typescript
const getHeuristicAnalysis = (threat: ThreatEvent) => {
  // Algoritmo de seleção de insight baseado em gravidade e origem
  // Garante funcionalidade mesmo sem conectividade de rede (Offline-First)
}
```

---

## **5. Fluxo de Documentos de Design (FDD)**

- **Prop-Drilling**: Evitado através do uso de um estado centralizado e interfaces TypeScript rigorosas (`types.ts`).
- **Animações**: Utilização de `framer-motion` para feedbacks sub-milissegundos (saúde dos agentes, pulsação de alertas).
- **Localização**: 100% PT-BR para alinhamento com stakeholders regionais e conformidade com a LGPD.
