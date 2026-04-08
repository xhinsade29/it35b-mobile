// Types for Operator Dashboard

export interface Alert {
  alert_id: number;
  alert_type: 'critical' | 'high' | 'low';
  message: string;
  created_at: string;
  status: 'active' | 'resolved';
  device_name: string;
  device_id: number;
  location_name: string;
  river_section: string;
  sensor_type: string;
  value?: number;
}

export interface Device {
  device_id: string;
  device_name: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_active: string | null;
  created_at: string;
  location_name: string;
  river_section: string;
  sensor_count: number;
  alert_count: number;
  health?: DeviceHealth;
}

export interface DeviceHealth {
  status: 'healthy' | 'critical' | 'offline' | 'damaged' | 'warning';
  label: string;
}

export interface SensorReading {
  reading_id: number;
  value: number;
  recorded_at: string;
  sensor_type: string;
  unit: string;
  device_name: string;
  location_name: string;
}

export interface ActivityItem {
  action_type: 'alert_resolved' | 'maintenance';
  reference_id: number;
  details: string;
  action_time: string;
  device_name: string;
  maintenance_type?: string;
}

export interface OperationalStats {
  devices: {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
  };
  active_alerts: number;
  critical_alerts: number;
  today_readings: number;
  needs_attention: number;
}

export interface OperatorStats {
  alerts_today: number;
  alerts_total: number;
  maintenance_today: number;
  maintenance_total: number;
}

export interface MaintenanceRecord {
  maintenance_id: string;
  device_id: string;
  maintenance_type: string;
  notes: string;
  performed_at: string;
  performed_by: number;
  operator_name: string;
  damage_level?: string;
}
