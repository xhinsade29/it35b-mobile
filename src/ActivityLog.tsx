import { useState, useEffect } from 'react';
import { formatDate, capitalizeWords } from './utils/dashboard';
import { getMyResolvedAlerts, getMyMaintenanceLogs, getDeviceStatusChanges } from './services/activityService';

interface ResolvedAlert {
  alert_id: string;
  alert_type: string;
  message: string;
  created_at: string;
  resolved_at: string;
  device_name: string;
  sensor_type: string;
  value?: number;
}

interface MaintenanceLog {
  maintenance_id: string;
  maintenance_type: string;
  notes: string;
  damage_level: string;
  malfunction_type: string;
  performed_at: string;
  device_name: string;
  device_id: string;
}

interface StatusChange {
  device_id: string;
  device_name: string;
  status: string;
  updated_at: string;
  location_name: string;
}

interface ActivityLogProps {
  userId?: string;
  userName?: string;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ 
  userId = '00000000-0000-0000-0000-000000000001', 
  userName = 'Operator' 
}) => {
  const [hoursFilter, setHoursFilter] = useState(24);
  const [alerts, setAlerts] = useState<ResolvedAlert[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [hoursFilter]);

  const loadActivity = async () => {
    console.log('ActivityLog: Loading activity for user:', userId, 'hours filter:', hoursFilter);
    setLoading(true);
    try {
      const [alertsData, maintenanceData, statusData] = await Promise.all([
        getMyResolvedAlerts(userId, hoursFilter),
        getMyMaintenanceLogs(userId, hoursFilter),
        getDeviceStatusChanges(hoursFilter)
      ]);
      
      console.log('ActivityLog: Data loaded', { 
        alerts: alertsData.length, 
        maintenance: maintenanceData.length, 
        statusChanges: statusData.length 
      });
      
      setAlerts(alertsData);
      setMaintenance(maintenanceData);
      setStatusChanges(statusData);
    } catch (error) {
      console.error('ActivityLog: Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      repair: { bg: '#fee2e2', color: '#dc2626' },
      calibration: { bg: '#fef3c7', color: '#d97706' },
      cleaning: { bg: '#dcfce7', color: '#16a34a' },
      inspection: { bg: '#cffafe', color: '#0891b2' },
      replacement: { bg: '#e0e7ff', color: '#4f46e5' },
      malfunction_fix: { bg: '#fee2e2', color: '#dc2626' }
    };
    return styles[type] || { bg: '#f0f5fb', color: '#0F2854' };
  };

  const getDamageBadgeStyle = (level: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      low: { bg: '#fef3c7', color: '#d97706' },
      medium: { bg: '#fed7aa', color: '#92400e' },
      high: { bg: '#fee2e2', color: '#dc2626' }
    };
    return styles[level] || { bg: '#f0f5fb', color: '#8aa0bc' };
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading activity...</div>;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        .av-activity {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #0a1f42 0%, #0F2854 50%, #1C4D8D 100%);
          min-height: 100vh;
          padding: 24px;
          position: relative;
        }
        
        .av-activity::before {
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
        
        .av-stat-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(189, 232, 245, 0.15);
          transition: all 0.3s ease;
        }
        
        .av-stat-pill:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(189, 232, 245, 0.25);
        }
      `}</style>
      
      <div className="av-activity">
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
                👤 My Activity Log
              </h1>
              <p style={{ color: 'rgba(189,232,245,0.6)', fontSize: '14px', marginTop: '4px' }}>
                Track your actions: alerts resolved, maintenance performed, and status changes
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
            <div className="av-stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{alerts.length}</span>
              <span style={{ fontSize: '12px', color: 'rgba(189,232,245,0.6)' }}>Alerts Resolved</span>
            </div>
            <div className="av-stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#d97706' }}>{maintenance.length}</span>
              <span style={{ fontSize: '12px', color: 'rgba(189,232,245,0.6)' }}>Maintenance Tasks</span>
            </div>
            <div className="av-stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#4988C4' }}>{statusChanges.length}</span>
              <span style={{ fontSize: '12px', color: 'rgba(189,232,245,0.6)' }}>Status Changes</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <select
              value={hoursFilter}
              onChange={(e) => setHoursFilter(Number(e.target.value))}
              style={{
                padding: '8px 14px',
                border: '1px solid rgba(189,232,245,0.2)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#BDE8F5'
              }}
            >
              <option value={24} style={{ background: '#0F2854' }}>Last 24 Hours</option>
              <option value={48} style={{ background: '#0F2854' }}>Last 48 Hours</option>
              <option value={72} style={{ background: '#0F2854' }}>Last 72 Hours</option>
              <option value={168} style={{ background: '#0F2854' }}>Last 7 Days</option>
            </select>
          </div>

          {/* Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px'
          }}>
            {/* Resolved Alerts */}
            <div className="av-glass-card">
              <div className="av-glass-header" style={{
                padding: '16px 20px',
                borderRadius: '14px 14px 0 0'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Alerts Resolved
                </span>
              </div>
              <div style={{ padding: 0, maxHeight: '500px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Alerts Resolved</div>
                    <p style={{ color: 'rgba(189,232,245,0.5)', fontSize: '13px' }}>You haven't resolved any alerts in the last {hoursFilter} hours</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.alert_id} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px 20px',
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
                        background: 'rgba(22, 163, 74, 0.2)',
                        color: '#16a34a'
                      }}>✓</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5' }}>
                          {capitalizeWords(alert.alert_type)} Alert Resolved
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(189,232,245,0.7)', marginTop: '4px' }}>
                          {alert.device_name} — {alert.message}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.5)', marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>📍 {capitalizeWords(alert.sensor_type)}</span>
                          <span>🕐 {formatDate(alert.resolved_at)}</span>
                          {alert.value && <span>📊 Value: {alert.value.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Maintenance Log */}
            <div className="av-glass-card">
              <div className="av-glass-header" style={{
                padding: '16px 20px',
                borderRadius: '14px 14px 0 0'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔧 My Maintenance Work
                </span>
              </div>
              <div style={{ padding: 0, maxHeight: '500px', overflowY: 'auto' }}>
                {maintenance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛠️</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Maintenance Logged</div>
                    <p style={{ color: 'rgba(189,232,245,0.5)', fontSize: '13px' }}>You haven't logged any maintenance in the last {hoursFilter} hours</p>
                  </div>
                ) : (
                  maintenance.map((maint) => {
                    const badgeStyle = getBadgeStyle(maint.maintenance_type);
                    const damageStyle = getDamageBadgeStyle(maint.damage_level);
                    return (
                      <div key={maint.maintenance_id} style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px 20px',
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
                          background: 'rgba(217, 119, 6, 0.2)',
                          color: '#d97706'
                        }}>🔧</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {capitalizeWords(maint.maintenance_type)}
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 500,
                              background: badgeStyle.bg,
                              color: badgeStyle.color
                            }}>{capitalizeWords(maint.maintenance_type)}</span>
                            {maint.damage_level !== 'none' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 500,
                                background: damageStyle.bg,
                                color: damageStyle.color
                              }}>Damage: {capitalizeWords(maint.damage_level)}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(189,232,245,0.7)', marginTop: '4px' }}>
                            {maint.device_name}
                            {maint.malfunction_type && (
                              <><br/><span style={{ color: '#d97706' }}>⚠️ {maint.malfunction_type}</span></>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.5)', marginTop: '6px' }}>
                            <span>🕐 {formatDate(maint.performed_at)}</span>
                          </div>
                          {maint.notes && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px',
                              background: 'rgba(189,232,245,0.1)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'rgba(189,232,245,0.7)'
                            }}>{maint.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Device Status Changes */}
          <div className="av-glass-card" style={{ marginTop: '20px' }}>
            <div className="av-glass-header" style={{
              padding: '16px 20px',
              borderRadius: '14px 14px 0 0'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#BDE8F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔄 Device Status Changes
              </span>
            </div>
            <div style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
              {statusChanges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>No Status Changes</div>
                  <p style={{ color: 'rgba(189,232,245,0.5)', fontSize: '13px' }}>No device status changes in the last {hoursFilter} hours</p>
                </div>
              ) : (
                statusChanges.map((change) => (
                  <div key={change.device_id} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 20px',
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
                      background: 'rgba(73, 136, 196, 0.2)',
                      color: '#4988C4'
                    }}>🔄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#BDE8F5' }}>
                        {change.device_name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(189,232,245,0.7)', marginTop: '4px' }}>
                        Status changed to <strong>{capitalizeWords(change.status)}</strong>
                        {change.location_name && (
                          <> at {change.location_name}</>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(189,232,245,0.5)', marginTop: '6px' }}>
                        <span>🕐 {formatDate(change.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityLog;
