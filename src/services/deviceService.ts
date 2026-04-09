import { supabase } from '../lib/supabase';
import type { Device } from '../types/dashboard';
import { mockFetch, mockDevices } from '../utils/dashboard';

interface MaintenanceLogData {
  maintenance_type: string;
  damage_level: string;
  malfunction_type: string;
  notes: string;
  parts_used?: string;
  cost?: number;
  duration_hours?: number;
  duration_minutes?: number;
  performed_by_name?: string;
}

interface MaintenanceLog {
  maintenance_id: string;
  maintenance_type: string;
  notes: string;
  damage_level: string;
  malfunction_type: string;
  performed_at: string;
  operator_name: string;
  duration_minutes?: number;
}

// Database response types to replace 'any'
interface DeviceFromDB {
  device_id: string;
  device_name: string;
  status: string;
  last_active: string | null;
  created_at: string;
  locations: {
    location_name: string;
    river_section: string;
  }[];
  sensors: { sensor_id: string; sensor_type: string }[];
}

interface MaintenanceLogFromDB {
  maintenance_id: string;
  maintenance_type: string;
  notes: string;
  damage_level: string;
  malfunction_type: string;
  performed_at: string;
  users: { full_name: string }[];
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
  const devicesWithAlerts = await Promise.all((data || []).map(async (device: DeviceFromDB) => {
    const { count } = await supabase!
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    return {
      device_id: device.device_id,
      device_name: device.device_name,
      status: device.status as 'active' | 'inactive' | 'maintenance',
      last_active: device.last_active,
      created_at: device.created_at,
      location_name: device.locations[0]?.location_name || 'Unknown',
      river_section: device.locations[0]?.river_section || 'Unknown',
      sensor_count: device.sensors?.length || 0,
      alert_count: count || 0,
      sensors: device.sensors || []
    };
  }));

  return devicesWithAlerts;
}

// Get device maintenance history
export async function getDeviceMaintenanceHistory(deviceId: string): Promise<MaintenanceLog[]> {
  if (!supabase) {
    console.log('Using mock maintenance history');
    return [
      {
        maintenance_id: 'd9c01ba2-cfc8-4883-b03b-6ff33fdb9c10',
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
      duration_minutes,
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

  return data?.map((log: MaintenanceLogFromDB) => ({
    maintenance_id: log.maintenance_id,
    maintenance_type: log.maintenance_type,
    notes: log.notes,
    damage_level: log.damage_level,
    malfunction_type: log.malfunction_type,
    performed_at: log.performed_at,
    operator_name: log.users[0]?.full_name || 'Unknown'
  })) || [];
}

// Log maintenance
export async function logMaintenance(
  deviceId: string, 
  userId: string, 
  data: MaintenanceLogData
): Promise<boolean> {
  console.log('=== logMaintenance START ===', { deviceId, userId, data });
  
  if (!supabase) {
    console.log('Mock: Logging maintenance', { deviceId, userId, data });
    return true;
  }

  // Check auth state
  const { data: authData } = await supabase.auth.getUser();
  console.log('Auth state:', { 
    authUserId: authData.user?.id, 
    paramUserId: userId,
    match: authData.user?.id === userId,
    jwtExists: !!authData.user
  });

  // Update device status to maintenance
  console.log('Step 1: Updating device status...');
  const { data: updateData, error: updateError, count } = await supabase
    .from('devices')
    .update({ status: 'maintenance', updated_at: new Date().toISOString() })
    .eq('device_id', deviceId)
    .select();

  console.log('Update result:', { updateData, updateError, count, rowsUpdated: updateData?.length });

  if (updateError) {
    console.error('Step 1 FAILED - Error updating device status:', updateError);
    return false;
  }
  
  if (!updateData || updateData.length === 0) {
    console.error('Step 1 FAILED - No rows were updated! RLS may be blocking.');
    return false;
  }
  
  console.log('Step 1 SUCCESS: Device status updated, rows affected:', updateData.length);
  
  // Verify device status was updated
  const { data: deviceCheck, error: deviceCheckError } = await supabase
    .from('devices')
    .select('device_id, status')
    .eq('device_id', deviceId)
    .single();
  console.log('Device status verification:', { 
    deviceCheck, 
    deviceCheckError, 
    actualStatus: deviceCheck?.status,
    expectedStatus: 'maintenance',
    statusMatch: deviceCheck?.status === 'maintenance'
  });

  // Calculate total minutes from hours + minutes
  const totalMinutes = ((data.duration_hours || 0) * 60) + (data.duration_minutes || 0);
  
  // Insert maintenance log using RPC function (bypasses RLS)
  console.log('Step 2: Calling create_maintenance_log RPC...');
  console.log('RPC params:', {
    p_device_id: deviceId,
    p_performed_by: userId,
    p_maintenance_type: data.maintenance_type,
    p_notes: data.notes,
    p_damage_level: data.damage_level,
    p_malfunction_type: data.malfunction_type || '',
    p_parts_used: data.parts_used || '',
    p_cost: data.cost || 0,
    p_duration_minutes: totalMinutes,
    duration_display: `${data.duration_hours || 0}h ${data.duration_minutes || 0}m`
  });
  
  const { data: logResult, error: logError } = await supabase
    .rpc('create_maintenance_log_v2', {  // Use v2 to avoid overload conflict
      p_device_id: deviceId,
      p_performed_by: userId,
      p_maintenance_type: data.maintenance_type,
      p_performed_by_name: data.performed_by_name,
      p_notes: data.notes || '',
      p_damage_level: data.damage_level || 'none',
      p_malfunction_type: data.malfunction_type || 'none',
      p_parts_used: data.parts_used || 'none',
      p_cost: data.cost || 0,
      p_duration_minutes: totalMinutes
    });

  console.log('RPC result:', { logResult, logError });

  if (logError || logResult === false || (typeof logResult === 'string' && logResult.startsWith('ERROR'))) {
    console.error('Step 2 FAILED - Error logging maintenance:', logError || logResult || 'Unknown error');
    if (logError) {
      console.error('Error code:', logError.code);
      console.error('Error message:', logError.message);
    }
    return false;
  }

  console.log('Step 2 SUCCESS: Maintenance logged');
  console.log('Input data was:', {
    parts_used: data.parts_used,
    cost: data.cost,
    duration_minutes: data.duration_minutes
  });
  
  // Verify the insert by querying recent logs
  console.log('Step 3: Verifying insert...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('maintenance_logs')
    .select('maintenance_id, device_id, performed_by, maintenance_type, damage_level, malfunction_type, notes, parts_used, cost, duration_minutes, performed_at')
    .eq('device_id', deviceId)
    .order('performed_at', { ascending: false })
    .limit(1);
  
  console.log('Verification result:', { verifyData, verifyError });
  if (verifyData && verifyData.length > 0) {
    console.log('✅ Maintenance log confirmed in database:', verifyData[0]);
  } else {
    console.log('❌ Maintenance log NOT found in database - insert may have failed silently');
  }
  
  console.log('=== logMaintenance END ===');
  return logResult === true || logResult === 'SUCCESS';
}

// Update device status
export async function updateDeviceStatus(deviceId: string, status: string): Promise<boolean> {
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
