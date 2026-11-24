import { env } from '../config/env';

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export class HealthService {
  public async getHealth(): Promise<HealthCheckData> {
    return {
      status: 'ok',
      service: 'sweety-api',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const healthService = new HealthService();
