# Health Check API Documentation

## Overview

NotesFlow provides comprehensive health check endpoints for monitoring application health, readiness, and liveness. These endpoints are designed for use by monitoring systems, load balancers, and container orchestrators.

## Endpoints

### 1. Main Health Check - `/api/health`

Comprehensive health check providing detailed service status.

#### GET Request
```bash
curl https://your-domain.com/api/health
```

#### Response (Public)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "auth": {
      "status": "up",
      "provider": "BetterAuth"
    },
    "storage": {
      "status": "up",
      "provider": "Supabase"
    }
  }
}
```

#### Response (With Monitoring Key)
```bash
curl -H "x-monitoring-key: your-secret-key" https://your-domain.com/api/health
```

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "auth": {
      "status": "up",
      "provider": "BetterAuth"
    },
    "storage": {
      "status": "up",
      "provider": "Supabase"
    }
  },
  "system": {
    "memory": {
      "used": 512,
      "total": 2048,
      "percentage": 25
    },
    "cpu": {
      "loadAverage": [0.5, 0.7, 0.8]
    },
    "node": {
      "version": "v20.11.0"
    }
  }
}
```

#### Status Codes
- `200 OK` - Service is healthy or degraded
- `503 Service Unavailable` - Service is unhealthy

#### HEAD Request
Lightweight check for load balancers:
```bash
curl -I https://your-domain.com/api/health
```

### 2. Readiness Probe - `/api/health/ready`

Determines if the application is ready to receive traffic.

#### GET Request
```bash
curl https://your-domain.com/api/health/ready
```

#### Response
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "migrations": true,
    "environment": true
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

#### Status Codes
- `200 OK` - Application is ready
- `503 Service Unavailable` - Application is not ready

### 3. Liveness Probe - `/api/health/live`

Simple check to determine if the application process is alive.

#### GET Request
```bash
curl https://your-domain.com/api/health/live
```

#### Response
```json
{
  "alive": true,
  "timestamp": "2024-01-20T10:30:00.000Z",
  "pid": 1234
}
```

#### HEAD Request
Ultra-lightweight check:
```bash
curl -I https://your-domain.com/api/health/live
```

#### Status Codes
- `200 OK` - Application is alive

## Health Status Definitions

### Service Status
- **healthy**: All services are functioning normally
- **degraded**: Some services are down but core functionality remains
- **unhealthy**: Critical services are down

### Service States
- **up**: Service is operational
- **down**: Service is not responding or misconfigured

## Monitoring Integration

### Kubernetes Configuration

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: notesflow
    image: notesflow:latest
    livenessProbe:
      httpGet:
        path: /api/health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Docker Compose

```yaml
services:
  notesflow:
    image: notesflow:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Load Balancer Configuration (AWS ALB)

```
Health check path: /api/health
Health check interval: 30 seconds
Health check timeout: 5 seconds
Healthy threshold: 2
Unhealthy threshold: 3
```

## Environment Variables

### Required for Monitoring
- `MONITORING_KEY`: Secret key for accessing detailed system information

### Checked by Health Endpoints
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Authentication secret
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Best Practices

1. **Frequency**: 
   - Liveness: Every 10-30 seconds
   - Readiness: Every 5-10 seconds
   - Full health: Every 30-60 seconds

2. **Timeouts**:
   - Set appropriate timeouts (5-10 seconds)
   - Use HEAD requests for high-frequency checks

3. **Monitoring**:
   - Alert on consecutive failures, not single failures
   - Monitor response times as well as status
   - Use different thresholds for different environments

4. **Security**:
   - Keep monitoring key secret
   - Don't expose sensitive system information publicly
   - Use HTTPS in production

## Response Time Guidelines

- Liveness probe: < 100ms
- Readiness probe: < 500ms
- Full health check: < 1000ms

## Troubleshooting

### Service Shows as Unhealthy

1. Check database connection
2. Verify environment variables
3. Check application logs
4. Ensure migrations have run

### High Response Times

1. Check database query performance
2. Review connection pool settings
3. Monitor system resources
4. Check network latency