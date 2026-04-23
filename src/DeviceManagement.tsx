import { useState, useEffect } from 'react';
import type { Device } from './types/dashboard';
import { formatDate, capitalizeWords, getStatusColor } from './utils/dashboard';
import { getDevicesWithStatus, getDeviceMaintenanceHistory, logMaintenance, updateDeviceStatus } from './services/deviceService';

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

interface DeviceWithDetails extends Device {
  maintenanceHistory?: MaintenanceLog[];
  sensors?: { sensor_id: number; sensor_type: string }[];
}

interface DeviceCardProps {
  device: DeviceWithDetails;
  userId: string;
  onStatusChange: (deviceId: string, status: string) => void;
  onMaintenanceLog: (deviceId: string, data: MaintenanceFormData) => void;
}

interface MaintenanceFormData {
  maintenance_type: string;
  damage_level: string;
  malfunction_type: string;
  notes: string;
  parts_used: string;
  cost: number;
  duration_hours: number;
  duration_minutes: number;
  performed_by_name: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, userId, onStatusChange, onMaintenanceLog }) => {
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceFormData>({
    maintenance_type: '',
    damage_level: 'none',
    malfunction_type: 'none',
    notes: '',
    parts_used: 'none',
    cost: 0,
    duration_hours: 0,
    duration_minutes: 0,
    performed_by_name: ''
  });
  
  // Use userId for future audit logging
  void userId;

  const healthColors: Record<string, { bg: string; color: string }> = {
    healthy: { bg: '#dcfce7', color: '#16a34a' },
    warning: { bg: '#fef3c7', color: '#d97706' },
    critical: { bg: '#fee2e2', color: '#dc2626' },
    damaged: { bg: '#fee2e2', color: '#dc2626' },
    offline: { bg: '#e5e7eb', color: '#6b7280' }
  };

  const statusColors: Record<string, string> = {
    active: '#16a34a',
    inactive: '#8aa0bc',
    maintenance: '#d97706',
    damaged: '#dc2626'
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes?: number): string => {
    if (!minutes || minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const healthStatus = device.alert_count > 0 ? 'critical' : 
                       !device.last_active ? 'offline' : 'healthy';
  const healthLabel = healthStatus === 'critical' ? 'Malfunctioning' : 
                      healthStatus === 'offline' ? 'No Data' : 'Healthy';
  const healthStyle = healthColors[healthStatus];

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceData.maintenance_type) return;
    if (!maintenanceData.performed_by_name?.trim()) {
      alert('Please enter the name of who performed the maintenance.');
      return;
    }
    
    // Ensure all fields have values before submitting
    const sanitizedData = {
      ...maintenanceData,
      malfunction_type: maintenanceData.malfunction_type || 'none',
      parts_used: maintenanceData.parts_used || 'none',
      cost: maintenanceData.cost || 0
    };
    onMaintenanceLog(device.device_id, sanitizedData);
    setShowMaintenanceForm(false);
    setMaintenanceData({
      maintenance_type: '',
      damage_level: 'none',
      malfunction_type: 'none',
      notes: '',
      parts_used: 'none',
      cost: 0,
      duration_hours: 0,
      duration_minutes: 0,
      performed_by_name: ''
    });
  };

  return (
    <div className="av-glass-card">
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(189,232,245,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: statusColors[device.status],
          boxShadow: `0 0 0 3px ${getStatusColor(device.status).bg}`
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#BDE8F5' }}>
            {device.device_name}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(189,232,245,0.5)' }}>
            {device.location_name || 'Unknown Location'}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          background: healthStyle.bg,
          color: healthStyle.color
        }}>
          {healthLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {/* Info rows */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px', color: '#BDE8F5' }}>
          <span style={{ fontWeight: 500, color: '#fff', minWidth: '100px' }}>Section:</span>
          <span>{capitalizeWords(device.river_section || 'N/A')}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px', color: '#BDE8F5' }}>
          <span style={{ fontWeight: 500, color: '#fff', minWidth: '100px' }}>Sensors:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {device.sensors?.map(sensor => (
              <span key={sensor.sensor_id} style={{
                padding: '4px 10px',
                background: 'rgba(189,232,245,0.2)',
                borderRadius: '10px',
                fontSize: '11px',
                color: '#BDE8F5',
                border: '1px solid rgba(189,232,245,0.3)'
              }}>
                {capitalizeWords(sensor.sensor_type)}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px', color: '#BDE8F5' }}>
          <span style={{ fontWeight: 500, color: '#fff', minWidth: '100px' }}>Last Active:</span>
          <span>{device.last_active ? formatDate(device.last_active) : 'Never'}</span>
        </div>

        {/* Alert banner */}
        {device.alert_count > 0 && (
          <div style={{
            padding: '10px 14px',
            background: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ {device.alert_count} active alert{device.alert_count > 1 ? 's' : ''} - Requires attention
          </div>
        )}

        {/* Maintenance Form */}
        {showMaintenanceForm ? (
          <form onSubmit={handleMaintenanceSubmit} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(15,40,84,0.08)' }}>
            {/* Performed By - at the top */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                value={maintenanceData.performed_by_name}
                onChange={(e) => setMaintenanceData({...maintenanceData, performed_by_name: e.target.value})}
                placeholder="👤 Performed By (Name)"
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff',
                  width: '100%'
                }}
              />
            </div>
            
            {/* Maintenance Type + Change Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <select
                value={maintenanceData.maintenance_type}
                onChange={(e) => setMaintenanceData({...maintenanceData, maintenance_type: e.target.value})}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff'
                }}
                required
              >
                <option value="">Select Maintenance Type</option>
                <option value="repair">🔧 Repair</option>
                <option value="calibration">📏 Calibration</option>
                <option value="cleaning">🧹 Cleaning</option>
                <option value="replacement">🔄 Part Replacement</option>
                <option value="inspection">🔍 Inspection</option>
                <option value="malfunction_fix">🛠️ Fix Malfunction</option>
                <option value="relocation">📍 Relocate Device</option>
              </select>
              <select
                value={device.status}
                onChange={(e) => onStatusChange(device.device_id, e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff'
                }}
              >
                <option value="active">🟢 Active</option>
                <option value="maintenance">🟡 Maintenance</option>
                <option value="inactive">⚫ Inactive</option>
                <option value="damaged">🔴 Damaged</option>
              </select>
            </div>
            
            {/* Damage Level + Malfunction Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <select
                value={maintenanceData.damage_level}
                onChange={(e) => setMaintenanceData({...maintenanceData, damage_level: e.target.value})}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff'
                }}
              >
                <option value="none">✓ No Damage</option>
                <option value="low">⚠️ Low Damage</option>
                <option value="medium">🔶 Medium Damage</option>
                <option value="high">🚨 High Damage</option>
              </select>
              <select
                value={maintenanceData.malfunction_type}
                onChange={(e) => setMaintenanceData({...maintenanceData, malfunction_type: e.target.value})}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff'
                }}
              >
                <option value="none">✓ No Malfunction</option>
                <option value="sensor_failure">📡 Sensor Failure</option>
                <option value="power_issue">🔌 Power Issue</option>
                <option value="communication_error">📶 Communication Error</option>
                <option value="calibration_drift">📏 Calibration Drift</option>
                <option value="physical_damage">💥 Physical Damage</option>
                <option value="water_intrusion">💧 Water Intrusion</option>
                <option value="connectivity_loss">🔗 Connectivity Loss</option>
                <option value="data_corruption">💾 Data Corruption</option>
                <option value="other">❓ Other</option>
              </select>
            </div>
            
            {/* Parts Used - full width */}
            <div style={{ marginBottom: '10px' }}>
              <select
                value={maintenanceData.parts_used}
                onChange={(e) => setMaintenanceData({...maintenanceData, parts_used: e.target.value})}
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(15,40,84,0.08)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff',
                  width: '100%'
                }}
              >
                <option value="none">✓ No Parts Used</option>
                <option value="sensor_module">📡 Sensor Module</option>
                <option value="battery_pack">🔋 Battery Pack</option>
                <option value="solar_panel">☀️ Solar Panel</option>
                <option value="antenna">📶 Antenna</option>
                <option value="cable_wiring">🔌 Cable/Wiring</option>
                <option value="control_board">🔧 Control Board</option>
                <option value="waterproof_seal">🛡️ Waterproof Seal</option>
                <option value="mounting_bracket">🔩 Mounting Bracket</option>
                <option value="calibration_kit">📏 Calibration Kit</option>
                <option value="cleaning_supplies">🧹 Cleaning Supplies</option>
                <option value="other">🔩 Other Parts</option>
              </select>
            </div>
            
            {/* Cost + Hours + Minutes - in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#BDE8F5', fontWeight: 500 }}>Cost ($)</label>
                <input
                  type="number"
                  value={maintenanceData.cost || ''}
                  onChange={(e) => setMaintenanceData({...maintenanceData, cost: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  style={{
                    padding: '10px 12px',
                    border: '1px solid rgba(15,40,84,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#BDE8F5', fontWeight: 500 }}>Hours</label>
                <select
                  value={maintenanceData.duration_hours}
                  onChange={(e) => setMaintenanceData({...maintenanceData, duration_hours: parseInt(e.target.value) || 0})}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid rgba(15,40,84,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  {[0,1,2,3,4,5,6,7,8].map(h => (
                    <option key={h} value={h}>{h} hr{h !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#BDE8F5', fontWeight: 500 }}>Minutes</label>
                <select
                  value={maintenanceData.duration_minutes}
                  onChange={(e) => setMaintenanceData({...maintenanceData, duration_minutes: parseInt(e.target.value) || 0})}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid rgba(15,40,84,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  {[0,15,30,45].map(m => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>
            
            <textarea
              value={maintenanceData.notes}
              onChange={(e) => setMaintenanceData({...maintenanceData, notes: e.target.value})}
              placeholder="Describe the work performed, issues found, parts replaced, calibration details..."
              style={{
                padding: '10px 12px',
                border: '1px solid rgba(15,40,84,0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                background: '#fff',
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '10px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white'
                }}
              >
                📝 Log Maintenance
              </button>
              <button
                type="button"
                onClick={() => setShowMaintenanceForm(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid rgba(15,40,84,0.08)',
                  background: '#fff',
                  color: '#4a6080'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowMaintenanceForm(true)}
            style={{
              marginTop: '16px',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: '#16a34a',
              color: 'white',
              width: '100%'
            }}
          >
            📝 Log Maintenance
          </button>
        )}

        {/* Maintenance History */}
        {device.maintenanceHistory && device.maintenanceHistory.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#BDE8F5', marginBottom: '10px' }}>
              📋 Recent Maintenance History
            </div>
            {device.maintenanceHistory.slice(0, 3).map((maint) => (
              <div key={maint.maintenance_id} style={{
                padding: '10px',
                background: 'rgba(189,232,245,0.1)',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid rgba(189,232,245,0.2)',
                fontSize: '12px'
              }}>
                <div style={{ color: '#BDE8F5', marginBottom: '4px' }}>
                  {formatDate(maint.performed_at)} by {maint.operator_name}
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#fff' }}>
                    {capitalizeWords(maint.maintenance_type)}
                  </span>
                  {maint.damage_level !== 'none' && (
                    <span style={{ color: '#dc2626', fontWeight: 500 }}> • Damage: {maint.damage_level}</span>
                  )}
                  {maint.malfunction_type && (
                    <span style={{ color: '#d97706' }}> • {maint.malfunction_type}</span>
                  )}
                  {maint.duration_minutes && maint.duration_minutes > 0 && (
                    <span style={{ color: '#16a34a' }}> • ⏱️ {formatDuration(maint.duration_minutes)}</span>
                  )}
                </div>
                {maint.notes && (
                  <div style={{ color: '#4a6080', marginTop: '4px' }}>{maint.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DeviceManagementProps {
  userId?: string;
  userName?: string;
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ userId = '00000000-0000-0000-0000-000000000001', userName }) => {
  // userName available for future header display
  void userName;
  const [devices, setDevices] = useState<DeviceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      console.log('DeviceManagement: Fetching devices...');
      const devicesData = await getDevicesWithStatus();
      console.log('DeviceManagement: Fetched devices:', devicesData.length);
      
      // Load maintenance history for each device
      const devicesWithHistory = await Promise.all(
        devicesData.map(async (device) => {
          const history = await getDeviceMaintenanceHistory(device.device_id);
          return { ...device, maintenanceHistory: history };
        })
      );
      
      setDevices(devicesWithHistory);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (deviceId: string, status: string) => {
    const success = await updateDeviceStatus(deviceId, status);
    if (success) {
      setDevices(prev => prev.map(d => 
        d.device_id === deviceId ? { ...d, status: status as 'active' | 'maintenance' | 'inactive' } : d
      ));
    } else {
      alert('Failed to update device status. Please try again.');
    }
  };

  const handleMaintenanceLog = async (deviceId: string, data: MaintenanceFormData) => {
    const success = await logMaintenance(deviceId, userId, data);
    if (success) {
      // Reload all devices with full maintenance history
      console.log('Maintenance logged, reloading devices with history...');
      await loadDevices();
    } else {
      alert('Failed to log maintenance. Please try again.');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading devices...</div>;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        .av-devices {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #0a1f42 0%, #0F2854 50%, #1C4D8D 100%);
          min-height: 100vh;
          padding: 24px;
          position: relative;
        }
        
        .av-devices::before {
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
      `}</style>
      
      <div className="av-devices">
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
                🔧 Device Management
              </h1>
              <p style={{ color: 'rgba(189,232,245,0.6)', fontSize: '14px', marginTop: '4px' }}>
                Maintain, repair, and track device health
              </p>
            </div>
          </div>

          {/* Device Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {devices.map(device => (
              <DeviceCard
                key={device.device_id}
                device={device}
                userId={userId}
                onStatusChange={handleStatusChange}
                onMaintenanceLog={handleMaintenanceLog}
              />
            ))}
          </div>

          {devices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0F2854' }}>
                No Devices Found
              </div>
              <p style={{ color: '#8aa0bc', fontSize: '14px' }}>
                Add devices to your system to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DeviceManagement;
