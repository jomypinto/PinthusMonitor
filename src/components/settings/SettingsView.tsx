import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Terminal, 
  Database, 
  Shield, 
  Bell, 
  Key, 
  Check, 
  Radio, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { BackendConfig } from '../../types/api';
import { LocalServerMetrics } from '../../types/network';
import { nexusApi } from '../../services/api';

interface SettingsViewProps {
  backendConfig: BackendConfig;
  serverMetrics: LocalServerMetrics;
  onUpdateBackendConfig: (config: Partial<BackendConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  backendConfig,
  serverMetrics,
  onUpdateBackendConfig
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'backend' | 'snmp' | 'alerts' | 'docker'>('server');
  
  // Local server form state
  const [pollInterval, setPollInterval] = useState(30);
  const [icmpTimeout, setIcmpTimeout] = useState(1500);
  const [probeRetries, setProbeRetries] = useState(3);
  const [primaryIface, setPrimaryIface] = useState('eth0');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Backend form state
  const [apiUrl, setApiUrl] = useState(backendConfig.baseUrl);
  const [useLiveBackend, setUseLiveBackend] = useState(backendConfig.useLiveBackend);
  const [testResult, setTestResult] = useState<{ testing: boolean; message?: string; success?: boolean } | null>(null);

  // SNMP form state
  const [snmpCommunity, setSnmpCommunity] = useState('public_read_lan');
  const [snmpVersion, setSnmpVersion] = useState<'v2c' | 'v3'>('v2c');

  // Copy docker compose helper
  const [copiedDocker, setCopiedDocker] = useState(false);

  const handleSaveLocalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleTestBackend = async () => {
    setTestResult({ testing: true });
    const res = await nexusApi.testBackendConnection(apiUrl);
    setTestResult({
      testing: false,
      success: res.connected,
      message: res.message
    });
  };

  const handleSaveBackendConfig = () => {
    onUpdateBackendConfig({
      baseUrl: apiUrl,
      useLiveBackend
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const dockerComposeCode = `version: '3.8'

services:
  # 1. PostgreSQL 16 Database
  nexus-db:
    image: postgres:16-alpine
    container_name: nexus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: nexus_network
      POSTGRES_USER: nexus_admin
      POSTGRES_PASSWORD: \${NEXUS_DB_PASSWORD:-changeme_lan_secret}
    volumes:
      - nexus_pgdata:/var/lib/postgresql/data
    networks:
      - nexus-internal

  # 2. Flask REST API Core
  nexus-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nexus-api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://nexus_admin:\${NEXUS_DB_PASSWORD:-changeme_lan_secret}@nexus-db:5432/nexus_network
      FLASK_ENV: production
      PORT: 5000
    depends_on:
      - nexus-db
    ports:
      - "5000:5000"
    networks:
      - nexus-internal
      - nexus-lan

  # 3. Python Scapy / psutil Network Collector Prober
  # NOTE: Requires host networking & raw packet capabilities to execute ARP & ICMP sweeps
  nexus-collector:
    build:
      context: ./collector
      dockerfile: Dockerfile
    container_name: nexus-collector-daemon
    restart: unless-stopped
    network_mode: "host"
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      API_ENDPOINT: http://127.0.0.1:5000/api/v1
      PROBE_INTERFACE: eth0
      DEFAULT_POLL_INTERVAL: 30
    depends_on:
      - nexus-backend

  # 4. React / NGINX Frontend
  nexus-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: nexus-web-console
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - nexus-lan

volumes:
  nexus_pgdata:
    driver: local

networks:
  nexus-internal:
    driver: bridge
  nexus-lan:
    driver: bridge`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dockerComposeCode);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              On-Premises Configuration & Integration
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              System Administration, Backend REST API & Deployment Blueprint
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune local prober parameters, configure the Flask REST collector bridge, manage SNMP credentials, and inspect Docker Compose architecture.
            </p>
          </div>

          {isSavedNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 font-medium">
              <CheckCircle2 size={15} />
              <span>Settings saved</span>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('server')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'server' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Collector Daemon
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'backend' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flask API Bridge
          </button>
          <button
            onClick={() => setActiveTab('snmp')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'snmp' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SNMP Credentials
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'docker' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Docker Compose Spec
          </button>
        </div>
      </div>

      {/* TAB 1: LOCAL COLLECTOR SETTINGS */}
      {activeTab === 'server' && (
        <form onSubmit={handleSaveLocalSettings} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Local Prober & Scapy Sweep Parameters</h3>
            <p className="text-xs text-slate-400 mt-0.5">Parameters applied to background thread daemon executing ARP & ICMP probes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Primary Capture Interface</label>
              <select
                value={primaryIface}
                onChange={(e) => setPrimaryIface(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {serverMetrics.interfaces.map(i => (
                  <option key={i.name} value={i.name.split(' ')[0]}>{i.name} ({i.ipAddress})</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Socket interface used for transmitting low-level ARP who-has packets.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Polling Cadence (Seconds)</label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={10}>10 Seconds (High Resolution / LAB)</option>
                <option value={30}>30 Seconds (Recommended Production Baseline)</option>
                <option value={60}>60 Seconds (Conservation Mode)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Frequency of ICMP echo probes dispatched to cataloged hosts.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">ICMP Echo Response Timeout (ms)</label>
              <input
                type="number"
                min="200"
                max="5000"
                step="100"
                value={icmpTimeout}
                onChange={(e) => setIcmpTimeout(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Maximum RTT wait before packet is marked as dropped.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Consecutive Drop Tolerance</label>
              <input
                type="number"
                min="1"
                max="10"
                value={probeRetries}
                onChange={(e) => setProbeRetries(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Number of missed probes before triggering a &apos;Host Down&apos; alert.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors"
            >
              Apply Collector Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FLASK REST API BRIDGE CONFIG */}
      {activeTab === 'backend' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Flask REST Backend Collector Connection</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect this frontend console to the live Python Flask REST service running on the local host.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Operational Mode Toggle */}
            <div className="p-4 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Operating Mode</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {useLiveBackend 
                    ? 'Active: Polling live Flask REST collector on your local network' 
                    : 'Simulation: Using realistic standalone simulated LAN dataset (Phase 1 prototype)'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseLiveBackend(false)}
                  className={`px-3 py-1.5 rounded font-medium transition-colors ${
                    !useLiveBackend 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Simulated Demo
                </button>
                <button
                  type="button"
                  onClick={() => setUseLiveBackend(true)}
                  className={`px-3 py-1.5 rounded font-medium transition-colors ${
                    useLiveBackend 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Flask Backend
                </button>
              </div>
            </div>

            {/* REST Endpoint URL */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Flask REST API Base Endpoint</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://127.0.0.1:5000/api/v1"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleTestBackend}
                  disabled={testResult?.testing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors"
                >
                  <RefreshCw size={14} className={testResult?.testing ? 'animate-spin' : ''} />
                  <span>Test Connection</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default local socket: http://127.0.0.1:5000/api/v1</p>
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div className={`p-3 rounded border text-xs font-mono ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {testResult.message}
              </div>
            )}

            {/* Expected Flask Endpoints Checklist */}
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800/80 space-y-2 font-mono text-[11px]">
              <div className="text-slate-300 font-semibold text-xs">Mapped Backend Routes (REST API Contract):</div>
              <div className="text-slate-400">GET  /api/v1/health → Daemon status & ping</div>
              <div className="text-slate-400">GET  /api/v1/devices → Query inventory & status</div>
              <div className="text-slate-400">GET  /api/v1/system/metrics → psutil CPU/RAM/Disk stats</div>
              <div className="text-slate-400">POST /api/v1/discovery/scan → Trigger Scapy ARP sweep</div>
              <div className="text-slate-400">POST /api/v1/devices/:id/ping → Execute ICMP echo probe</div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveBackendConfig}
              className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors"
            >
              Save Backend Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SNMP CREDENTIALS */}
      {activeTab === 'snmp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">SNMP v2c / v3 Management Profiles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Read credentials used to retrieve switch port MIBs and device sysDescr</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">SNMP Protocol Version</label>
                <select
                  value={snmpVersion}
                  onChange={(e) => setSnmpVersion(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="v2c">SNMP v2c (Community String)</option>
                  <option value="v3">SNMP v3 (USM SHA/AES-128 Encryption)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Read Community String</label>
                <input
                  type="password"
                  value={snmpCommunity}
                  onChange={(e) => setSnmpCommunity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Credentials are kept strictly in local memory and sent to the Flask collector via Bearer authorization.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setIsSavedNotice(true);
                setTimeout(() => setIsSavedNotice(false), 3000);
              }}
              className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors"
            >
              Update SNMP Profile
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DOCKER COMPOSE SPEC */}
      {activeTab === 'docker' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Production Docker Compose Blueprint</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete multi-container setup for on-premises deployment on Linux servers
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
            >
              {copiedDocker ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedDocker ? 'Copied to Clipboard' : 'Copy docker-compose.yml'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              {dockerComposeCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
