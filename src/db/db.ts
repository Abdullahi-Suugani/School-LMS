import { localDb } from './localDb';
import { isSupabaseConfigured } from './supabaseClient';
import { supabaseDb } from './supabaseDb';

type AnyFn = (...args: any[]) => any;

const asyncLocalDb = Object.fromEntries(
  Object.entries(localDb).map(([key, value]) => [
    key,
    async (...args: Parameters<AnyFn>) => (value as AnyFn)(...args)
  ])
) as typeof supabaseDb;

export const db = isSupabaseConfigured ? supabaseDb : asyncLocalDb;
export const usingSupabase = isSupabaseConfigured;
