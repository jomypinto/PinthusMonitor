import { NetworkDevice, LocalServerMetrics, NetworkEvent, SubnetScanRange, DiscoveryScanJob } from './network';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  source: 'mock' | 'live_flask_api';
}

export interface DeviceQueryParams {
  search?: string;
  status?: string;
  type?: string;
  subnet?: string;
  sortBy?: keyof NetworkDevice;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface StartScanPayload {
  cidr: string;
  probeType: 'ARP+ICMP' | 'SYN_SCAN' | 'ICMP_ONLY';
  rateLimitPps: number;
  timeoutMs: number;
}

export interface BackendConfig {
  baseUrl: string;
  useLiveBackend: boolean;
  collectorPollIntervalMs: number;
  status: 'connected' | 'disconnected' | 'testing';
  lastPing?: string;
}
