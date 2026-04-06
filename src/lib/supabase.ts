import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase not configured. Using mock data mode.');
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Test connection
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.log('Supabase not configured');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('devices').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}

export type Tables = {
  users: {
    user_id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'admin' | 'operator' | 'viewer' | 'researcher';
    is_active: boolean;
    created_at: string;
  };
  devices: {
    device_id: number;
    device_name: string;
    device_type: string;
    location_id: number | null;
    status: 'active' | 'inactive' | 'maintenance' | 'offline' | 'unassigned';
    device_condition: 'normal' | 'displaced' | 'damaged' | 'malfunctioning';
    last_active: string | null;
    created_at: string;
  };
  locations: {
    location_id: number;
    location_name: string;
    river_section: 'upstream' | 'midstream' | 'downstream';
    latitude: number;
    longitude: number;
  };
  sensors: {
    sensor_id: number;
    device_id: number;
    sensor_type: string;
    unit: string;
    min_threshold: number;
    max_threshold: number;
  };
  sensor_readings: {
    reading_id: number;
    sensor_id: number;
    value: number;
    recorded_at: string;
  };
  alerts: {
    alert_id: number;
    sensor_id: number;
    reading_id: number;
    alert_type: 'low' | 'high' | 'critical';
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    resolved_by: number | null;
    resolved_at: string | null;
    created_at: string;
  };
  maintenance_logs: {
    maintenance_id: number;
    device_id: number;
    performed_by: number;
    maintenance_type: string;
    damage_level: 'none' | 'low' | 'medium' | 'high';
    notes: string;
    performed_at: string;
  };
};
