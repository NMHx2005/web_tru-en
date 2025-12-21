import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
@Public() // Bypass JWT authentication for health checks
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Web Truyen API is running',
    };
  }

  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
