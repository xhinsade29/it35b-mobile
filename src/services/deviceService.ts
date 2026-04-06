import { supabase } from '../lib/supabase';
import type { Device } from '../types/dashboard';
import { mockFetch, mockDevices } from '../utils/dashboard';

interface MaintenanceLogData {
  maintenance_type: string;
  damage_level: string;
  malfunction_type: string;
  notes: string;
}

interface MaintenanceLog {
  maintenance_id: number;
  maintenance_type: string;
  notes: string;
  damage_level: string;
  malfunction_type: string;
  performed_at: string;
  operator_name: string;
}

// Get devices with status
export async function getDevicesWithStatus(): Promise<Device[]> {
  if (!supabase) {
    console.log('Using mock devices data');
    return mockFetch(mockDevices);
  }

  console.log('Fetching devices from Supabase...');

  // Simpler query without nested alerts join
  const { data, error } = await supabase
    .from('devices')
    .select(`
      device_id,
      device_name,
      status,
      last_active,
      created_at,
      locations (
        location_name,
        river_section
      ),
      sensors (
        sensor_id,
        sensor_type
      )
    `)
    .order('device_name');

  if (error) {
    console.error('Error fetching devices:', error);
    return [];
  }

  console.log('Devices fetched:', data?.length || 0);

  // Get alert counts separately
  const devicesWithAlerts = await Promise.all((data || []).map(async (device: any) => {
    const { count } = await supabase!
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    return {
      device_id: device.device_id,
      device_name: device.device_name,
      status: device.status,
      last_active: device.last_active,
      created_at: device.created_at,
      location_name: device.locations?.location_name || 'Unknown',
      river_section: device.locations?.river_section || 'Unknown',
      sensor_count: device.sensors?.length || 0,
      alert_count: count || 0,
      sensors: device.sensors || []
    };
  }));

  return devicesWithAlerts;
}

// Get device maintenance history
export async function getDeviceMaintenanceHistory(deviceId: number): Promise<MaintenanceLog[]> {
  if (!supabase) {
    console.log('Using mock maintenance history');
    return [
      {
        maintenance_id: 1,
        maintenance_type: 'calibration',
        notes: 'Monthly calibration performed',
        damage_level: 'none',
        malfunction_type: '',
        performed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        operator_name: 'Operator'
      }
    ];
  }

  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      maintenance_id,
      maintenance_type,
      notes,
      damage_level,
      malfunction_type,
      performed_at,
      users!inner (
        full_name
      )
    `)
    .eq('device_id', deviceId)
    .order('performed_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching maintenance history:', error);
    return [];
  }

  return data?.map((log: any) => ({
    maintenance_id: log.maintenance_id,
    maintenance_type: log.maintenance_type,
    notes: log.notes,
    damage_level: log.damage_level,
    malfunction_type: log.malfunction_type,
    performed_at: log.performed_at,
    operator_name: log.users?.full_name || 'Unknown'
  })) || [];
}

// Log maintenance
export async function logMaintenance(
  deviceId: number, 
  userId: number | string, 
  data: MaintenanceLogData
): Promise<boolean> {
  if (!supabase) {
    console.log('Mock: Logging maintenance', { deviceId, userId, data });
    return true;
  }

  const userIdStr = String(userId);

  // Update device status to maintenance
  const { error: updateError } = await supabase
    .from('devices')
    .update({ status: 'maintenance' })
    .eq('device_id', deviceId);

  if (updateError) {
    console.error('Error updating device status:', updateError);
    return false;
  }

  // Insert maintenance log
  const { error } = await supabase
    .from('maintenance_logs')
    .insert({
      device_id: deviceId,
      performed_by: userIdStr,
      maintenance_type: data.maintenance_type,
      notes: data.notes,
      damage_level: data.damage_level,
      malfunction_type: data.malfunction_type,
      performed_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error logging maintenance:', error);
    return false;
  }

  return true;
}

// Update device status
export async function updateDeviceStatus(deviceId: number, status: string): Promise<boolean> {
  if (!supabase) {
    console.log('Mock: Updating device status', { deviceId, status });
    return true;
  }

  const { error } = await supabase
    .from('devices')
    .update({ status })
    .eq('device_id', deviceId);

  if (error) {
    console.error('Error updating device status:', error);
    return false;
  }

  return true;
}
