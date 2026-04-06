// Utility functions for dashboard

import type { Device, DeviceHealth, SensorReading } from '../types/dashboard';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateOnly(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getDeviceHealthStatus(device: Device, readings24h: number, activeAlerts: number, lastMaintenance?: { damage_level?: string } | null): DeviceHealth {
  if (activeAlerts > 0) return { status: 'critical', label: 'Malfunctioning' };
  if (readings24h === 0) return { status: 'offline', label: 'No Data' };
  if (lastMaintenance?.damage_level === 'high') return { status: 'damaged', label: 'Damaged' };
  if (lastMaintenance?.damage_level === 'medium') return { status: 'warning', label: 'Needs Repair' };
  return { status: 'healthy', label: 'Healthy' };
}

export function getStatusColor(status: string): { bg: string; color: string } {
  const colors: Record<string, { bg: string; color: string }> = {
    normal: { bg: '#dcfce7', color: '#16a34a' },
    warning: { bg: '#fef3c7', color: '#d97706' },
    critical: { bg: '#fee2e2', color: '#dc2626' },
    healthy: { bg: '#dcfce7', color: '#16a34a' },
    damaged: { bg: '#fee2e2', color: '#dc2626' },
    offline: { bg: '#f0f5fb', color: '#8aa0bc' },
    active: { bg: '#dcfce7', color: '#16a34a' },
    inactive: { bg: '#f0f5fb', color: '#8aa0bc' },
    maintenance: { bg: '#fef3c7', color: '#d97706' }
  };
  return colors[status] || { bg: '#f0f5fb', color: '#8aa0bc' };
}

export function getRiverSectionClass(section: string): { bg: string; color: string } {
  const sections: Record<string, { bg: string; color: string }> = {
    upstream: { bg: '#dbeafe', color: '#1e40af' },
    midstream: { bg: '#fef3c7', color: '#92400e' },
    downstream: { bg: '#fee2e2', color: '#991b1b' }
  };
  return sections[section.toLowerCase()] || { bg: '#f0f5fb', color: '#4a6080' };
}

export function getAlertIcon(type: string): string {
  const icons: Record<string, string> = {
    critical: '!',
    high: '⚠',
    low: '•'
  };
  return icons[type] || '•';
}

export function capitalizeWords(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function mockFetch<T>(data: T, delay = 500): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
}

// Mock data for development
export const mockAlerts = [
  {
    alert_id: 1,
    alert_type: 'critical' as const,
    message: 'Water level exceeds safe threshold',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'active' as const,
    device_name: 'Sensor Station A1',
    device_id: 1,
    location_name: 'Upstream',
    river_section: 'upstream',
    sensor_type: 'water_level',
    value: 8.5
  },
  {
    alert_id: 2,
    alert_type: 'high' as const,
    message: 'Temperature reading abnormal',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    status: 'active' as const,
    device_name: 'Sensor Station B2',
    device_id: 2,
    location_name: 'Midstream',
    river_section: 'midstream',
    sensor_type: 'temperature',
    value: 32.1
  }
];

export const mockDevices = [
  {
    device_id: 1,
    device_name: 'Sensor Station A1',
    status: 'active' as const,
    last_active: new Date(Date.now() - 300000).toISOString(),
    created_at: '2024-01-15T00:00:00Z',
    location_name: 'Upstream',
    river_section: 'upstream',
    sensor_count: 4,
    alert_count: 1
  },
  {
    device_id: 2,
    device_name: 'Sensor Station B2',
    status: 'maintenance' as const,
    last_active: new Date(Date.now() - 86400000).toISOString(),
    created_at: '2024-01-20T00:00:00Z',
    location_name: 'Midstream',
    river_section: 'midstream',
    sensor_count: 3,
    alert_count: 0
  },
  {
    device_id: 3,
    device_name: 'Sensor Station C3',
    status: 'inactive' as const,
    last_active: null,
    created_at: '2024-02-01T00:00:00Z',
    location_name: 'Downstream',
    river_section: 'downstream',
    sensor_count: 5,
    alert_count: 0
  }
];

export const mockReadings = [
  {
    reading_id: 1,
    value: 7.2,
    recorded_at: new Date(Date.now() - 1800000).toISOString(),
    sensor_type: 'ph_level',
    unit: 'pH',
    device_name: 'Sensor Station A1',
    location_name: 'upstream'
  },
  {
    reading_id: 2,
    value: 8.5,
    recorded_at: new Date(Date.now() - 3600000).toISOString(),
    sensor_type: 'water_level',
    unit: 'm',
    device_name: 'Sensor Station A1',
    location_name: 'upstream'
  },
  {
    reading_id: 3,
    value: 24.5,
    recorded_at: new Date(Date.now() - 5400000).toISOString(),
    sensor_type: 'temperature',
    unit: '°C',
    device_name: 'Sensor Station B2',
    location_name: 'midstream'
  }
];

export const mockStats = {
  devices: { total: 12, active: 8, inactive: 2, maintenance: 2 },
  active_alerts: 2,
  critical_alerts: 1,
  today_readings: 156,
  needs_attention: 1
};

export const mockMyStats = {
  alerts_today: 3,
  alerts_total: 45,
  maintenance_today: 1,
  maintenance_total: 12
};

export const mockActivity = [
  {
    action_type: 'alert_resolved' as const,
    reference_id: 1,
    details: 'Water level alert acknowledged',
    action_time: new Date(Date.now() - 3600000).toISOString(),
    device_name: 'Sensor Station A1'
  },
  {
    action_type: 'maintenance' as const,
    reference_id: 2,
    details: 'Sensor calibration completed',
    action_time: new Date(Date.now() - 86400000).toISOString(),
    device_name: 'Sensor Station B2',
    maintenance_type: 'calibration'
  }
];
