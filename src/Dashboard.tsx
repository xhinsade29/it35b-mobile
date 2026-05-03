import { useState, useEffect, useCallback } from 'react';
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
  acknowledgeAllAlerts,
  subscribeToAlerts,
  subscribeToDeviceChanges
} from './services/dashboardService';
import {
  FullPageSkeleton,
  StatCardSkeleton,
  AlertItemSkeleton,
  DeviceItemSkeleton,
  TableRowSkeleton,
  ActivityItemSkeleton,
  CardHeaderSkeleton
} from './components/SkeletonComponents';

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  variant?: 'default' | 'attention';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, variant = 'default' }) => (
  <div className="av-glass-stat" style={{
    borderRadius: '14px',
    padding: '20px'
  }}>
    <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
    <div style={{ 
      fontSize: '28px', 
      fontWeight: 700, 
      color: variant === 'attention' ? '#fca5a5' : '#BDE8F5',
      marginTop: '8px' 
    }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '12px', color: 'rgba(189,232,245,0.5)', marginTop: '4px' }}>{sub}</div>
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
      borderBottom: '1px solid rgba(189,232,245,0.08)',
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
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5' }}>
          {capitalizeWords(alert.alert_type)} Alert — {capitalizeWords(alert.sensor_type)}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(189,232,245,0.7)', marginTop: '4px' }}>
          {alert.message}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.5)', marginTop: '6px' }}>
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
          background: 'rgba(22, 163, 74, 0.8)',
          color: 'white',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(21, 128, 61, 0.9)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(22, 163, 74, 0.8)'}
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
      borderBottom: '1px solid rgba(189,232,245,0.08)'
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
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5' }}>
          {device.device_name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(189,232,245,0.5)' }}>
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
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)', fontSize: '13px', color: '#BDE8F5' }}>
        {formatDate(reading.recorded_at)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)', fontSize: '13px', color: '#BDE8F5' }}>
        {reading.device_name}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
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
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)', fontSize: '13px', color: '#BDE8F5' }}>
        {capitalizeWords(reading.sensor_type)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)', fontSize: '13px', color: '#BDE8F5' }}>
        {reading.value.toFixed(2)} {reading.unit}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(189,232,245,0.08)' }}>
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
    ? { bg: 'rgba(22, 163, 74, 0.2)', color: '#16a34a' }
    : { bg: 'rgba(217, 119, 6, 0.2)', color: '#d97706' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 20px',
      borderBottom: '1px solid rgba(189,232,245,0.08)'
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
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5' }}>
          {activity.action_type === 'alert_resolved' 
            ? 'Resolved Alert' 
            : `Maintenance: ${capitalizeWords(activity.maintenance_type || 'General')}`}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(189,232,245,0.7)', marginTop: '4px' }}>
          {activity.details}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.5)', marginTop: '6px' }}>
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
  userId?: number | string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  userName = 'Operator', 
  userRole = 'operator',
  userId = '00000000-0000-0000-0000-000000000001'
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [myStats, setMyStats] = useState<OperatorStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription for alerts
  useEffect(() => {
    console.log('Dashboard: Setting up real-time alert subscription...');
    
    const subscription = subscribeToAlerts((newAlert) => {
      console.log('Dashboard: Real-time alert received:', newAlert);
      // Refresh all dashboard data when alert changes
      loadData();
    });

    return () => {
      console.log('Dashboard: Cleaning up alert subscription...');
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Real-time subscription for device status changes
  useEffect(() => {
    console.log('Dashboard: Setting up real-time device subscription...');
    
    const subscription = subscribeToDeviceChanges((newDevice) => {
      console.log('Dashboard: Real-time device change received:', newDevice);
      // Refresh all dashboard data when device status changes
      loadData();
    });

    return () => {
      console.log('Dashboard: Cleaning up device subscription...');
      subscription.unsubscribe();
    };
  }, [loadData]);

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
    return (
      <FullPageSkeleton>
        <div className="av-dashboard">
          <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Header Skeleton */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ 
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#BDE8F5',
                  margin: 0
                }}>
                  <div style={{ width: '200px', height: '28px', background: 'linear-gradient(90deg, rgba(189,232,245,0.1) 25%, rgba(189,232,245,0.2) 50%, rgba(189,232,245,0.1) 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite', borderRadius: '4px' }} />
                </div>
                <div style={{ width: '300px', height: '14px', background: 'linear-gradient(90deg, rgba(189,232,245,0.1) 25%, rgba(189,232,245,0.2) 50%, rgba(189,232,245,0.1) 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite', borderRadius: '4px', marginTop: '4px' }} />
              </div>
              <div style={{ width: '120px', height: '28px', background: 'linear-gradient(90deg, rgba(189,232,245,0.1) 25%, rgba(189,232,245,0.2) 50%, rgba(189,232,245,0.1) 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite', borderRadius: '20px' }} />
            </div>

            {/* Stats Grid Skeleton */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              {[1, 2, 3, 4, 5].map(i => <StatCardSkeleton key={i} />)}
            </div>

            {/* Alerts & Devices Grid Skeleton */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Active Alerts Skeleton */}
              <div className="av-glass-card">
                <CardHeaderSkeleton />
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {[1, 2, 3, 4, 5].map(i => <AlertItemSkeleton key={i} />)}
                </div>
              </div>

              {/* Device Status Skeleton */}
              <div className="av-glass-card">
                <CardHeaderSkeleton />
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {[1, 2, 3, 4, 5].map(i => <DeviceItemSkeleton key={i} />)}
                </div>
              </div>
            </div>

            {/* Recent Operational Data Skeleton */}
            <div className="av-glass-card" style={{ marginBottom: '24px' }}>
              <CardHeaderSkeleton />
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Time</th>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Device</th>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Location</th>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Sensor</th>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Value</th>
                      <th style={{ 
                        background: 'rgba(189,232,245,0.1)', 
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(189,232,245,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
                  </tbody>
                </table>
              </div>
            </div>

            {/* My Recent Activity Skeleton */}
            <div className="av-glass-card">
              <CardHeaderSkeleton />
              <div style={{ maxHeight: '300px', overflowY: 'auto', padding: 0 }}>
                {[1, 2, 3, 4, 5].map(i => <ActivityItemSkeleton key={i} />)}
              </div>
            </div>
          </div>
        </div>
      </FullPageSkeleton>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        .av-dashboard {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #0a1f42 0%, #0F2854 50%, #1C4D8D 100%);
          min-height: 100vh;
          padding: 24px;
          position: relative;
        }
        
        .av-dashboard::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234988C4' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        
        .av-glass-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(189, 232, 245, 0.12);
          border-radius: 14px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        }
        
        .av-glass-header {
          background: linear-gradient(90deg, rgba(8, 145, 178, 0.25), rgba(73, 136, 196, 0.15));
          border-bottom: 1px solid rgba(189, 232, 245, 0.1);
        }
        
        .av-glass-stat {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(189, 232, 245, 0.15);
          transition: all 0.3s ease;
        }
        
        .av-glass-stat:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(189, 232, 245, 0.25);
          transform: translateY(-2px);
        }
      `}</style>
      
      <div className="av-dashboard">
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
                color: '#BDE8F5',
                margin: 0
              }}>
                Operator Dashboard
              </h1>
              <p style={{ color: 'rgba(189,232,245,0.6)', fontSize: '14px', marginTop: '4px' }}>
                Manage devices, acknowledge alerts, and monitor operations
              </p>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(8, 145, 178, 0.2)',
              border: '1px solid rgba(8, 145, 178, 0.4)',
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
            <div className="av-glass-card">
              <div className="av-glass-header" style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5' }}>
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
                      background: 'rgba(28, 77, 141, 0.8)',
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
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Active Alerts</div>
                    <p style={{ color: 'rgba(189,232,245,0.5)', fontSize: '13px' }}>All systems operating normally</p>
                  </div>
                ) : (
                  alerts.slice(0, 8).map(alert => (
                    <AlertItem key={alert.alert_id} alert={alert} onAcknowledge={handleAcknowledge} />
                  ))
                )}
                {alerts.length > 8 && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(189,232,245,0.5)' }}>
                    +{alerts.length - 8} more alerts
                  </div>
                )}
              </div>
            </div>

            {/* Device Status */}
            <div className="av-glass-card">
              <div className="av-glass-header" style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5' }}>
                  🔧 Device Status
                </span>
                <span style={{ fontSize: '12px', color: '#0891b2', fontWeight: 500, cursor: 'pointer' }}>
                  Manage Devices →
                </span>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {devices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Devices Found</div>
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
          <div className="av-glass-card" style={{ marginBottom: '24px' }}>
            <div className="av-glass-header" style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5' }}>
                📊 Recent Operational Data (Last 24 Hours)
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(189,232,245,0.5)' }}>{readings.length} readings</span>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Time</th>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Device</th>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Location</th>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Sensor</th>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Value</th>
                    <th style={{ 
                      background: 'rgba(189,232,245,0.1)', 
                      padding: '12px 16px', 
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(189,232,245,0.7)',
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
          <div className="av-glass-card">
            <div className="av-glass-header" style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5' }}>
                👤 My Recent Activity
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(189,232,245,0.5)' }}>Your actions today</span>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: 0 }}>
              {activity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Recent Activity</div>
                  <p style={{ color: 'rgba(189,232,245,0.5)', fontSize: '13px' }}>Start by acknowledging alerts or updating device status</p>
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
