import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasının yolunu belirt
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
    mongoURI: process.env.MONGO_URI,
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET
};

// Gerekli environment değişkenlerini kontrol et
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable is not set`);
    }
}

export default config;
