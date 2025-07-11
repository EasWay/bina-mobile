import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://qebpnpzoqmyrudxgxckn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlYnBucHpvcW15cnVkeGd4Y2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjY0MzEsImV4cCI6MjA2Nzc0MjQzMX0.dsja_tYQqQT2oShDxZokY55ntwSdlwtFeSWLJfeqGYQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: async (key) => {
        return await SecureStore.getItemAsync(key);
      },
      setItem: async (key, value) => {
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key) => {
        await SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 