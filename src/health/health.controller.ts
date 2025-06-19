import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ymrentals-api',
      version: '1.0.0'
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    };
  }

  @Get('env')
  @ApiOperation({ summary: 'Environment check endpoint' })
  @ApiResponse({ status: 200, description: 'Environment variables status' })
  env() {
    return {
      status: 'ok',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not-set',
        PORT: process.env.PORT || 'not-set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not-set',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'not-set',
      },
      timestamp: new Date().toISOString()
    };
  }
}
