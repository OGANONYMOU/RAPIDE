import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const defaults: Record<string, string> = {
  NODE_ENV: 'development',
  PORT: '4000',
  API_URL: 'http://localhost:4000',
  FRONTEND_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://rapide_user:rapide_password@localhost:5432/rapide',
  JWT_SECRET: 'rapide_dev_jwt_secret_change_me',
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_SECRET: 'rapide_dev_refresh_secret_change_me',
  JWT_REFRESH_EXPIRES_IN: '30d',
  REDIS_URL: 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
