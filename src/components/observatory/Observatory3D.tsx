import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  DepartmentId, 
  DepartmentInfo, 
  Mission, 
  User, 
  AutonomousAgent, 
  LivingCoreVisualState 
} from '../../types/index.ts';
import { livingAudio } from '../../services/livingAudio.ts';
import { 
  Eye, 
  Compass, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Send, 
  Terminal, 
  X, 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Pause, 
  Sparkles, 
  Cpu, 
  Layers, 
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Observatory3DProps {
  departments: DepartmentInfo[];
  agents?: AutonomousAgent[];
  missions: Mission[];
  livingState: LivingCoreVisualState;
  selectedDepartmentId: DepartmentId | null;
  onSelectDepartment: (deptId: DepartmentId) => void;
  onSelectAgent?: (agent: AutonomousAgent) => void;
  onFocusCore: () => void;
  isTotalFocus?: boolean;
  onToggleTotalFocus?: () => void;
  onSendCommand?: (prompt: string) => Promise<void>;
  currentUser?: User | null;
  onToggleAgentPause?: (agentId: string) => Promise<void>;
  onTriggerKillSwitch?: () => Promise<void>;
}

// Visual configuration for the 10 authentic AYIN CORE states
const STATE_CONFIG: Record<LivingCoreVisualState, {
  label: string;
  sublabel: string;
  coreColor: number;
  emissiveColor: number;
  accentColor: string;
  gyroSpeed: number;
  pulseRate: number;
  lightIntensity: number;
}> = {
  INICIALIZANDO: {
    label: 'INICIALIZANDO',
    sublabel: 'Ativação Quântica Gradual',
    coreColor: 0x38bdf8,
    emissiveColor: 0x0284c7,
    accentColor: '#38bdf8',
    gyroSpeed: 0.002,
    pulseRate: 1.0,
    lightIntensity: 2.0,
  },
  ONLINE: {
    label: 'ONLINE (VIGÍLIA)',
    sublabel: 'Respiração Serena e Monitoramento Ativo',
    coreColor: 0xfef08a,
    emissiveColor: 0xca8a04,
    accentColor: '#facc15',
    gyroSpeed: 0.0035,
    pulseRate: 1.5,
    lightIntensity: 3.0,
  },
  ANALISANDO: {
    label: 'ANALISANDO',
    sublabel: 'Varredura Sináptica de Mercado e Concorrência',
    coreColor: 0x06b6d4,
    emissiveColor: 0x0891b2,
    accentColor: '#06b6d4',
    gyroSpeed: 0.006,
    pulseRate: 3.5,
    lightIntensity: 3.8,
  },
  PROCESSANDO: {
    label: 'PROCESSANDO',
    sublabel: 'Decomposição de Ordens e Cálculo Tático',
    coreColor: 0xc084fc,
    emissiveColor: 0x9333ea,
    accentColor: '#c084fc',
    gyroSpeed: 0.012,
    pulseRate: 6.0,
    lightIntensity: 4.5,
  },
  EXECUTANDO: {
    label: 'EXECUTANDO',
    sublabel: 'Missão Autônoma em Progresso Ativo',
    coreColor: 0xfbbf24,
    emissiveColor: 0xd97706,
    accentColor: '#fbbf24',
    gyroSpeed: 0.010,
    pulseRate: 4.5,
    lightIntensity: 4.8,
  },
  AGUARDANDO_APROVACAO: {
    label: 'AGUARDANDO APROVAÇÃO',
    sublabel: 'Trava de Soberania Master Owner Pendente',
    coreColor: 0xf97316,
    emissiveColor: 0xc2410c,
    accentColor: '#f97316',
    gyroSpeed: 0.003,
    pulseRate: 2.2,
    lightIntensity: 3.6,
  },
  PAUSADO: {
    label: 'PAUSADO (KILL-SWITCH)',
    sublabel: 'Interrupção Global de Segurança Ativa',
    coreColor: 0xe11d48,
    emissiveColor: 0x9f1239,
    accentColor: '#e11d48',
    gyroSpeed: 0.0002,
    pulseRate: 0.6,
    lightIntensity: 1.4,
  },
  ALERTA: {
    label: 'ALERTA TÁTICO',
    sublabel: 'Anomalia ou Teto de Gastos Atingido',
    coreColor: 0xef4444,
    emissiveColor: 0xb91c1c,
    accentColor: '#ef4444',
    gyroSpeed: 0.008,
    pulseRate: 5.0,
    lightIntensity: 4.2,
  },
  ERRO: {
    label: 'ERRO NA EXECUÇÃO',
    sublabel: 'Auto-recuperação e Tentativa de Isolamento',
    coreColor: 0xdc2626,
    emissiveColor: 0x7f1d1d,
    accentColor: '#dc2626',
    gyroSpeed: 0.004,
    pulseRate: 7.0,
    lightIntensity: 3.5,
  },
  DESCONECTADO: {
    label: 'DESCONECTADO',
    sublabel: 'Rede Indisponível / Modo Passivo',
    coreColor: 0x475569,
    emissiveColor: 0x1e293b,
    accentColor: '#64748b',
    gyroSpeed: 0.0001,
    pulseRate: 0.3,
    lightIntensity: 0.8,
  },
};

export const Observatory3D: React.FC<Observatory3DProps> = ({
  departments,
  agents = [],
  missions,
  livingState,
  selectedDepartmentId,
  onSelectDepartment,
  onSelectAgent,
  onFocusCore,
  isTotalFocus = false,
  onToggleTotalFocus,
  onSendCommand,
  currentUser,
  onToggleAgentPause,
  onTriggerKillSwitch,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'dept' | 'agent'; data: any } | null>(null);
  const [inspectedAgent, setInspectedAgent] = useState<AutonomousAgent | null>(null);
  const [cameraZoomLevel, setCameraZoomLevel] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => livingAudio.getMutedState());
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  
  // Interactive HUD States
  const [commandPrompt, setCommandPrompt] = useState('');
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);
  const [showAgentConstellation, setShowAgentConstellation] = useState(true);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activeTabDock, setActiveTabDock] = useState<'command' | 'agents' | 'departments'>('command');
  
  // Manual state override preview (for testing / demonstrating all 10 states)
  const [previewState, setPreviewState] = useState<LivingCoreVisualState | null>(null);
  const effectiveState = previewState || livingState;
  const currentConfig = STATE_CONFIG[effectiveState] || STATE_CONFIG.ONLINE;

  const defaultAgentFallback: AutonomousAgent[] = [
    { id: 'agent_radar_01', companyId: 'global', name: 'Radar Sentinel', hebrewCodename: 'צופה', departmentId: 'AYIN_RADAR', agentRoleType: 'RADAR AGENT', role: 'Varredura', specialty: 'Mapeamento B2B', autonomyLevel: 'autonomous_safe', status: 'analyzing', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 341, accuracyScore: 98, lastActive: '' },
    { id: 'agent_lead_02', companyId: 'global', name: 'Lead Organizer', hebrewCodename: 'שומר', departmentId: 'AYIN_SALES', agentRoleType: 'LEAD AGENT', role: 'Qualificação', specialty: 'Segmentação de leads corporativos', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 452, accuracyScore: 97, lastActive: '' },
    { id: 'agent_sales_03', companyId: 'global', name: 'Sales Negotiator', hebrewCodename: 'נושא', departmentId: 'AYIN_SALES', agentRoleType: 'SALES AGENT', role: 'Fechamento', specialty: 'Negociações e propostas', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 520, accuracyScore: 97, lastActive: '' },
    { id: 'agent_customer_04', companyId: 'global', name: 'Customer Concierge', hebrewCodename: 'עוזר', departmentId: 'AYIN_AGENTS', agentRoleType: 'CUSTOMER AGENT', role: 'Suporte', specialty: 'Atendimento contínuo', autonomyLevel: 'autonomous_safe', status: 'idle', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 280, accuracyScore: 99, lastActive: '' },
    { id: 'agent_marketing_05', companyId: 'global', name: 'Marketing Strategist', hebrewCodename: 'תכנון', departmentId: 'AYIN_STRATEGY', agentRoleType: 'MARKETING AGENT', role: 'Estratégia', specialty: 'Campanhas e canais', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 310, accuracyScore: 96, lastActive: '' },
    { id: 'agent_creative_06', companyId: 'global', name: 'Creative Producer', hebrewCodename: 'יוצר', departmentId: 'AYIN_CREATIVE', agentRoleType: 'CREATIVE AGENT', role: 'Conteúdo', specialty: 'Copywriting e criativos', autonomyLevel: 'autonomous_safe', status: 'idle', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 195, accuracyScore: 95, lastActive: '' },
    { id: 'agent_market_07', companyId: 'global', name: 'Market Observer', hebrewCodename: 'חוקr', departmentId: 'AYIN_MARKET', agentRoleType: 'MARKET AGENT', role: 'Benchmarking', specialty: 'Inteligência competitiva', autonomyLevel: 'autonomous_safe', status: 'analyzing', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 420, accuracyScore: 98, lastActive: '' },
    { id: 'agent_finance_08', companyId: 'global', name: 'Financial Overseer', hebrewCodename: 'גזבר', departmentId: 'AYIN_FINANCE', agentRoleType: 'FINANCE AGENT', role: 'Faturamento', specialty: 'Conciliação e emissão Pix', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 610, accuracyScore: 100, lastActive: '' },
    { id: 'agent_subscription_09', companyId: 'global', name: 'Subscription Manager', hebrewCodename: 'מנויים', departmentId: 'AYIN_FINANCE', agentRoleType: 'SUBSCRIPTION AGENT', role: 'Planos', specialty: 'Gestão de planos recorrentes', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 340, accuracyScore: 99, lastActive: '' },
    { id: 'agent_analytics_10', companyId: 'global', name: 'Analytics Telemetry', hebrewCodename: 'נתונים', departmentId: 'AYIN_INTELLIGENCE', agentRoleType: 'ANALYTICS AGENT', role: 'Telemetria', specialty: 'Métricas e telemetria 24/7', autonomyLevel: 'autonomous_safe', status: 'running', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 890, accuracyScore: 99, lastActive: '' },
    { id: 'agent_report_11', companyId: 'global', name: 'Executive Reporter', hebrewCodename: 'דוח', departmentId: 'AYIN_INTELLIGENCE', agentRoleType: 'REPORT AGENT', role: 'Relatórios', specialty: 'Sínteses executivas Master', autonomyLevel: 'autonomous_safe', status: 'idle', is24hEnabled: true, isManuallyPaused: false, totalMissionsCompleted: 230, accuracyScore: 98, lastActive: '' },
  ];

  const agentList = agents.length > 0 ? agents : defaultAgentFallback;

  // Sound feedback on state changes
  useEffect(() => {
    if (effectiveState === 'PAUSADO' || effectiveState === 'ALERTA') {
      livingAudio.playTone('alert');
    } else if (effectiveState === 'EXECUTANDO') {
      livingAudio.playTone('command_sent');
    } else {
      livingAudio.playTone('state_change');
    }
  }, [effectiveState]);

  // Keyboard shortcut listener: Escape exits total focus, F toggles total focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === 'Escape' && isTotalFocus && onToggleTotalFocus) {
        onToggleTotalFocus();
      } else if ((e.key === 'f' || e.key === 'F') && onToggleTotalFocus) {
        onToggleTotalFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTotalFocus, onToggleTotalFocus]);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Web Speech recognition for voice command
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQuickFeedback('Reconhecimento de voz nativo não disponível neste navegador.');
      setTimeout(() => setQuickFeedback(null), 3000);
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        livingAudio.playTone('click');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommandPrompt(transcript);
        setIsListeningVoice(false);
        livingAudio.playTone('command_sent');
        // Auto-send if clear command
        if (transcript.length > 5 && onSendCommand) {
          executeCommand(transcript);
        }
      };

      recognition.onerror = () => setIsListeningVoice(false);
      recognition.onend = () => setIsListeningVoice(false);

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  const executeCommand = async (text: string) => {
    if (!text.trim() || isSendingCommand || !onSendCommand) return;
    setIsSendingCommand(true);
    setQuickFeedback(null);
    try {
      livingAudio.playTone('command_sent');
      await onSendCommand(text.trim());
      setQuickFeedback('Ordem assimilada pelo AYIN CORE. Agentes mobilizados.');
      livingAudio.speak('Ordem assimilada. Execução estratégica distribuída aos agentes.');
      setCommandPrompt('');
      setTimeout(() => setQuickFeedback(null), 4000);
    } catch (err: any) {
      setQuickFeedback(err.message || 'Falha ao despachar ordem.');
      livingAudio.playTone('alert');
    } finally {
      setIsSendingCommand(false);
    }
  };

  const handleToggleAudio = () => {
    const muted = livingAudio.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      livingAudio.playTone('boot');
    }
  };

  // -------------------------------------------------------------
  // THREE.JS SCENE SETUP & RENDER LOOP
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE & EXPONENTIAL FOG
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020204, 0.0016);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 2500);
    camera.position.set(0, 48, 145);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x020204, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Safeguard WebGL Context Loss
    const gl = renderer.getContext();
    if (!gl) {
      console.warn('WebGL context unavailable.');
      return;
    }

    // LIGHTING (Key light, Fill light, Dynamic state core light)
    const ambientLight = new THREE.AmbientLight(0x181028, 1.4);
    scene.add(ambientLight);

    const corePointLight = new THREE.PointLight(currentConfig.coreColor, currentConfig.lightIntensity, 220);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    const rimLightGold = new THREE.DirectionalLight(0xfef08a, 0.7);
    rimLightGold.position.set(60, 90, 70);
    scene.add(rimLightGold);

    const fillLightCyan = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLightCyan.position.set(-60, -40, -50);
    scene.add(fillLightCyan);

    // CELESTIAL STARFIELD (2,200 Procedural Depth Particles)
    const starCount = 2200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 280 + Math.random() * 600;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const p = Math.random();
      if (p > 0.85) {
        // Champagne Gold
        starColors[i * 3] = 0.98;
        starColors[i * 3 + 1] = 0.88;
        starColors[i * 3 + 2] = 0.45;
      } else if (p > 0.55) {
        // Ethereal Violet
        starColors[i * 3] = 0.75;
        starColors[i * 3 + 1] = 0.45;
        starColors[i * 3 + 2] = 0.98;
      } else {
        // Crystalline White
        starColors[i * 3] = 0.92;
        starColors[i * 3 + 1] = 0.94;
        starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // =========================================================================
    // LAYER 1 & 2: AYIN CORE — LIVING NEURAL ENTITY (ORGANIC CENTRAL ENTITY)
    // =========================================================================
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    // 1. Biological/Quantum Nucleus (Central Glowing Seed)
    const nucleusGeo = new THREE.SphereGeometry(3.6, 32, 32);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      emissive: currentConfig.emissiveColor,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.95,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    centralGroup.add(nucleusMesh);

    // Inner Crystalline Lattice
    const crystallineGeo = new THREE.IcosahedronGeometry(4.8, 2);
    const crystallineMat = new THREE.MeshBasicMaterial({
      color: currentConfig.coreColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const crystallineMesh = new THREE.Mesh(crystallineGeo, crystallineMat);
    centralGroup.add(crystallineMesh);

    // 2. Synaptic Neural Lattice (Brain Hemispheres & Fibers)
    const neuralCount = 300;
    const neuralPositions = new Float32Array(neuralCount * 3);
    const neuralNodes: THREE.Vector3[] = [];

    for (let i = 0; i < neuralCount; i++) {
      const hemisphere = i % 2 === 0 ? 1 : -1;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 11.5 + Math.random() * 7;

      const x = (r * Math.sin(phi) * Math.cos(theta) * 0.88) + (hemisphere * 5.2);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.78 + 1.2;
      const z = r * Math.cos(phi) * 1.08;

      neuralPositions[i * 3] = x;
      neuralPositions[i * 3 + 1] = y;
      neuralPositions[i * 3 + 2] = z;
      neuralNodes.push(new THREE.Vector3(x, y, z));
    }

    const neuralGeo = new THREE.BufferGeometry();
    neuralGeo.setAttribute('position', new THREE.BufferAttribute(neuralPositions, 3));
    const neuralMat = new THREE.PointsMaterial({
      color: currentConfig.coreColor,
      size: 1.9,
      transparent: true,
      opacity: 0.85,
    });
    const neuralPoints = new THREE.Points(neuralGeo, neuralMat);
    centralGroup.add(neuralPoints);

    // Synapse Connecting Lines
    const synapsePositions: number[] = [];
    for (let i = 0; i < neuralNodes.length; i++) {
      for (let j = i + 1; j < neuralNodes.length; j++) {
        const dist = neuralNodes[i].distanceTo(neuralNodes[j]);
        if (dist < 6.4) {
          synapsePositions.push(neuralNodes[i].x, neuralNodes[i].y, neuralNodes[i].z);
          synapsePositions.push(neuralNodes[j].x, neuralNodes[j].y, neuralNodes[j].z);
        }
      }
    }
    const synapseGeo = new THREE.BufferGeometry();
    synapseGeo.setAttribute('position', new THREE.Float32BufferAttribute(synapsePositions, 3));
    const synapseMat = new THREE.LineBasicMaterial({
      color: currentConfig.emissiveColor,
      transparent: true,
      opacity: 0.28,
    });
    const synapseLines = new THREE.LineSegments(synapseGeo, synapseMat);
    centralGroup.add(synapseLines);

    // =========================================================================
    // LAYER 3: CONCENTRIC GYROSCOPIC FRACTAL RINGS (MULTI-AXIAL ROTATION)
    // =========================================================================
    // Ring 1: Inner Iris Gyro (Champagne Gold)
    const gyroMat1 = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: currentConfig.emissiveColor,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    });
    const gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.24, 16, 120), gyroMat1);
    centralGroup.add(gyroRing1);

    // Ring 2: Equatorial Gimbal Ring (State Accent)
    const gyroMat2 = new THREE.MeshStandardMaterial({
      color: currentConfig.coreColor,
      metalness: 0.85,
      roughness: 0.25,
    });
    const gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.20, 16, 120), gyroMat2);
    gyroRing2.rotation.x = Math.PI / 3;
    centralGroup.add(gyroRing2);

    // Ring 3: Fractal Astro Ring (Deep Violet / Obsidian)
    const gyroMat3 = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      metalness: 0.8,
      roughness: 0.3,
    });
    const gyroRing3 = new THREE.Mesh(new THREE.TorusGeometry(17.8, 0.16, 16, 120), gyroMat3);
    gyroRing3.rotation.y = Math.PI / 4;
    centralGroup.add(gyroRing3);

    // Ring 4: Outer Ecliptic Horizon
    const gyroMat4 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.75,
      roughness: 0.35,
    });
    const gyroRing4 = new THREE.Mesh(new THREE.TorusGeometry(22.4, 0.12, 16, 120), gyroMat4);
    gyroRing4.rotation.x = -Math.PI / 5;
    centralGroup.add(gyroRing4);

    // =========================================================================
    // LAYER 4: SMART PARTICLE QUANTUM HALO (CONVERGING / DIVERGING SWARM)
    // =========================================================================
    const smartParticleCount = 850;
    const smartParticleGeo = new THREE.BufferGeometry();
    const smartPositions = new Float32Array(smartParticleCount * 3);
    const smartBasePositions: THREE.Vector3[] = [];

    for (let i = 0; i < smartParticleCount; i++) {
      const radius = 18 + Math.random() * 14;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      smartPositions[i * 3] = x;
      smartPositions[i * 3 + 1] = y;
      smartPositions[i * 3 + 2] = z;
      smartBasePositions.push(new THREE.Vector3(x, y, z));
    }
    smartParticleGeo.setAttribute('position', new THREE.BufferAttribute(smartPositions, 3));
    const smartParticleMat = new THREE.PointsMaterial({
      color: currentConfig.coreColor,
      size: 1.8,
      transparent: true,
      opacity: 0.75,
    });
    const smartSwarm = new THREE.Points(smartParticleGeo, smartParticleMat);
    centralGroup.add(smartSwarm);

    // Shockwave expansion wave ring (visible during EXECUTANDO or command dispatch)
    const waveGeo = new THREE.RingGeometry(5, 5.8, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: currentConfig.coreColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const shockwaveMesh = new THREE.Mesh(waveGeo, waveMat);
    shockwaveMesh.rotation.x = Math.PI / 2;
    centralGroup.add(shockwaveMesh);

    // =========================================================================
    // LAYER 5: THE 11 AUTONOMOUS AGENT ORBITAL NODES & CONNECTING LASER BEAMS
    // =========================================================================
    const agentObjects: {
      agent: AutonomousAgent;
      mesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
      laserBeam: THREE.Line;
      orbitRadius: number;
      orbitAngle: number;
      speed: number;
      yOffset: number;
    }[] = [];

    const raycastInteractables: THREE.Object3D[] = [];

    if (showAgentConstellation) {
      agentList.forEach((agent, index) => {
        const radius = 28 + (index % 3) * 6.5;
        const angle = (index / agentList.length) * Math.PI * 2;
        const yOffset = ((index % 2 === 0 ? 1 : -1) * (4 + (index % 4) * 2));

        const isPaused = agent.status === 'paused' || agent.isManuallyPaused;
        const agentColor = isPaused ? 0xe11d48 : agent.status === 'analyzing' ? 0x06b6d4 : 0xfacc15;

        // Node Mesh
        const agentGeo = new THREE.OctahedronGeometry(1.6, 0);
        const agentMat = new THREE.MeshStandardMaterial({
          color: agentColor,
          emissive: agentColor,
          emissiveIntensity: isPaused ? 0.2 : 0.8,
          metalness: 0.9,
          roughness: 0.1,
        });
        const agentMesh = new THREE.Mesh(agentGeo, agentMat);
        agentMesh.userData = { type: 'agent', agent };

        // Agent Halo Ring
        const haloGeo = new THREE.RingGeometry(2.1, 2.5, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: agentColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        agentMesh.add(haloMesh);

        // Holographic Connecting Laser Beam from Core to Agent
        const laserPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
        const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
        const laserMat = new THREE.LineBasicMaterial({
          color: agentColor,
          transparent: true,
          opacity: isPaused ? 0.08 : 0.35,
        });
        const laserBeam = new THREE.Line(laserGeo, laserMat);
        scene.add(laserBeam);

        scene.add(agentMesh);
        raycastInteractables.push(agentMesh);

        agentObjects.push({
          agent,
          mesh: agentMesh,
          haloMesh,
          laserBeam,
          orbitRadius: radius,
          orbitAngle: angle,
          speed: 0.0018 + (index % 3) * 0.0006,
          yOffset,
        });
      });
    }

    // =========================================================================
    // LAYER 6: THE 8 DEPARTMENT CELESTIAL ANCHORS & ORBITS
    // =========================================================================
    const deptObjects: {
      dept: DepartmentInfo;
      mesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
      orbitRadiusX: number;
      orbitRadiusZ: number;
      orbitAngle: number;
      speed: number;
    }[] = [];

    departments.forEach((dept, index) => {
      const radiusBase = 58 + index * 10;
      const angle = (index / departments.length) * Math.PI * 2;
      const deptColor = new THREE.Color(dept.color).getHex();

      // Orbital ellipse track
      const orbitCurve = new THREE.EllipseCurve(0, 0, radiusBase, radiusBase * 0.88, 0, 2 * Math.PI, false, 0);
      const orbitPoints = orbitCurve.getPoints(120);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x3b1d6e,
        transparent: true,
        opacity: 0.3,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);

      // Department planetary beacon
      const nodeGeo = new THREE.SphereGeometry(2.8, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: deptColor,
        emissive: deptColor,
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.75,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.userData = { type: 'dept', dept };

      // Halo ring around department
      const haloGeo = new THREE.RingGeometry(3.6, 4.2, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: deptColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      nodeMesh.add(haloMesh);

      scene.add(nodeMesh);
      raycastInteractables.push(nodeMesh);

      deptObjects.push({
        dept,
        mesh: nodeMesh,
        haloMesh,
        orbitRadiusX: radiusBase,
        orbitRadiusZ: radiusBase * 0.88,
        orbitAngle: angle,
        speed: 0.0007 + index * 0.00015,
      });
    });

    // =========================================================================
    // INTERACTIVE CONTROLS (ORBIT DRAG, ZOOM, HOVER, SELECTION)
    // =========================================================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;
    let cameraTargetZ = 145;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.004;
        targetRotationX += deltaY * 0.004;
        targetRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotationX));
        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Raycast hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastInteractables, true);
        if (intersects.length > 0) {
          const root = intersects[0].object;
          let current: THREE.Object3D | null = root;
          while (current && !current.userData?.type) {
            current = current.parent;
          }
          if (current && current.userData?.type) {
            setHoveredEntity({
              type: current.userData.type,
              data: current.userData.agent || current.userData.dept,
            });
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredEntity(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraTargetZ += e.deltaY * 0.12;
      cameraTargetZ = Math.max(55, Math.min(260, cameraTargetZ));
      setCameraZoomLevel(Math.round((145 / cameraTargetZ) * 100) / 100);
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastInteractables, true);
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !current.userData?.type) {
          current = current.parent;
        }
        if (current && current.userData?.type === 'agent') {
          livingAudio.playTone('click');
          setInspectedAgent(current.userData.agent);
          if (onSelectAgent) onSelectAgent(current.userData.agent);
        } else if (current && current.userData?.type === 'dept') {
          livingAudio.playTone('click');
          onSelectDepartment(current.userData.dept.id);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // =========================================================================
    // ANIMATION & STATE-DRIVEN SIMULATION LOOP
    // =========================================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let shockwaveRadius = 5.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera position & scene rotation damping
      camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTargetZ, 4.0, delta);
      scene.rotation.y = THREE.MathUtils.damp(scene.rotation.y, targetRotationY, 4.5, delta);
      scene.rotation.x = THREE.MathUtils.damp(scene.rotation.x, targetRotationX, 4.5, delta);

      // Starfield slow cosmic drift
      if (!reducedMotion) {
        starField.rotation.y += 0.00012;
      }

      // Gyroscopic Rotations tied to current state speed
      if (!reducedMotion) {
        const speedMultiplier = effectiveState === 'PAUSADO' ? 0.05 : 1.0;
        gyroRing1.rotation.z += currentConfig.gyroSpeed * 1.2 * speedMultiplier;
        gyroRing2.rotation.x += currentConfig.gyroSpeed * 0.9 * speedMultiplier;
        gyroRing3.rotation.y += currentConfig.gyroSpeed * 1.4 * speedMultiplier;
        gyroRing4.rotation.z -= currentConfig.gyroSpeed * 0.7 * speedMultiplier;

        centralGroup.rotation.y += 0.0018 * speedMultiplier;

        // Breathing & Respiration
        const pulse = Math.sin(time * currentConfig.pulseRate) * 0.07;
        const nucleusScale = 1.0 + pulse;
        nucleusMesh.scale.set(nucleusScale, nucleusScale, nucleusScale);
        crystallineMesh.scale.set(1.0 + pulse * 1.3, 1.0 + pulse * 1.3, 1.0 + pulse * 1.3);

        corePointLight.intensity = currentConfig.lightIntensity + Math.sin(time * currentConfig.pulseRate * 1.5) * 0.8;

        // Smart particles: convergence / divergence behavior
        const posArray = smartParticleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < smartParticleCount; i++) {
          const base = smartBasePositions[i];
          let factor = 1.0;

          if (effectiveState === 'PROCESSANDO') {
            // Inward convergence
            factor = 0.65 + Math.sin(time * 3 + i) * 0.25;
          } else if (effectiveState === 'ANALISANDO') {
            // Outward expanding ripples
            factor = 1.0 + Math.sin(time * 2.5 + i * 0.2) * 0.35;
          } else {
            factor = 1.0 + Math.sin(time * 1.2 + i * 0.1) * 0.08;
          }

          posArray[i * 3] = base.x * factor;
          posArray[i * 3 + 1] = base.y * factor;
          posArray[i * 3 + 2] = base.z * factor;
        }
        smartParticleGeo.attributes.position.needsUpdate = true;

        // Shockwave expansion
        if (effectiveState === 'EXECUTANDO' || effectiveState === 'ANALISANDO') {
          shockwaveRadius += delta * 18.0;
          if (shockwaveRadius > 45) shockwaveRadius = 5.0;
          shockwaveMesh.scale.set(shockwaveRadius / 5.0, shockwaveRadius / 5.0, shockwaveRadius / 5.0);
          (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - (shockwaveRadius / 45));
        } else {
          (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Update 11 Agent Nodes & Connecting Laser Beams
      agentObjects.forEach((item, idx) => {
        if (!reducedMotion && effectiveState !== 'PAUSADO') {
          item.orbitAngle += item.speed;
        }
        const x = Math.cos(item.orbitAngle) * item.orbitRadius;
        const z = Math.sin(item.orbitAngle) * item.orbitRadius;
        const y = item.yOffset + Math.sin(time * 2 + idx) * 0.8;

        item.mesh.position.set(x, y, z);
        item.mesh.rotation.y += 0.015;
        item.mesh.rotation.x += 0.01;

        // Update Laser Beam from Core (0,0,0) to Agent (x,y,z)
        const linePos = item.laserBeam.geometry.attributes.position.array as Float32Array;
        linePos[0] = 0;
        linePos[1] = 0;
        linePos[2] = 0;
        linePos[3] = x;
        linePos[4] = y;
        linePos[5] = z;
        item.laserBeam.geometry.attributes.position.needsUpdate = true;
      });

      // Update 8 Department Anchors
      deptObjects.forEach(d => {
        if (!reducedMotion && effectiveState !== 'PAUSADO') {
          d.orbitAngle += d.speed;
        }
        const x = Math.cos(d.orbitAngle) * d.orbitRadiusX;
        const z = Math.sin(d.orbitAngle) * d.orbitRadiusZ;
        const y = Math.sin(d.orbitAngle * 2) * 4.5;
        d.mesh.position.set(x, y, z);

        if (selectedDepartmentId === d.dept.id) {
          d.haloMesh.scale.set(1.5, 1.5, 1.5);
          (d.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.3;
        } else {
          d.haloMesh.scale.set(1.0, 1.0, 1.0);
          (d.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP ON UNMOUNT (Dispose geometries, materials, listeners per skill)
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);

      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      crystallineGeo.dispose();
      crystallineMat.dispose();
      neuralGeo.dispose();
      neuralMat.dispose();
      synapseGeo.dispose();
      synapseMat.dispose();
      gyroMat1.dispose();
      gyroMat2.dispose();
      gyroMat3.dispose();
      gyroMat4.dispose();
      smartParticleGeo.dispose();
      smartParticleMat.dispose();
      waveGeo.dispose();
      waveMat.dispose();
    };
  }, [
    departments, 
    agents, 
    effectiveState, 
    selectedDepartmentId, 
    reducedMotion, 
    showAgentConstellation
  ]);

  const activeMissionsList = missions.filter(m => m.status === 'in_progress' || m.status === 'awaiting_approval');

  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 bg-[#020204] ${
        isTotalFocus
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none shadow-none'
          : 'relative w-full h-[660px] lg:h-[760px] rounded-3xl border border-purple-900/40 shadow-2xl'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ------------------------------------------------------------- */}
      {/* TOP-LEFT SPATIAL HUD: IDENTITY & 10-STATE STATUS INDICATOR    */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-5 left-5 z-20 pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl glass-obsidian border border-purple-500/30 flex items-center justify-center text-amber-400 shadow-lg glow-eye">
            <Eye className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-sm font-bold text-white tracking-widest uppercase">
                SHEFA AYIN
              </span>
              <span className="text-[11px] font-cinzel text-amber-300/80">עין השפע</span>
              {isTotalFocus && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-numbers bg-amber-950/70 border border-amber-500/50 text-amber-300">
                  FOCO TOTAL [ESC]
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
              <span>LIVING INTELLIGENCE OBSERVATORY</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-mono-numbers">v3.8</span>
            </div>
          </div>
        </div>

        {/* State Badge with real visual feedback */}
        <div className="glass-obsidian px-3 py-1.5 rounded-xl border border-purple-500/25 flex items-center gap-2.5 w-fit shadow-md">
          <span 
            className="w-2.5 h-2.5 rounded-full animate-ping shrink-0" 
            style={{ backgroundColor: currentConfig.accentColor }}
          />
          <div>
            <span 
              className="text-xs font-bold font-mono-numbers tracking-wide block leading-none"
              style={{ color: currentConfig.accentColor }}
            >
              {currentConfig.label}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-light">
              {currentConfig.sublabel}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP-RIGHT CONTROLS HUD: AUDIO, CAMERA, STATE PICKER & FULLSCREEN */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 pointer-events-auto">
        
        {/* State Simulator Selector (to verify/demonstrate all 10 states) */}
        <select
          value={previewState || ''}
          onChange={(e) => setPreviewState(e.target.value ? (e.target.value as LivingCoreVisualState) : null)}
          title="Inspecionar os 10 Estados Visuais do AYIN CORE"
          className="text-[11px] px-2.5 py-1.5 glass-obsidian rounded-xl border border-purple-500/30 text-purple-200 hover:text-white focus:outline-none cursor-pointer hidden sm:block"
        >
          <option value="" className="bg-[#050508] text-slate-300">
            Estado Real: {livingState}
          </option>
          {(Object.keys(STATE_CONFIG) as LivingCoreVisualState[]).map(state => (
            <option key={state} value={state} className="bg-[#050508] text-white">
              {state} — {STATE_CONFIG[state].label}
            </option>
          ))}
        </select>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleAudio}
          title={isAudioMuted ? 'Ativar Voz & Efeitos Procedurais' : 'Silenciar Áudio'}
          className={`p-2 rounded-xl glass-obsidian border transition-all cursor-pointer ${
            isAudioMuted ? 'text-slate-500 border-purple-900/30' : 'text-amber-400 border-amber-500/40 glow-gold'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Telemetry Drawer Toggle */}
        <button
          onClick={() => setShowTelemetryDrawer(!showTelemetryDrawer)}
          title="Telemetria de Missões Ativas"
          className={`p-2 rounded-xl glass-obsidian border transition-all cursor-pointer ${
            showTelemetryDrawer ? 'text-amber-300 border-amber-500/50 bg-amber-950/40' : 'text-slate-300 border-purple-900/30 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Constellation Toggle */}
        <button
          onClick={() => setShowAgentConstellation(!showAgentConstellation)}
          title={showAgentConstellation ? 'Ocultar Constelação de 11 Agentes' : 'Exibir Constelação de 11 Agentes'}
          className={`p-2 rounded-xl glass-obsidian border transition-all cursor-pointer ${
            showAgentConstellation ? 'text-purple-300 border-purple-500/40' : 'text-slate-500 border-purple-900/30'
          }`}
        >
          <Cpu className="w-4 h-4" />
        </button>

        {/* Reset View */}
        <button
          onClick={onFocusCore}
          title="Centralizar Câmera no Núcleo AYIN"
          className="p-2 rounded-xl glass-obsidian border border-purple-900/30 text-purple-200 hover:text-amber-300 hover:border-amber-400/40 transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Fullscreen / Total Focus Toggle */}
        {onToggleTotalFocus && (
          <button
            onClick={onToggleTotalFocus}
            title={isTotalFocus ? 'Sair do Modo de Foco Total [ESC]' : 'Entrar no Foco Total [F]'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md ${
              isTotalFocus
                ? 'bg-amber-950/80 border border-amber-400/70 text-amber-300 glow-gold'
                : 'glass-obsidian border border-purple-500/30 text-purple-200 hover:text-amber-300 hover:border-amber-400/40'
            }`}
          >
            {isTotalFocus ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sair [ESC]</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Foco Total [F]</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TELEMETRY DRAWER OVERLAY                                      */}
      {/* ------------------------------------------------------------- */}
      {showTelemetryDrawer && (
        <div className="absolute top-18 right-5 z-20 w-84 max-h-[calc(100vh-140px)] glass-obsidian rounded-2xl border border-purple-500/30 p-4 shadow-2xl flex flex-col space-y-3 pointer-events-auto overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Telemetria em Tempo Real</span>
            </div>
            <button
              onClick={() => setShowTelemetryDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Missões Ativas ({activeMissionsList.length})
            </span>

            {activeMissionsList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-[#020204]/60 rounded-xl border border-purple-900/20">
                Nenhuma missão em execução. AYIN CORE vigilante.
              </div>
            ) : (
              activeMissionsList.map((m) => (
                <div key={m.id} className="p-3 bg-[#050508]/85 rounded-xl border border-purple-900/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[170px]">{m.title}</span>
                    <span className={`text-[10px] font-mono-numbers px-1.5 py-0.5 rounded ${
                      m.status === 'awaiting_approval' 
                        ? 'text-amber-300 bg-amber-950/60 border border-amber-500/30' 
                        : 'text-purple-300 bg-purple-950/60'
                    }`}>
                      {m.status === 'awaiting_approval' ? 'Trava' : 'Executando'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{m.objective}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-purple-900/20 font-mono-numbers">
                    <span>{m.departmentsInvolved.join(' · ')}</span>
                    <span>{m.steps.filter(s => s.status === 'completed').length}/{m.steps.length} etapas</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AGENT INSPECTION MODAL (CLICK ON AGENT IN SCENE OR DOCK)     */}
      {/* ------------------------------------------------------------- */}
      {inspectedAgent && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-md p-6 glass-obsidian-gold rounded-3xl border border-amber-500/40 shadow-2xl space-y-4 pointer-events-auto animate-fade-in glow-gold">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {inspectedAgent.name}
                </h3>
                <span className="text-xs font-cinzel text-amber-300">
                  {inspectedAgent.hebrewCodename} · {inspectedAgent.agentRoleType || inspectedAgent.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => setInspectedAgent(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">Especialidade Tática</span>
              <p className="text-slate-200 leading-relaxed">{inspectedAgent.specialty}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-purple-900/30 font-mono-numbers">
              <div className="p-2 bg-[#020204]/60 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className={`font-semibold capitalize ${
                  inspectedAgent.status === 'paused' || inspectedAgent.isManuallyPaused ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {inspectedAgent.status === 'paused' || inspectedAgent.isManuallyPaused ? 'Pausado' : inspectedAgent.status}
                </span>
              </div>
              <div className="p-2 bg-[#020204]/60 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Acurácia</span>
                <span className="font-semibold text-amber-300">{inspectedAgent.accuracyScore || 98}%</span>
              </div>
              <div className="p-2 bg-[#020204]/60 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block">Missões</span>
                <span className="font-semibold text-purple-300">{inspectedAgent.totalMissionsCompleted || 120}</span>
              </div>
            </div>

            {/* Individual Pause / Resume Trigger */}
            {onToggleAgentPause && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300">Controle Operacional 24/7</span>
                <button
                  onClick={async () => {
                    await onToggleAgentPause(inspectedAgent.id);
                    setInspectedAgent(prev => prev ? { 
                      ...prev, 
                      isManuallyPaused: !prev.isManuallyPaused,
                      status: prev.isManuallyPaused ? 'running' : 'paused' 
                    } : null);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    inspectedAgent.isManuallyPaused || inspectedAgent.status === 'paused'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40'
                  }`}
                >
                  {inspectedAgent.isManuallyPaused || inspectedAgent.status === 'paused' ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Retomar Agente</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar Agente</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* HOVER ENTITY CARD (WHEN USER HOVERS ON DEPT OR AGENT IN 3D)   */}
      {/* ------------------------------------------------------------- */}
      {hoveredEntity && !inspectedAgent && (
        <div className="absolute bottom-24 left-6 z-20 max-w-sm glass-obsidian p-3.5 rounded-2xl border border-purple-500/30 shadow-xl pointer-events-none animate-fade-in">
          {hoveredEntity.type === 'agent' ? (
            <div>
              <div className="flex items-center justify-between gap-3 mb-0.5">
                <span className="text-xs font-bold text-white">{hoveredEntity.data.name}</span>
                <span className="text-[11px] font-cinzel text-amber-300">{hoveredEntity.data.hebrewCodename}</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">{hoveredEntity.data.specialty}</p>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Clique para inspecionar</span>
                <span>·</span>
                <span className="font-mono-numbers text-purple-300">
                  {hoveredEntity.data.accuracyScore ? `${hoveredEntity.data.accuracyScore}% acurácia` : 'Ativo 24/7'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-0.5">
                <span className="text-xs font-bold text-white">{hoveredEntity.data.name}</span>
                <span className="text-[11px] font-cinzel text-amber-300">{hoveredEntity.data.hebrewName}</span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2">{hoveredEntity.data.roleDescription}</p>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono-numbers">
                <span>{hoveredEntity.data.activeAgentsCount} Agentes Alocados</span>
                <span className="text-amber-400">Clique para entrar</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* COLLAPSIBLE SPATIAL HUD DOCK (CONSOLIDATED BOTTOM CONTROLS)   */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 pointer-events-auto">
        <div className="glass-obsidian-gold rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-xl p-2.5 transition-all glow-purple">
          
          {/* Header Row: Tabs & Collapse Button */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-900/30 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTabDock('command')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTabDock === 'command'
                    ? 'bg-purple-800 text-amber-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Comando Central
              </button>
              <button
                onClick={() => setActiveTabDock('agents')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTabDock === 'agents'
                    ? 'bg-purple-800 text-amber-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>11 Agentes</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
              <button
                onClick={() => setActiveTabDock('departments')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTabDock === 'departments'
                    ? 'bg-purple-800 text-amber-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                8 Departamentos
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono-numbers hidden sm:inline">
                Zoom {cameraZoomLevel}x
              </span>
              <button
                onClick={() => setDockCollapsed(!dockCollapsed)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                title={dockCollapsed ? 'Expandir HUD' : 'Recolher HUD'}
              >
                {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!dockCollapsed && (
            <>
              {/* TAB 1: LIVING COMMAND CAPSULE (VOICE + TEXT INPUT) */}
              {activeTabDock === 'command' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeCommand(commandPrompt);
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    title={isListeningVoice ? 'Ouvindo... Clique para cancelar' : 'Comando por Voz'}
                    className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                      isListeningVoice
                        ? 'bg-rose-600 text-white animate-pulse glow-gold'
                        : 'glass-obsidian border border-purple-500/30 text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    {isListeningVoice ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={commandPrompt}
                    onChange={(e) => setCommandPrompt(e.target.value)}
                    placeholder={
                      isListeningVoice 
                        ? 'Ouvindo sua voz... Fale a ordem estratégica...' 
                        : 'Despachar ordem executiva ao AYIN CORE (ex: varrer mercado, orçar, prospectar)...'
                    }
                    className="flex-1 bg-[#050508]/60 text-xs text-white placeholder-slate-400 px-3 py-2 rounded-xl border border-purple-900/30 focus:border-amber-500/40 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={isSendingCommand || !commandPrompt.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-white font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingCommand ? 'Transmitindo...' : 'Comandar'}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: 11 AUTONOMOUS AGENTS QUICK SELECTOR */}
              {activeTabDock === 'agents' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {agentList.map((ag) => {
                    const isPaused = ag.status === 'paused' || ag.isManuallyPaused;
                    return (
                      <button
                        key={ag.id}
                        onClick={() => {
                          setInspectedAgent(ag);
                          if (onSelectAgent) onSelectAgent(ag);
                        }}
                        className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isPaused
                            ? 'bg-rose-950/40 border-rose-900/40 text-rose-300'
                            : 'bg-[#020204]/70 border-purple-900/30 hover:border-amber-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold truncate">{ag.name.replace(' Sentinel', '').replace(' Organizer', '').replace(' Strategist', '')}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        </div>
                        <span className="text-[9px] font-cinzel text-amber-400/80 block">{ag.hebrewCodename}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: 8 DEPARTMENTS QUICK JUMP */}
              {activeTabDock === 'departments' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {departments.map((dept) => {
                    const isSelected = dept.id === selectedDepartmentId;
                    return (
                      <button
                        key={dept.id}
                        onClick={() => onSelectDepartment(dept.id)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-900/80 border-amber-500/50 text-amber-300'
                            : 'bg-[#020204]/70 border-purple-900/30 hover:border-purple-500/40 text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] font-semibold block truncate">{dept.name}</span>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                          <span className="font-cinzel text-amber-300/80">{dept.hebrewName}</span>
                          <span className="font-mono-numbers">{dept.activeAgentsCount} Agentes</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {quickFeedback && (
            <div className="mt-2 text-center text-xs text-amber-300 glass-obsidian py-1 px-3 rounded-full border border-amber-500/30 animate-fade-in max-w-md mx-auto">
              {quickFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
