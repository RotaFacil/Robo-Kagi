import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, MasterApiState, RobotInstance, TradingParameters } from '../App';

// Use the current window's origin as the Supabase URL.
// This ensures that requests are sent to the local Vite dev server,
// which will then proxy them to the real Supabase backend, avoiding CORS issues.
const supabaseUrl = window.location.origin;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWZodG56aWZtZ3V6dHRqdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzM2ODUsImV4cCI6MjA3MTkwOTY4NX0.kM3e8Lw8Qu0caDxncaJ4gzsJ7ordYqSCNjnwyU0k10Q';


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are not set correctly. Please provide them directly in lib/supabase.ts.");
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for Supabase data structures
export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  doc: string;
  plan: User['plan'];
  subscription_end_date: string;
  is_admin: boolean;
  binance_api_key?: string;
  binance_api_secret?: string;
  binance_api_validated: boolean;
  profile_photo_url?: string;
  created_at: string;
}

export interface SupabaseRobotInstance {
  id: string;
  user_id: string;
  type: 'kagi' | 'ai';
  symbol: string;
  timeframe: string;
  max_capital: number;
  is_running: boolean;
  pnl: number;
  trades: number;
  win_rate: number;
  params: TradingParameters;
  created_at: string;
}

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    // If error.message is a string, use it. Otherwise, stringify the whole error object for better debugging.
    const message = typeof error.message === 'string' ? error.message : JSON.stringify(error);
    throw new Error(`Database error in ${context}: ${message}`);
  }
};


// Fix: Corrected typo in function signature from 'password string' to 'password: string'.
export async function supabaseSignIn(email: string, password: string): Promise<User | null> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    handleSupabaseError(authError, 'signIn');
    if (!authData.user) return null;

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    handleSupabaseError(userError, 'get user profile after sign in');

    if (!userData) throw new Error("User profile not found after login.");

    // Map SupabaseUser to User
    return { 
        id: userData.id, 
        name: userData.name, 
        email: userData.email, 
        isAdmin: userData.is_admin,
        plan: userData.plan,
        subscriptionEndDate: userData.subscription_end_date,
        doc: userData.doc
    };
}


export async function supabaseSignUp(
  // Fix: Corrected typo in type definition from 'password; string;' to 'password: string;'.
  userData: { name: string; email: string; password: string; doc: string; plan: User['plan']; subscriptionEndDate: string; isAdmin: boolean },
  masterApiState: MasterApiState,
): Promise<SupabaseUser | null> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });
    handleSupabaseError(authError, 'signUp');
    if (!authData.user) {
        throw new Error("Could not create user in authentication system.");
    }

    const { data, error } = await supabase
        .from('users')
        .insert({
            id: authData.user.id, // Use the ID from the auth user
            name: userData.name,
            email: userData.email,
            doc: userData.doc,
            plan: userData.plan,
            subscription_end_date: userData.subscriptionEndDate,
            is_admin: userData.isAdmin,
            binance_api_key: masterApiState.apiKey,
            binance_api_secret: masterApiState.apiSecret,
            binance_api_validated: masterApiState.isValidated,
        })
        .select()
        .single();
    
    handleSupabaseError(error, 'createUserProfile');
    return data;
}

export async function supabaseGetUserByEmail(email: string): Promise<SupabaseUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
    handleSupabaseError(error, 'getUserByEmail');
  }
  return data;
}

export async function supabaseUpdateUser(userId: string, updates: Partial<Omit<SupabaseUser, 'id'>>): Promise<SupabaseUser | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  handleSupabaseError(error, 'updateUser');
  return data;
}

export async function supabaseSaveMasterApiState(userId: string, apiState: MasterApiState): Promise<SupabaseUser | null> {
    const updates = {
        binance_api_key: apiState.apiKey,
        binance_api_secret: apiState.apiSecret,
        binance_api_validated: apiState.isValidated
    };
    return supabaseUpdateUser(userId, updates);
}

export async function supabaseGetMasterApiState(userId: string): Promise<MasterApiState> {
  const { data, error } = await supabase
    .from('users')
    .select('binance_api_key, binance_api_secret, binance_api_validated')
    .eq('id', userId)
    .single();

  handleSupabaseError(error, 'getMasterApiState');

  if (!data) {
    return { apiKey: '', apiSecret: '', isValidated: false };
  }

  return {
    apiKey: data.binance_api_key || '',
    apiSecret: data.binance_api_secret || '',
    isValidated: data.binance_api_validated || false,
  };
}


export async function supabaseSaveRobotInstance(robot: RobotInstance & { user_id: string }): Promise<SupabaseRobotInstance | null> {
    const { data, error } = await supabase
        .from('robot_instances')
        .upsert({
            id: robot.id,
            user_id: robot.user_id,
            type: robot.type,
            symbol: robot.symbol,
            timeframe: robot.timeframe,
            max_capital: robot.maxCapital,
            is_running: robot.isRunning,
            pnl: robot.pnl,
            trades: robot.trades,
            win_rate: robot.winRate,
            params: robot.params,
        })
        .select()
        .single();
    
    handleSupabaseError(error, 'saveRobotInstance');
    return data;
}

export async function supabaseGetRobotInstances(userId: string): Promise<RobotInstance[]> {
  const { data, error } = await supabase
    .from('robot_instances')
    .select('*')
    .eq('user_id', userId);
    
  handleSupabaseError(error, 'getRobotInstances');

  // Map Supabase snake_case to app's camelCase
  return (data || []).map((dbInstance: SupabaseRobotInstance) => ({
      id: dbInstance.id,
      type: dbInstance.type,
      symbol: dbInstance.symbol,
      timeframe: dbInstance.timeframe,
      maxCapital: dbInstance.max_capital,
      isRunning: dbInstance.is_running,
      pnl: dbInstance.pnl,
      trades: dbInstance.trades,
      winRate: dbInstance.win_rate,
      params: dbInstance.params,
  }));
}


export async function supabaseDeleteRobotInstance(robotId: string): Promise<void> {
  const { error } = await supabase
    .from('robot_instances')
    .delete()
    .eq('id', robotId);
    
  handleSupabaseError(error, 'deleteRobotInstance');
}
