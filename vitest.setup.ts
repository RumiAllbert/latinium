import { config } from 'dotenv';
config({ path: '.env.local' });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}
if (!process.env.APP_SECRET) {
  throw new Error('Tests require APP_SECRET in .env.local');
}
