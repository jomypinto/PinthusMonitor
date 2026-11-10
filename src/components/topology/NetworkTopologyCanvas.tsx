import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Network, 
  Server, 
  Router, 
  Wifi, 
  HardDrive, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download, 
  Filter, 
  Info, 
  ExternalLink, 
  Play, 
  Sliders, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Eye,
  EyeOff,
  Move
} from 'lucide-react';
import { NetworkDevice, ConnectionLink, DeviceType } from '../../types/network';

interface NetworkTopologyCanvasProps {
  devices: NetworkDevice[];
  connectionLinks: ConnectionLink[];
  onOpenDeviceDetail: (device: NetworkDevice) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

type LayoutMode = 'hierarchical' | 'radial' | 'vlan_clusters';

export const NetworkTopologyCanvas: React.FC<NetworkTopologyCanvasProps> = ({
  devices,
  connectionLinks,
  onOpenDeviceDetail
}) => {
  // Viewport transformation states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 60 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node drag states
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection & UI states
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('hierarchical');
  const [selectedVlan, setSelectedVlan] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAnimations, setShowAnimations] = useState<boolean>(true);
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filtered devices based on controls
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedVlan !== 'all' && d.vlan !== Number(selectedVlan)) return false;
      if (selectedType !== 'all' && d.deviceType !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return d.hostname.toLowerCase().includes(q) || d.ipAddress.includes(q) || d.manufacturer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [devices, selectedVlan, selectedType, searchQuery]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    return devices.find(d => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  // Unique VLANs
  const availableVlans = useMemo(() => {
    const set = new Set<number>();
    devices.forEach(d => { if (d.vlan) set.add(d.vlan); });
    return Array.from(set).sort((a, b) => a - b);
  }, [devices]);

  // Initialize and calculate layout coordinates based on layoutMode
  useEffect(() => {
    const newPositions: Record<string, NodePosition> = {};
    const width = 1100;
    const height = 750;

    if (layoutMode === 'hierarchical') {
      // Group devices into 5 tiers
      const tiers: Record<number, NetworkDevice[]> = {
        0: [], // WAN / Internet Gateways
        1: [], // Core Routers & Edge Firewalls
        2: [], // Distribution Switches & Network Hosts
        3: [], // Access Points & Hypervisors / NAS
        4: []  // Endpoints / Clients / IoT
      };

      devices.forEach(d => {
        if (d.tags?.includes('WAN')) {
          tiers[0].push(d);
        } else if (d.deviceType === 'Router' || d.id === 'real-gw-01' || d.ipAddress.endsWith('.1')) {
          tiers[1].push(d);
        } else if (d.deviceType === 'Switch' || d.id === 'real-host-01' || d.hostname.includes('nexus')) {
          tiers[2].push(d);
        } else if (d.deviceType === 'Access Point' || d.deviceType === 'NAS / Storage' || d.tags?.includes('Storage')) {
          tiers[3].push(d);
        } else {
          tiers[4].push(d);
        }
      });

      const tierY = [80, 220, 380, 540, 700];

      Object.entries(tiers).forEach(([tierStr, devs]) => {
        const tier = Number(tierStr);
        const y = tierY[tier];
        const count = devs.length;
        if (count === 0) return;

        const spacing = Math.min(260, Math.max(180, (width - 160) / (count + 1)));
        const startX = (width - (count - 1) * spacing) / 2;

        devs.forEach((dev, idx) => {
          newPositions[dev.id] = {
            x: startX + idx * spacing,
            y: y
          };
        });
      });
    } else if (layoutMode === 'radial') {
      // Core device at center, outer rings for other layers
      const centerX = width / 2;
      const centerY = height / 2;

      const coreDev = devices.find(d => d.deviceType === 'Router' || d.id === 'real-gw-01') || devices[0];
      if (coreDev) {
        newPositions[coreDev.id] = { x: centerX, y: centerY };
      }

      const ring1: NetworkDevice[] = [];
      const ring2: NetworkDevice[] = [];

      devices.forEach(d => {
        if (coreDev && d.id === coreDev.id) return;
        if (d.deviceType === 'Server' || d.deviceType === 'Switch' || d.deviceType === 'Access Point') {
          ring1.push(d);
        } else {
          ring2.push(d);
        }
      });

      // Ring 1 (Radius 200)
      const r1 = 200;
      ring1.forEach((dev, i) => {
        const angle = (i / ring1.length) * 2 * Math.PI - Math.PI / 2;
        newPositions[dev.id] = {
          x: centerX + r1 * Math.cos(angle),
          y: centerY + r1 * Math.sin(angle)
        };
      });

      // Ring 2 (Radius 360)
      const r2 = 360;
      ring2.forEach((dev, i) => {
        const angle = (i / ring2.length) * 2 * Math.PI - Math.PI / 2;
        newPositions[dev.id] = {
          x: centerX + r2 * Math.cos(angle),
          y: centerY + r2 * Math.sin(angle)
        };
      });
    } else if (layoutMode === 'vlan_clusters') {
      // Cluster by VLAN
      const vlanGroups: Record<number, NetworkDevice[]> = {};
      devices.forEach(d => {
        const v = d.vlan || 1;
        if (!vlanGroups[v]) vlanGroups[v] = [];
        vlanGroups[v].push(d);
      });

      const vlanKeys = Object.keys(vlanGroups).map(Number);
      const cols = Math.min(3, vlanKeys.length);
      const colWidth = (width - 100) / cols;

      vlanKeys.forEach((vlan, groupIdx) => {
        const col = groupIdx % cols;
        const row = Math.floor(groupIdx / cols);
        const groupDevs = vlanGroups[vlan];

        const groupOriginX = 80 + col * colWidth;
        const groupOriginY = 100 + row * 340;

        groupDevs.forEach((dev, devIdx) => {
          const itemCol = devIdx % 2;
          const itemRow = Math.floor(devIdx / 2);
          newPositions[dev.id] = {
            x: groupOriginX + itemCol * 170 + 40,
            y: groupOriginY + itemRow * 130 + 50
          };
        });
      });
    }

    setNodePositions(newPositions);
  }, [devices, layoutMode]);

  // Center on node if search query matches single device
  useEffect(() => {
    if (!searchQuery) return;
    const match = devices.find(d => 
      d.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.ipAddress.includes(searchQuery)
    );
    if (match && nodePositions[match.id]) {
      const pos = nodePositions[match.id];
      setSelectedDeviceId(match.id);
      setPan({
        x: 450 - pos.x * zoom,
        y: 300 - pos.y * zoom
      });
    }
  }, [searchQuery, devices, nodePositions, zoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.4, Math.min(2.5, zoom * zoomFactor));

    // Zoom toward mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
      }));
    }
    setZoom(newZoom);
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNodeId) {
      // Update node position
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const svgX = (e.clientX - rect.left - pan.x) / zoom;
        const svgY = (e.clientY - rect.top - pan.y) / zoom;
        setNodePositions(prev => ({
          ...prev,
          [draggingNodeId]: {
            x: Math.round(svgX - dragNodeOffset.x),
            y: Math.round(svgY - dragNodeOffset.y)
          }
        }));
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedDeviceId(id);
    const pos = nodePositions[id] || { x: 0, y: 0 };
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const svgX = (e.clientX - rect.left - pan.x) / zoom;
      const svgY = (e.clientY - rect.top - pan.y) / zoom;
      setDragNodeOffset({
        x: svgX - pos.x,
        y: svgY - pos.y
      });
      setDraggingNodeId(id);
    }
  };

  // Reset viewport to default
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 80, y: 50 });
  };

  // Helper icon for device types
  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'Router':
        return <Router size={16} className="text-cyan-400" />;
      case 'Switch':
        return <Network size={16} className="text-purple-400" />;
      case 'Access Point':
        return <Wifi size={16} className="text-amber-400" />;
      case 'NAS / Storage':
        return <HardDrive size={16} className="text-emerald-400" />;
      case 'Server':
        return <Server size={16} className="text-cyan-300" />;
      default:
        return <Cpu size={16} className="text-slate-300" />;
    }
  };

  // Compute curved Bezier connection paths
  const resolvedLinks = useMemo(() => {
    return connectionLinks.map((link, idx) => {
      const sourcePos = nodePositions[link.sourceId];
      const targetPos = nodePositions[link.targetId];
      if (!sourcePos || !targetPos) return null;

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Control points for smooth organic curve
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      const curvature = Math.min(45, Math.max(15, dist * 0.15));
      const nx = -dy / (dist || 1);
      const ny = dx / (dist || 1);

      const cx = midX + nx * (idx % 2 === 0 ? curvature : -curvature);
      const cy = midY + ny * (idx % 2 === 0 ? curvature : -curvature);

      const pathData = `M ${sourcePos.x} ${sourcePos.y} Q ${cx} ${cy} ${targetPos.x} ${targetPos.y}`;

      const linkId = `${link.sourceId}-${link.targetId}-${idx}`;
      return {
        ...link,
        id: linkId,
        pathData,
        midX: cx,
        midY: cy
      };
    }).filter(Boolean);
  }, [connectionLinks, nodePositions]);

  // Export current SVG canvas
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-network-topology-${new Date().toISOString().slice(0, 10)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-hidden' : ''}`}>
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Network size={22} className="text-cyan-400" />
              <span>Mapa de Topologia de Rede Interativo</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              L2 / L3 LIVE CANVAS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Representação visual dinâmica dos nós e ligações físicas da infraestrutura. Arraste nós livremente, faça zoom com a roda do rato, inspecione portas e fluxo de pacotes em tempo real.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowAnimations(!showAnimations)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
              showAnimations ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Alternar fluxo animado de pacotes nas ligações"
          >
            <Activity size={13} className={showAnimations ? 'animate-pulse text-cyan-400' : ''} />
            <span>{showAnimations ? 'Fluxo Ativo' : 'Fluxo Pausado'}</span>
          </button>

          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-mono font-medium transition-colors"
            title="Exportar diagrama em formato SVG vetorial"
          >
            <Download size={13} />
            <span>Exportar SVG</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Sair do Modo Ecrã Inteiro' : 'Modo Ecrã Inteiro NOC'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/70 rounded-lg border border-slate-800 text-xs font-mono">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Localizar nó ou IP no mapa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Layout Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">Layout:</span>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="hierarchical">Hierárquico (L2/L3)</option>
              <option value="radial">Radial (Core Concentric)</option>
              <option value="vlan_clusters">Agrupamento por VLAN</option>
            </select>
          </div>

          {/* VLAN Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">VLAN:</span>
            <select
              value={selectedVlan}
              onChange={(e) => setSelectedVlan(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Todas as VLANs</option>
              {availableVlans.map(v => (
                <option key={v} value={String(v)}>VLAN {v}</option>
              ))}
            </select>
          </div>

          {/* Device Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Todos os Tipos</option>
              <option value="Router">Routers & Gateways</option>
              <option value="Switch">Switches</option>
              <option value="Server">Servidores</option>
              <option value="Access Point">Access Points</option>
              <option value="NAS / Storage">Armazenamento NAS</option>
            </select>
          </div>
        </div>

        {/* Right: Zoom controls & stats */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setZoom(prev => Math.min(2.5, prev * 1.2))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
              title="Aproximar (Zoom In)"
            >
              <ZoomIn size={14} />
            </button>
            <span className="px-2 text-[11px] text-slate-400 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.max(0.4, prev * 0.8))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors"
              title="Afastar (Zoom Out)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-colors border-l border-slate-800 ml-0.5"
              title="Repor Vista Original"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            <strong className="text-slate-200">{filteredDevices.length}</strong> nós · <strong className="text-slate-200">{connectionLinks.length}</strong> links
          </div>
        </div>
      </div>

      {/* Main Canvas + Side Inspection Panel */}
      <div 
        ref={containerRef}
        className="relative w-full h-[640px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Subtle grid pattern background */}
        <svg 
          ref={svgRef}
          className="w-full h-full"
          id="canvas-bg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="topology-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.4" />
              <circle cx="0" cy="0" r="1" fill="#334155" opacity="0.6" />
            </pattern>

            {/* Glowing filter for active links */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid layer */}
          <rect width="100%" height="100%" fill="url(#topology-grid)" />

          {/* Transformed Group (Pan & Zoom) */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* VLAN Cluster Background Boundaries (if layoutMode === 'vlan_clusters') */}
            {layoutMode === 'vlan_clusters' && availableVlans.map((vlan, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = 60 + col * 340;
              const y = 60 + row * 340;

              return (
                <g key={`vlan-box-${vlan}`}>
                  <rect
                    x={x}
                    y={y}
                    width={320}
                    height={300}
                    rx={8}
                    fill="#0f172a"
                    fillOpacity="0.4"
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + 15}
                    y={y + 24}
                    fill="#38bdf8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    VLAN {vlan} {vlan === 1 ? '(Gestão / Core)' : vlan === 20 ? '(Storage & Serviços)' : '(Segmento Local)'}
                  </text>
                </g>
              );
            })}

            {/* 1. Connection Links Layer */}
            {resolvedLinks.map(link => {
              if (!link) return null;
              const isSelected = selectedDeviceId && (link.sourceId === selectedDeviceId || link.targetId === selectedDeviceId);
              const isHovered = hoveredLinkId === link.id;

              // Color coding by link type
              let strokeColor = '#06b6d4'; // default cyan
              let strokeWidth = 2;
              let isDashed = false;

              if (link.linkType === 'trunk') {
                strokeColor = '#a855f7'; // purple 10G
                strokeWidth = 2.5;
              } else if (link.linkType === 'wireless') {
                strokeColor = '#f59e0b'; // amber wifi
                strokeWidth = 1.8;
                isDashed = true;
              } else if (link.linkType === 'gateway') {
                strokeColor = '#06b6d4'; // cyan
                strokeWidth = 2.5;
              } else {
                strokeColor = '#10b981'; // emerald 1G cat6
                strokeWidth = 1.8;
              }

              if (link.status === 'down') {
                strokeColor = '#f43f5e';
                strokeWidth = 2;
                isDashed = true;
              }

              return (
                <g 
                  key={link.id}
                  onMouseEnter={() => setHoveredLinkId(link.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                >
                  {/* Invisible thicker path for easy hovering */}
                  <path
                    d={link.pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    className="cursor-pointer"
                  />

                  {/* Main link path */}
                  <path
                    d={link.pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected || isHovered ? strokeWidth + 1.5 : strokeWidth}
                    strokeDasharray={isDashed ? '6 4' : undefined}
                    opacity={isSelected || isHovered ? 1 : 0.65}
                    filter={isSelected || isHovered ? 'url(#glow-cyan)' : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Animated traveling packet / throughput indicator */}
                  {showAnimations && link.status === 'up' && (
                    <circle r={link.speedMbps >= 10000 ? 3.5 : 2.5} fill={strokeColor} opacity="0.9">
                      <animateMotion
                        path={link.pathData}
                        dur={link.speedMbps >= 10000 ? '1.4s' : link.speedMbps >= 1000 ? '2.2s' : '3.4s'}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Port label badge in center of link on hover or selected */}
                  {(isHovered || isSelected) && (
                    <g transform={`translate(${link.midX}, ${link.midY})`}>
                      <rect
                        x="-45"
                        y="-11"
                        width="90"
                        height="22"
                        rx="4"
                        fill="#020617"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {link.speedMbps >= 1000 ? `${link.speedMbps / 1000}G` : `${link.speedMbps}M`} · {link.sourcePort || 'eth0'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 2. Device Nodes Layer */}
            {filteredDevices.map(dev => {
              const pos = nodePositions[dev.id] || { x: 100, y: 100 };
              const isSelected = selectedDeviceId === dev.id;
              const isHovered = hoveredDeviceId === dev.id;
              const isOnline = dev.status === 'online';

              const cardWidth = 148;
              const cardHeight = 64;

              return (
                <g
                  key={dev.id}
                  transform={`translate(${pos.x - cardWidth / 2}, ${pos.y - cardHeight / 2})`}
                  onMouseDown={(e) => handleNodeMouseDown(e, dev.id)}
                  onMouseEnter={() => setHoveredDeviceId(dev.id)}
                  onMouseLeave={() => setHoveredDeviceId(null)}
                  className="cursor-pointer"
                >
                  {/* Selection / Status Halo */}
                  {(isSelected || isHovered) && (
                    <rect
                      x="-4"
                      y="-4"
                      width={cardWidth + 8}
                      height={cardHeight + 8}
                      rx="10"
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : '#64748b'}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}

                  {/* Main Node Card Box */}
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="6"
                    fill={isSelected ? '#0f172a' : '#020617'}
                    stroke={
                      isSelected ? '#38bdf8' :
                      dev.status === 'online' ? '#334155' :
                      dev.status === 'degraded' ? '#f59e0b' : '#f43f5e'
                    }
                    strokeWidth={isSelected ? 1.8 : 1}
                    className="transition-colors duration-150"
                  />

                  {/* Top status indicator strip */}
                  <rect
                    x="0"
                    y="0"
                    width={cardWidth}
                    height="3"
                    rx="3"
                    fill={isOnline ? '#10b981' : dev.status === 'degraded' ? '#f59e0b' : '#f43f5e'}
                  />

                  {/* Device Icon Container */}
                  <g transform="translate(10, 14)">
                    <rect width="26" height="26" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <foreignObject x="5" y="5" width="16" height="16">
                      <div className="flex items-center justify-center w-full h-full">
                        {getDeviceIcon(dev.deviceType)}
                      </div>
                    </foreignObject>
                  </g>

                  {/* Device Name & IP */}
                  <text
                    x="42"
                    y="25"
                    fill="#f8fafc"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="truncate"
                  >
                    {dev.hostname.length > 13 ? `${dev.hostname.slice(0, 12)}…` : dev.hostname}
                  </text>

                  <text
                    x="42"
                    y="38"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {dev.ipAddress}
                  </text>

                  {/* Bottom Strip: VLAN & Latency / CIS badge */}
                  <g transform="translate(10, 47)">
                    {/* Status dot */}
                    <circle
                      cx="4"
                      cy="5"
                      r="3"
                      fill={isOnline ? '#10b981' : '#f43f5e'}
                      className={isOnline ? 'animate-pulse' : ''}
                    />

                    {/* VLAN Badge */}
                    <text
                      x="14"
                      y="8"
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      VLAN {dev.vlan || 1}
                    </text>

                    {/* RTT ms */}
                    <text
                      x="70"
                      y="8"
                      fill="#64748b"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      {dev.latencyMs}ms
                    </text>

                    {/* CIS Grade Badge (if evaluated) */}
                    {dev.compliance && (
                      <g transform="translate(105, -2)">
                        <rect
                          width="24"
                          height="13"
                          rx="2"
                          fill={dev.compliance.grade === 'A' ? '#064e3b' : '#7f1d1d'}
                          stroke={dev.compliance.grade === 'A' ? '#10b981' : '#f43f5e'}
                          strokeWidth="0.7"
                        />
                        <text
                          x="12"
                          y="9.5"
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          CIS {dev.compliance.grade}
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Mini Map (Radar Overview) */}
        <div className="absolute bottom-3 right-3 w-48 h-36 bg-slate-900/90 border border-slate-800 rounded-lg p-2 shadow-2xl backdrop-blur-sm pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Move size={11} className="text-cyan-400" />
              Minimap Radar
            </span>
            <span className="text-slate-500">{devices.length} nós</span>
          </div>

          <div className="relative w-full h-[98px] bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
            {/* Dots for all devices */}
            {devices.map(d => {
              const pos = nodePositions[d.id];
              if (!pos) return null;
              // Map 1100x750 to 180x95
              const miniX = (pos.x / 1100) * 170 + 5;
              const miniY = (pos.y / 750) * 88 + 5;

              return (
                <div
                  key={d.id}
                  className={`absolute w-1.5 h-1.5 rounded-full ${
                    selectedDeviceId === d.id ? 'bg-cyan-400 ring-2 ring-cyan-500' :
                    d.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ left: `${miniX}px`, top: `${miniY}px` }}
                />
              );
            })}

            {/* Current viewport frame rectangle */}
            <div
              className="absolute border border-cyan-400/80 bg-cyan-500/10 rounded-sm pointer-events-none"
              style={{
                left: `${Math.max(0, (-pan.x / (1100 * zoom)) * 170)}px`,
                top: `${Math.max(0, (-pan.y / (750 * zoom)) * 88)}px`,
                width: `${Math.min(170, (600 / (1100 * zoom)) * 170)}px`,
                height: `${Math.min(88, (450 / (750 * zoom)) * 88)}px`
              }}
            />
          </div>
        </div>

        {/* Floating Quick Node Inspector Sidebar */}
        {selectedDevice && (
          <div className="absolute top-3 left-3 w-80 bg-slate-900/95 border border-slate-800 rounded-lg p-4 shadow-2xl backdrop-blur-md text-xs font-mono space-y-3 z-10 animate-in fade-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {getDeviceIcon(selectedDevice.deviceType)}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{selectedDevice.hostname}</div>
                  <div className="text-[11px] text-cyan-400">{selectedDevice.ipAddress}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeviceId(null)}
                className="text-slate-500 hover:text-slate-300 p-0.5 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Hardware & Network Specs */}
            <div className="space-y-1.5 text-[11px] py-1 border-b border-slate-800/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo:</span>
                <span className="text-slate-200">{selectedDevice.deviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VLAN Segmento:</span>
                <span className="text-cyan-400 font-bold">VLAN {selectedDevice.vlan || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MAC / OUI:</span>
                <span className="text-slate-300 truncate max-w-[170px]" title={selectedDevice.macAddress}>
                  {selectedDevice.macAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fabricante:</span>
                <span className="text-slate-300 truncate max-w-[170px]">{selectedDevice.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Porta de Conexão:</span>
                <span className="text-emerald-400">{selectedDevice.switchPort || 'Direct Uplink'}</span>
              </div>
            </div>

            {/* Telemetry & Scores */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block uppercase">LATÊNCIA RTT</span>
                <span className="text-xs font-bold text-slate-200">{selectedDevice.latencyMs} ms</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block uppercase">PERDA DE PACOTES</span>
                <span className={`text-xs font-bold ${selectedDevice.packetLossPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedDevice.packetLossPercent}%
                </span>
              </div>

              {/* NIST CVSS Badge */}
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block uppercase">RISCO NIST</span>
                <span className="text-xs font-bold text-amber-400">
                  CVSS {selectedDevice.nistRiskScore || 0.0}
                </span>
              </div>

              {/* CIS Grade Badge */}
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 block uppercase">CIS BENCHMARK</span>
                <span className="text-xs font-bold text-cyan-400">
                  Nota {selectedDevice.compliance?.grade || 'A'} ({selectedDevice.compliance?.complianceScore || 100}%)
                </span>
              </div>
            </div>

            {/* Open Ports */}
            {selectedDevice.openPorts && selectedDevice.openPorts.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 block mb-1 uppercase">Portas Abertas Detetadas:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedDevice.openPorts.map(p => (
                    <span key={p} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-cyan-300">
                      Port {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Connected Neighbors */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 uppercase">Ligações Diretas no Grafo:</span>
              <div className="space-y-1">
                {connectionLinks
                  .filter(l => l.sourceId === selectedDevice.id || l.targetId === selectedDevice.id)
                  .map((l, i) => {
                    const peerId = l.sourceId === selectedDevice.id ? l.targetId : l.sourceId;
                    const peer = devices.find(d => d.id === peerId);
                    return (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800/80 text-[10px]">
                        <span className="text-slate-300">{peer?.hostname || peerId}</span>
                        <span className="text-cyan-400 font-bold">{l.speedMbps >= 1000 ? `${l.speedMbps / 1000} Gbps` : `${l.speedMbps} Mbps`}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Inspect Modal Trigger */}
            <button
              onClick={() => onOpenDeviceDetail(selectedDevice)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded font-bold text-xs transition-colors shadow-sm"
            >
              <span>Inspecionar Ficha do Ativo</span>
              <ExternalLink size={13} />
            </button>
          </div>
        )}

        {/* Canvas Instructions Bar */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
          <span>Arraste os nós para reorganizar · Roda do rato para zoom · Clique no nó para ver telemetria</span>
        </div>
      </div>

      {/* Legend & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
          <div>
            <div className="text-slate-200 font-bold">10GbE / Uplink Core</div>
            <div className="text-[10px] text-slate-400">Trunk SFP+ & Gateway Ingress</div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <div>
            <div className="text-slate-200 font-bold">1Gbps Cat6 Ethernet</div>
            <div className="text-[10px] text-slate-400">Cabo estruturado / Conexão física</div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          <div>
            <div className="text-slate-200 font-bold">Wi-Fi 6 / 802.11ax</div>
            <div className="text-[10px] text-slate-400">Access Points & Clientes Sem Fios</div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
          <div>
            <div className="text-slate-200 font-bold">Trunk 802.1Q VLAN</div>
            <div className="text-[10px] text-slate-400">Transporte multiplexado multi-VLAN</div>
          </div>
        </div>
      </div>
    </div>
  );
};
