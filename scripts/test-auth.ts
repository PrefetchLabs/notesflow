import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('Auth Configuration Test');
console.log('======================');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? '✓ Set' : '✗ Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set (will use localhost)');

console.log('\nGoogle OAuth Redirect URIs to configure:');
console.log('- Development: http://localhost:3000/api/auth/callback/google');
console.log('- Development (alt): http://localhost:3001/api/auth/callback/google');
console.log('- Production:', process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google` : 'Set NEXT_PUBLIC_APP_URL first');