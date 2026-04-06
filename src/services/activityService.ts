import { supabase } from '../lib/supabase';

interface ResolvedAlert {
  alert_id: number;
  alert_type: string;
  message: string;
  created_at: string;
  resolved_at: string;
  device_name: string;
  sensor_type: string;
  value?: number;
}

interface MaintenanceLog {
  maintenance_id: number;
  maintenance_type: string;
  notes: string;
  damage_level: string;
  malfunction_type: string;
  performed_at: string;
  device_name: string;
  device_id: number;
}

interface StatusChange {
  device_id: number;
  device_name: string;
  status: string;
  updated_at: string;
  location_name: string;
}

// Get my resolved alerts
export async function getMyResolvedAlerts(userId: number | string, hours: number = 24): Promise<ResolvedAlert[]> {
  if (!supabase) {
    console.log('Mock: getMyResolvedAlerts');
    return [];
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const userIdStr = String(userId);

  const { data, error } = await supabase
    .from('alerts')
    .select(`
      alert_id,
      alert_type,
      message,
      created_at,
      resolved_at,
      sensors!inner (
        sensor_type,
        devices!inner (
          device_name
        )
      ),
      sensor_readings (
        value
      )
    `)
    .eq('resolved_by', userIdStr)
    .gte('resolved_at', since)
    .order('resolved_at', { ascending: false });

  if (error) {
    console.error('Error fetching resolved alerts:', error);
    return [];
  }

  return data?.map((alert: any) => ({
    alert_id: alert.alert_id,
    alert_type: alert.alert_type,
    message: alert.message,
    created_at: alert.created_at,
    resolved_at: alert.resolved_at,
    device_name: alert.sensors?.devices?.device_name || 'Unknown',
    sensor_type: alert.sensors?.sensor_type || 'Unknown',
    value: alert.sensor_readings?.[0]?.value
  })) || [];
}

// Get my maintenance logs
export async function getMyMaintenanceLogs(userId: number | string, hours: number = 24): Promise<MaintenanceLog[]> {
  if (!supabase) {
    console.log('Mock: getMyMaintenanceLogs');
    return [];
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const userIdStr = String(userId);

  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      maintenance_id,
      maintenance_type,
      notes,
      damage_level,
      malfunction_type,
      performed_at,
      devices!inner (
        device_id,
        device_name
      )
    `)
    .eq('performed_by', userIdStr)
    .gte('performed_at', since)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance logs:', error);
    return [];
  }

  return data?.map((log: any) => ({
    maintenance_id: log.maintenance_id,
    maintenance_type: log.maintenance_type,
    notes: log.notes,
    damage_level: log.damage_level,
    malfunction_type: log.malfunction_type,
    performed_at: log.performed_at,
    device_name: log.devices?.device_name || 'Unknown',
    device_id: log.devices?.device_id || 0
  })) || [];
}

// Get device status changes
export async function getDeviceStatusChanges(hours: number = 24): Promise<StatusChange[]> {
  if (!supabase) {
    console.log('Mock: getDeviceStatusChanges');
    return [];
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('devices')
    .select(`
      device_id,
      device_name,
      status,
      updated_at,
      locations (
        location_name
      )
    `)
    .gte('updated_at', since)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching status changes:', error);
    return [];
  }

  return data?.map((device: any) => ({
    device_id: device.device_id,
    device_name: device.device_name,
    status: device.status,
    updated_at: device.updated_at,
    location_name: device.locations?.location_name || 'Unknown'
  })) || [];
}
