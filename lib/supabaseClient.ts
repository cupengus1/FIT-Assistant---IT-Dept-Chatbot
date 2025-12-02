
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Key
const SUPABASE_URL = process.env.SUPABASE_URL || "https://woogktfcryqbbxursqjq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb2drdGZjcnlxYmJ4dXJzcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDA1OTksImV4cCI6MjA3OTk3NjU5OX0.HQd9vX1NYgGccl0sPhb3lAjl3dWlSxDspkkY5z1SSS4";

// Check if the credentials have been updated from the defaults
// FIXED: Always return true if values are present, regardless of whether they match the hardcoded defaults.
export const isConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
