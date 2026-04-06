import { useState, useEffect } from 'react';
import type { 
  Alert, 
  Device, 
  SensorReading, 
  ActivityItem, 
  OperationalStats, 
  OperatorStats 
} from './types/dashboard';
import { 
  formatDate, 
  capitalizeWords, 
  getStatusColor, 
  getRiverSectionClass, 
  getAlertIcon
} from './utils/dashboard';
import {
  getActiveAlerts,
  getDevicesWithStatus,
  getRecentReadings,
  getOperationalStats,
  getOperatorStats,
  getMyActivityHistory,
  acknowledgeAlert,
  acknowledgeAllAlerts
} from './services/dashboardService';

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  variant?: 'default' | 'attention';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, variant = 'default' }) => (
  <div style={{
    background: '#fff',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid rgba(15,40,84,0.08)',
    boxShadow: '0 2px 8px rgba(15,40,84,0.04)'
  }}>
    <div style={{ fontSize: '11px', color: '#8aa0bc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
    <div style={{ 
      fontSize: '28px', 
      fontWeight: 700, 
      color: variant === 'attention' ? '#dc2626' : '#0F2854',
      marginTop: '8px' 
    }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '12px', color: '#4a6080', marginTop: '4px' }}>{sub}</div>
    )}
  </div>
);

// Alert Item Component
interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (id: number) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  const iconColors: Record<string, { bg: string; color: string }> = {
    critical: { bg: '#fee2e2', color: '#dc2626' },
    high: { bg: '#fef3c7', color: '#d97706' },
    low: { bg: '#dcfce7', color: '#16a34a' }
  };
  const iconStyle = iconColors[alert.alert_type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 20px',
      borderBottom: '1px solid rgba(15,40,84,0.08)',
      transition: 'background 0.2s'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
        background: iconStyle.bg,
        color: iconStyle.color
      }}>
        {getAlertIcon(alert.alert_type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F2854' }}>
          {capitalizeWords(alert.alert_type)} Alert — {capitalizeWords(alert.sensor_type)}
        </div>
        <div style={{ fontSize: '13px', color: '#4a6080', marginTop: '4px' }}>
          {alert.message}
        </div>
        <div style={{ fontSize: '11px', color: '#8aa0bc', marginTop: '6px' }}>
          📍 {capitalizeWords(alert.river_section || 'Unknown')} • 
          🔧 {alert.device_name} • 
          🕐 {formatDate(alert.created_at)}
          {alert.value ? `• Value: ${alert.value.toFixed(2)}` : ''}
        </div>
      </div>
      <button
        onClick={() => onAcknowledge(alert.alert_id)}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          border: 'none',
          background: '#16a34a',
          color: 'white',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
      >
        ✓ Ack
      </button>
    </div>
  );
};

// Device Item Component
interface DeviceItemProps {
  device: Device;
}

const DeviceItem: React.FC<DeviceItemProps> = ({ device }) => {
  const healthStatus = device.alert_count > 0 ? 'critical' : 
                       !device.last_active ? 'offline' : 'healthy';
  const healthColors = getStatusColor(healthStatus);

  const statusColors: Record<string, string> = {
    active: '#16a34a',
    inactive: '#8aa0bc',
    maintenance: '#d97706'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      borderBottom: '1px solid rgba(15,40,84,0.08)'
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        flexShrink: 0,
        background: statusColors[device.status],
        boxShadow: `0 0 0 3px ${getStatusColor(device.status).bg}`
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F2854' }}>
          {device.device_name}
        </div>
        <div style={{ fontSize: '12px', color: '#8aa0bc' }}>
          {device.location_name || 'Unknown'} • {device.sensor_count} sensors
        </div>
      </div>
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500,
        background: healthColors.bg,
        color: healthColors.color
      }}>
        {healthStatus === 'healthy' ? 'Healthy' : 
         healthStatus === 'critical' ? 'Malfunctioning' : 'No Data'}
      </span>
    </div>
  );
};

// Data Table Row Component
interface DataRowProps {
  reading: SensorReading;
}

const DataRow: React.FC<DataRowProps> = ({ reading }) => {
  const status = reading.value > 100 || reading.value < 0 ? 'warning' : 'normal';
  const statusColors = getStatusColor(status);
  const sectionStyle = getRiverSectionClass(reading.location_name || '');

  return (
    <tr style={{ transition: 'background 0.2s' }}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)', fontSize: '13px', color: '#0F2854' }}>
        {formatDate(reading.recorded_at)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)', fontSize: '13px', color: '#0F2854' }}>
        {reading.device_name}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)' }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          textTransform: 'uppercase',
          background: sectionStyle.bg,
          color: sectionStyle.color
        }}>
          {reading.location_name || 'Unknown'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)', fontSize: '13px', color: '#0F2854' }}>
        {capitalizeWords(reading.sensor_type)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)', fontSize: '13px', color: '#0F2854' }}>
        {reading.value.toFixed(2)} {reading.unit}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(15,40,84,0.08)' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 500,
          background: statusColors.bg,
          color: statusColors.color
        }}>
          {status === 'normal' ? '✓' : '⚠'} {capitalizeWords(status)}
        </span>
      </td>
    </tr>
  );
};

// Activity Item Component
interface ActivityItemProps {
  activity: ActivityItem;
}

const ActivityItemComponent: React.FC<ActivityItemProps> = ({ activity }) => {
  const iconColors = activity.action_type === 'alert_resolved' 
    ? { bg: '#dcfce7', color: '#16a34a' }
    : { bg: '#fef3c7', color: '#d97706' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 20px',
      borderBottom: '1px solid rgba(15,40,84,0.08)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
        background: iconColors.bg,
        color: iconColors.color
      }}>
        {activity.action_type === 'alert_resolved' ? '✓' : '🔧'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F2854' }}>
          {activity.action_type === 'alert_resolved' 
            ? 'Resolved Alert' 
            : `Maintenance: ${capitalizeWords(activity.maintenance_type || 'General')}`}
        </div>
        <div style={{ fontSize: '13px', color: '#4a6080', marginTop: '4px' }}>
          {activity.details}
        </div>
        <div style={{ fontSize: '11px', color: '#8aa0bc', marginTop: '6px' }}>
          📍 {activity.device_name} • 
          🕐 {formatDate(activity.action_time)}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
interface DashboardProps {
  userName?: string;
  userRole?: string;
  userId?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  userName = 'Operator', 
  userRole = 'operator',
  userId = 1 
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [myStats, setMyStats] = useState<OperatorStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Dashboard: Starting to load data...');
    setLoading(true);
    try {
      console.log('Dashboard: Fetching from Supabase...');
      const [alertsData, devicesData, readingsData, statsData, myStatsData, activityData] = await Promise.all([
        getActiveAlerts(),
        getDevicesWithStatus(),
        getRecentReadings(24),
        getOperationalStats(),
        getOperatorStats(userId),
        getMyActivityHistory(userId, 10)
      ]);
      console.log('Dashboard: Data fetched successfully', { alerts: alertsData.length, devices: devicesData.length });

      setAlerts(alertsData);
      setDevices(devicesData);
      setReadings(readingsData);
      setStats(statsData);
      setMyStats(myStatsData);
      setActivity(activityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    if (!confirm('Acknowledge this alert?')) return;
    
    const success = await acknowledgeAlert(alertId, userId);
    if (success) {
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
      // Refresh operator stats
      const newStats = await getOperatorStats(userId);
      setMyStats(newStats);
    } else {
      alert('Failed to acknowledge alert. Please try again.');
    }
  };

  const handleAcknowledgeAll = async () => {
    if (!confirm(`Acknowledge ALL ${alerts.length} alerts? This will mark them all as resolved.`)) return;
    
    const count = await acknowledgeAllAlerts(userId);
    if (count > 0) {
      setAlerts([]);
      // Refresh operator stats
      const newStats = await getOperatorStats(userId);
      setMyStats(newStats);
    } else {
      alert('Failed to acknowledge alerts. Please try again.');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
      `}</style>
      
      <div style={{ 
        fontFamily: "'DM Sans', sans-serif",
        background: '#f0f5fb',
        minHeight: '100vh',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1400px' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{ 
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: '#0F2854',
                margin: 0
              }}>
                Operator Dashboard
              </h1>
              <p style={{ color: '#4a6080', fontSize: '14px', marginTop: '4px' }}>
                Manage devices, acknowledge alerts, and monitor operations
              </p>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#cffafe',
              border: '1px solid #0891b2',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#0891b2'
            }}>
              🔧 {capitalizeWords(userRole)}
            </span>
          </div>

          {/* My Operator Stats */}
          {myStats && (
            <div style={{
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #cffafe, white)',
              border: '1px solid #0891b2',
              borderRadius: '14px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #0891b2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0891b2' }}>
                  👤 My Operator Activity
                </span>
                <span style={{ fontSize: '12px', color: '#8aa0bc' }}>{userName}</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '16px' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#0891b2' }}>
                      {myStats.alerts_today}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aa0bc' }}>Alerts Resolved Today</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F2854' }}>
                      {myStats.alerts_total}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aa0bc' }}>Total Alerts Resolved</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#0891b2' }}>
                      {myStats.maintenance_today}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aa0bc' }}>Maintenance Today</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F2854' }}>
                      {myStats.maintenance_total}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8aa0bc' }}>Total Maintenance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {stats && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <StatCard label="Total Devices" value={stats.devices.total} sub={`${stats.devices.active} active`} />
              <StatCard label="Active Alerts" value={stats.active_alerts} sub={`${stats.critical_alerts} critical`} />
              <StatCard label="Today's Readings" value={stats.today_readings} />
              <StatCard label="Needs Attention" value={stats.needs_attention} variant="attention" />
              <StatCard label="In Maintenance" value={stats.devices.maintenance} />
            </div>
          )}

          {/* Alerts & Devices Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Active Alerts */}
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              border: '1px solid rgba(15,40,84,0.08)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(15,40,84,0.04)'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(15,40,84,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F2854' }}>
                  🔔 Active Alerts ({alerts.length})
                </span>
                {alerts.length > 0 && (
                  <button
                    onClick={handleAcknowledgeAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: 'none',
                      background: '#1C4D8D',
                      color: 'white'
                    }}
                  >
                    ✓ Acknowledge All
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F2854' }}>No Active Alerts</div>
                    <p style={{ color: '#8aa0bc', fontSize: '13px' }}>All systems operating normally</p>
                  </div>
                ) : (
                  alerts.slice(0, 8).map(alert => (
                    <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} />
                  ))
                )}
                {alerts.length > 8 && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#8aa0bc' }}>
                    +{alerts.length - 8} more alerts
                  </div>
                )}
              </div>
            </div>

            {/* Device Status */}
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              border: '1px solid rgba(15,40,84,0.08)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(15,40,84,0.04)'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(15,40,84,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F2854' }}>
                  🔧 Device Status
                </span>
                <span style={{ fontSize: '12px', color: '#1C4D8D', fontWeight: 500, cursor: 'pointer' }}>
                  Manage Devices →
                </span>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {devices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F2854' }}>No Devices Found</div>
                  </div>
                ) : (
                  devices.slice(0, 8).map(device => (
                    <DeviceItem key={device.device_id} device={device} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Operational Data */}
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid rgba(15,40,84,0.08)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15,40,84,0.04)',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(15,40,84,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F2854' }}>
                📊 Recent Operational Data (Last 24 Hours)
              </span>
              <span style={{ fontSize: '12px', color: '#8aa0bc' }}>{readings.length} readings</span>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Time</th>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Device</th>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Location</th>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Sensor</th>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Value</th>
                    <th style={{ 
                      background: '#f0f5fb', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4a6080',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.slice(0, 20).map(reading => (
                    <DataRow key={reading.reading_id} reading={reading} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* My Recent Activity */}
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid rgba(15,40,84,0.08)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15,40,84,0.04)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(15,40,84,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F2854' }}>
                👤 My Recent Activity
              </span>
              <span style={{ fontSize: '12px', color: '#8aa0bc' }}>Your actions today</span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: 0 }}>
              {activity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F2854' }}>No Recent Activity</div>
                  <p style={{ color: '#8aa0bc', fontSize: '13px' }}>Start by acknowledging alerts or updating device status</p>
                </div>
              ) : (
                activity.map((item, index) => (
                  <ActivityItemComponent key={index} activity={item} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
