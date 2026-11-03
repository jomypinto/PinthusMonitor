import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ServerStatusBar } from './components/layout/ServerStatusBar';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { NetworkDiscovery } from './components/discovery/NetworkDiscovery';
import { AssetInventory } from './components/inventory/AssetInventory';
import { NetworkMonitoring } from './components/monitoring/NetworkMonitoring';
import { NetworkConnections } from './components/connections/NetworkConnections';
import { TrafficAnalysis } from './components/traffic/TrafficAnalysis';
import { EventsAndAlerts } from './components/alerts/EventsAndAlerts';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { DeviceDetailModal } from './components/inventory/DeviceDetailModal';

import { 
  NetworkDevice, 
  LocalServerMetrics, 
  NetworkEvent, 
  SubnetScanRange, 
  TrafficTalker, 
  ProtocolStat, 
  ConnectionLink 
} from './types/network';
import { BackendConfig } from './types/api';
import { nexusApi } from './services/api';
import { INITIAL_SERVER_METRICS } from './services/mockData';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('Overview');
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [serverMetrics, setServerMetrics] = useState<LocalServerMetrics>(INITIAL_SERVER_METRICS);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [subnets, setSubnets] = useState<SubnetScanRange[]>([]);
  const [talkers, setTalkers] = useState<TrafficTalker[]>([]);
  const [protocols, setProtocols] = useState<ProtocolStat[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [connectionLinks, setConnectionLinks] = useState<ConnectionLink[]>([]);
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(nexusApi.getConfig());
  
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial Data Fetch
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [devRes, metRes, evtRes, subRes, trafRes, linkRes] = await Promise.all([
        nexusApi.getDevices(),
        nexusApi.getServerMetrics(),
        nexusApi.getEvents(),
        nexusApi.getSubnetRanges(),
        nexusApi.getTrafficStats(),
        nexusApi.getConnectionLinks()
      ]);

      setDevices(devRes.data);
      setServerMetrics(metRes.data);
      setEvents(evtRes.data);
      setSubnets(subRes.data);
      setTalkers(trafRes.talkers);
      setProtocols(trafRes.protocols);
      if (trafRes.timeSeries && trafRes.timeSeries.length > 0) {
        setTimeSeriesData(trafRes.timeSeries);
      }
      setConnectionLinks(linkRes);
    } catch (err) {
      console.error('Error fetching telemetry data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Polling interval for live dial jitter
    const interval = setInterval(async () => {
      try {
        const metRes = await nexusApi.getServerMetrics();
        setServerMetrics(metRes.data);
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleOpenDeviceDetail = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setIsDeviceModalOpen(true);
  };

  const handleDeviceUpdated = (updated: NetworkDevice) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelectedDevice(updated);
  };

  const handleUpdateBackendConfig = (newConfig: Partial<BackendConfig>) => {
    const updated = nexusApi.updateConfig(newConfig);
    setBackendConfig(updated);
    loadData();
  };

  const unacknowledgedAlertsCount = events.filter(e => !e.acknowledged).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Sidebar: 9 Navigation Sections */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(section) => setCurrentSection(section)}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        totalDevicesCount={devices.length}
        serverMetrics={serverMetrics}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          backendConfig={backendConfig}
          onRefreshAll={loadData}
          onOpenQuickScan={() => setCurrentSection('Network Discovery')}
          onNavigateSettings={() => setCurrentSection('Settings')}
          isRefreshing={isRefreshing}
        />

        {/* Server & Environment Status Strip */}
        <ServerStatusBar
          metrics={serverMetrics}
          backendConfig={backendConfig}
          onOpenSettings={() => setCurrentSection('Settings')}
        />

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto pb-10">
            {currentSection === 'Overview' && (
              <OverviewDashboard
                devices={devices}
                serverMetrics={serverMetrics}
                events={events}
                timeSeriesData={timeSeriesData}
                onNavigate={(sec) => setCurrentSection(sec)}
                onOpenDeviceDetail={handleOpenDeviceDetail}
                onOpenQuickScan={() => setCurrentSection('Network Discovery')}
              />
            )}

            {currentSection === 'Network Discovery' && (
              <NetworkDiscovery
                subnets={subnets}
                devices={devices}
                onRefreshSubnets={loadData}
                onRefreshDevices={loadData}
                onOpenDeviceDetail={handleOpenDeviceDetail}
              />
            )}

            {currentSection === 'Asset Inventory' && (
              <AssetInventory
                devices={devices}
                onOpenDeviceDetail={handleOpenDeviceDetail}
                onRefreshDevices={loadData}
              />
            )}

            {currentSection === 'Network Monitoring' && (
              <NetworkMonitoring
                serverMetrics={serverMetrics}
                devices={devices}
                timeSeriesData={timeSeriesData}
                onOpenDeviceDetail={handleOpenDeviceDetail}
              />
            )}

            {currentSection === 'Network Connections' && (
              <NetworkConnections
                devices={devices}
                connectionLinks={connectionLinks}
                onOpenDeviceDetail={handleOpenDeviceDetail}
              />
            )}

            {currentSection === 'Traffic Analysis' && (
              <TrafficAnalysis
                talkers={talkers}
                protocols={protocols}
                devices={devices}
                timeSeriesData={timeSeriesData}
                onOpenDeviceDetail={handleOpenDeviceDetail}
              />
            )}

            {currentSection === 'Events and Alerts' && (
              <EventsAndAlerts
                events={events}
                devices={devices}
                onRefreshEvents={loadData}
                onOpenDeviceDetail={handleOpenDeviceDetail}
              />
            )}

            {currentSection === 'Reports' && (
              <ReportsView
                devices={devices}
                subnets={subnets}
                events={events}
                serverMetrics={serverMetrics}
              />
            )}

            {currentSection === 'Settings' && (
              <SettingsView
                backendConfig={backendConfig}
                serverMetrics={serverMetrics}
                onUpdateBackendConfig={handleUpdateBackendConfig}
              />
            )}
          </div>
        </main>
      </div>

      {/* Device Detail Inspection Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onDeviceUpdated={handleDeviceUpdated}
      />
    </div>
  );
}
