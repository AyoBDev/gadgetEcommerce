import { existsSync } from 'fs';
import path from 'path';

const envLocalPath = path.resolve(__dirname, '../.env.local');
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}
