import { supabase } from '../lib/supabase';
import type { Alert, Device, SensorReading, ActivityItem, OperationalStats, OperatorStats } from '../types/dashboard';
import { 
  mockAlerts, 
  mockDevices, 
  mockReadings, 
  mockStats, 
  mockMyStats, 
  mockActivity,
  mockFetch 
} from '../utils/dashboard';

// Fetch active alerts with device and location info
export async function getActiveAlerts(): Promise<Alert[]> {
  if (!supabase) {
    console.log('Using mock alerts data');
    return mockFetch(mockAlerts);
  }
  
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      alert_id,
      alert_type,
      message,
      created_at,
      status,
      sensors!inner (
        sensor_id,
        sensor_type,
        devices!inner (
          device_id,
          device_name,
          locations (
            location_name,
            river_section
          )
        )
      ),
      sensor_readings (
        value
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }

  return data?.map((alert: any) => ({
    alert_id: alert.alert_id,
    alert_type: alert.alert_type,
    message: alert.message,
    created_at: alert.created_at,
    status: alert.status,
    device_name: alert.sensors?.devices?.device_name || 'Unknown',
    device_id: alert.sensors?.devices?.device_id || 0,
    location_name: alert.sensors?.devices?.locations?.location_name || 'Unknown',
    river_section: alert.sensors?.devices?.locations?.river_section || 'Unknown',
    sensor_type: alert.sensors?.sensor_type || 'Unknown',
    value: alert.sensor_readings?.[0]?.value
  })) || [];
}

// Acknowledge a single alert
export async function acknowledgeAlert(alertId: number, userId: number): Promise<boolean> {
  if (!supabase) {
    console.log('Mock: Acknowledging alert', alertId);
    return true;
  }
  
  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString()
    })
    .eq('alert_id', alertId);

  if (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }

  return true;
}

// Acknowledge all active alerts
export async function acknowledgeAllAlerts(userId: number): Promise<number> {
  if (!supabase) {
    console.log('Mock: Acknowledging all alerts');
    return 5; // Mock count
  }
  
  const { data: alerts, error: fetchError } = await supabase
    .from('alerts')
    .select('alert_id')
    .eq('status', 'active');

  if (fetchError || !alerts) {
    console.error('Error fetching alerts to acknowledge:', fetchError);
    return 0;
  }

  const alertIds = alerts.map((a: any) => a.alert_id);
  
  if (alertIds.length === 0) return 0;

  const { error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString()
    })
    .in('alert_id', alertIds);

  if (error) {
    console.error('Error acknowledging all alerts:', error);
    return 0;
  }

  return alertIds.length;
}

// Fetch devices with their status and sensor counts
export async function getDevicesWithStatus(): Promise<Device[]> {
  if (!supabase) {
    console.log('Using mock devices data');
    return mockFetch(mockDevices);
  }
  
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
        sensor_id
      ),
      alerts:sensors!inner (
        alerts!inner (
          alert_id
        )
      )
    `)
    .order('device_name');

  if (error) {
    console.error('Error fetching devices:', error);
    return [];
  }

  return data?.map((device: any) => {
    const alertCount = device.alerts?.reduce((acc: number, sensor: any) => {
      return acc + (sensor.alerts?.length || 0);
    }, 0) || 0;

    return {
      device_id: device.device_id,
      device_name: device.device_name,
      status: device.status,
      last_active: device.last_active,
      created_at: device.created_at,
      location_name: device.locations?.location_name || 'Unknown',
      river_section: device.locations?.river_section || 'Unknown',
      sensor_count: device.sensors?.length || 0,
      alert_count: alertCount
    };
  }) || [];
}

// Fetch recent sensor readings
export async function getRecentReadings(hours: number = 24): Promise<SensorReading[]> {
  if (!supabase) {
    console.log('Using mock readings data');
    return mockFetch(mockReadings);
  }
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('sensor_readings')
    .select(`
      reading_id,
      value,
      recorded_at,
      sensors!inner (
        sensor_type,
        unit,
        devices!inner (
          device_name,
          locations (
            location_name
          )
        )
      )
    `)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching readings:', error);
    return [];
  }

  return data?.map((reading: any) => ({
    reading_id: reading.reading_id,
    value: reading.value,
    recorded_at: reading.recorded_at,
    sensor_type: reading.sensors?.sensor_type || 'Unknown',
    unit: reading.sensors?.unit || '',
    device_name: reading.sensors?.devices?.device_name || 'Unknown',
    location_name: reading.sensors?.devices?.locations?.location_name || 'Unknown'
  })) || [];
}

// Fetch operational statistics
export async function getOperationalStats(): Promise<OperationalStats> {
  if (!supabase) {
    console.log('Using mock stats data');
    return mockFetch(mockStats);
  }
  
  // Device counts
  const { data: deviceStats, error: deviceError } = await supabase
    .from('devices')
    .select('status');

  if (deviceError) {
    console.error('Error fetching device stats:', deviceError);
  }

  const devices = {
    total: deviceStats?.length || 0,
    active: deviceStats?.filter((d: any) => d.status === 'active').length || 0,
    inactive: deviceStats?.filter((d: any) => d.status === 'inactive').length || 0,
    maintenance: deviceStats?.filter((d: any) => d.status === 'maintenance').length || 0
  };

  // Active alerts count
  const { count: activeAlerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (alertsError) {
    console.error('Error fetching alerts count:', alertsError);
  }

  // Critical alerts count
  const { count: criticalAlerts, error: criticalError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('alert_type', 'critical');

  if (criticalError) {
    console.error('Error fetching critical alerts count:', criticalError);
  }

  // Today's readings count
  const today = new Date().toISOString().split('T')[0];
  const { count: todayReadings, error: readingsError } = await supabase
    .from('sensor_readings')
    .select('*', { count: 'exact', head: true })
    .gte('recorded_at', today);

  if (readingsError) {
    console.error('Error fetching readings count:', readingsError);
  }

  // Devices needing attention (inactive > 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: needsAttention, error: attentionError } = await supabase
    .from('devices')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or(`last_active.lt.${yesterday},last_active.is.null`);

  if (attentionError) {
    console.error('Error fetching attention count:', attentionError);
  }

  return {
    devices,
    active_alerts: activeAlerts || 0,
    critical_alerts: criticalAlerts || 0,
    today_readings: todayReadings || 0,
    needs_attention: needsAttention || 0
  };
}

// Fetch operator's personal stats
export async function getOperatorStats(userId: number): Promise<OperatorStats> {
  if (!supabase) {
    console.log('Using mock operator stats data');
    return mockFetch(mockMyStats);
  }
  
  // Alerts resolved today
  const today = new Date().toISOString().split('T')[0];
  const { count: alertsToday, error: alertsTodayError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('resolved_by', userId)
    .gte('resolved_at', today);

  if (alertsTodayError) {
    console.error('Error fetching alerts today:', alertsTodayError);
  }

  // Total alerts resolved
  const { count: alertsTotal, error: alertsTotalError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('resolved_by', userId);

  if (alertsTotalError) {
    console.error('Error fetching total alerts:', alertsTotalError);
  }

  // Maintenance today
  const { count: maintenanceToday, error: maintTodayError } = await supabase
    .from('maintenance_logs')
    .select('*', { count: 'exact', head: true })
    .eq('performed_by', userId)
    .gte('performed_at', today);

  if (maintTodayError) {
    console.error('Error fetching maintenance today:', maintTodayError);
  }

  // Total maintenance
  const { count: maintenanceTotal, error: maintTotalError } = await supabase
    .from('maintenance_logs')
    .select('*', { count: 'exact', head: true })
    .eq('performed_by', userId);

  if (maintTotalError) {
    console.error('Error fetching total maintenance:', maintTotalError);
  }

  return {
    alerts_today: alertsToday || 0,
    alerts_total: alertsTotal || 0,
    maintenance_today: maintenanceToday || 0,
    maintenance_total: maintenanceTotal || 0
  };
}

// Fetch operator's activity history
export async function getMyActivityHistory(userId: number, limit: number = 10): Promise<ActivityItem[]> {
  if (!supabase) {
    console.log('Using mock activity data');
    return mockFetch(mockActivity);
  }
  
  // Get resolved alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select(`
      alert_id,
      message,
      resolved_at,
      sensors!inner (
        sensor_type,
        devices!inner (
          device_name
        )
      )
    `)
    .eq('resolved_by', userId)
    .not('resolved_at', 'is', null)
    .order('resolved_at', { ascending: false })
    .limit(limit);

  if (alertsError) {
    console.error('Error fetching alert activities:', alertsError);
  }

  // Get maintenance logs
  const { data: maintenance, error: maintError } = await supabase
    .from('maintenance_logs')
    .select(`
      maintenance_id,
      maintenance_type,
      notes,
      performed_at,
      devices!inner (
        device_name
      )
    `)
    .eq('performed_by', userId)
    .order('performed_at', { ascending: false })
    .limit(limit);

  if (maintError) {
    console.error('Error fetching maintenance activities:', maintError);
  }

  // Combine and sort
  const activities: ActivityItem[] = [];

  alerts?.forEach((alert: any) => {
    activities.push({
      action_type: 'alert_resolved',
      reference_id: alert.alert_id,
      details: alert.message,
      action_time: alert.resolved_at,
      device_name: alert.sensors?.devices?.device_name || 'Unknown'
    });
  });

  maintenance?.forEach((log: any) => {
    activities.push({
      action_type: 'maintenance',
      reference_id: log.maintenance_id,
      details: log.notes,
      action_time: log.performed_at,
      device_name: log.devices?.device_name || 'Unknown',
      maintenance_type: log.maintenance_type
    });
  });

  // Sort by time descending
  return activities
    .sort((a, b) => new Date(b.action_time).getTime() - new Date(a.action_time).getTime())
    .slice(0, limit);
}

// Subscribe to real-time alerts
export function subscribeToAlerts(callback: (alert: Alert) => void) {
  if (!supabase) {
    console.log('Mock: Real-time subscriptions not available');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('alerts-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alerts'
      },
      (payload) => {
        console.log('Alert change received:', payload);
        // Fetch full alert details and call callback
        if (payload.new && (payload.new as any).alert_id) {
          getActiveAlerts().then(alerts => {
            const newAlert = alerts.find(a => a.alert_id === (payload.new as any).alert_id);
            if (newAlert) callback(newAlert);
          });
        }
      }
    )
    .subscribe();
}
