# OpenCode Multiuser System - Deployment Guide

## 🚀 Deployment Status

**✅ ERFOLGREICH DEPLOYED!**

- **Container Registry**: `ghcr.io/davidrothenfels/cliopencode:master`
- **GitHub Repository**: https://github.com/DavidRothenfels/cliopencode
- **Build Status**: ✅ Erfolgreich
- **CI/CD Pipeline**: ✅ Aktiv
- **Container Tests**: ✅ Bestanden

## 🐳 Docker Container

### Aktuelles Image verwenden:
```bash
docker pull ghcr.io/davidrothenfels/cliopencode:master
```

### Lokales Testing:
```bash
docker run -d \
  --name opencode-multiuser \
  -p 8090:8090 \
  -p 3001:3001 \
  -e OPENAI_API_KEY="your-openai-api-key-here" \
  ghcr.io/davidrothenfels/cliopencode:master
```

### Health Checks:
```bash
# PocketBase API
curl http://localhost:8090/api/health

# Node.js Service
curl http://localhost:3001/health

# Basic Hook Test
curl http://localhost:8090/test
```

## 🔧 Coolify Deployment

### 1. Neue Anwendung erstellen
- **Service Type**: Docker
- **Image**: `ghcr.io/davidrothenfels/cliopencode:master`
- **Ports**: 
  - `8090:8090` (PocketBase/Dashboard)
  - `3001:3001` (Node.js Service)

### 2. Environment Variables
```env
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
PORT=3001
```

### 3. Health Check Configuration
- **Health Check Path**: `/api/health`
- **Health Check Port**: `8090`
- **Health Check Interval**: `30s`

### 4. Volume Mounts (Optional)
```yaml
volumes:
  - ./pb_data:/app/pb_data  # Persistent PocketBase data
```

## 🌐 Endpoints nach Deployment

### Haupt-Anwendung
- **Dashboard**: `http://your-domain:8090/_/debug.html`
- **PocketBase Admin**: `http://your-domain:8090/_/`
- **API Base**: `http://your-domain:8090/api/`

### Login Credentials
- **Test User**: `test@test.com` / `test123456`
- **Admin**: `admin@example.com` / `admin123456`

### API Endpoints
- **Health**: `GET /api/health`
- **Basic Test**: `GET /test`
- **OpenCode Stream**: `GET /opencode/stream?prompt=YOUR_PROMPT`

## 📊 Monitoring

### Container Logs
```bash
docker logs -f opencode-multiuser
```

### Service Status
```bash
# Check if both services are running
curl http://localhost:8090/api/health
curl http://localhost:3001/health
```

### Performance Monitoring
- **PocketBase**: SQLite Database Monitoring
- **Node.js**: Memory/CPU Usage
- **OpenCode**: Process Lifecycle

## 🔄 Automatic Updates

### GitHub Actions CI/CD
- **Trigger**: Push to `master` branch
- **Build**: Automated Docker build
- **Test**: Container health checks
- **Deploy**: Push to GitHub Container Registry

### Manual Deployment
```bash
# Pull latest image
docker pull ghcr.io/davidrothenfels/cliopencode:master

# Restart with new image
docker stop opencode-multiuser
docker rm opencode-multiuser
docker run -d --name opencode-multiuser -p 8090:8090 -p 3001:3001 -e OPENAI_API_KEY="your-key" ghcr.io/davidrothenfels/cliopencode:master
```

## 🔒 Security

### API Key Management
- **User Keys**: Set individual API keys in PocketBase admin
- **System Key**: Set via environment variable
- **Fallback**: Demo mode if no key available

### Container Security
- **Non-root user**: Container runs as non-root
- **Minimal base**: Alpine Linux base image
- **Security scanning**: Trivy vulnerability scanner

## 🐛 Troubleshooting

### Common Issues

**Container nicht erreichbar:**
```bash
docker ps  # Check if container is running
docker logs opencode-multiuser  # Check logs
```

**Services starten nicht:**
```bash
# Check service logs
docker exec opencode-multiuser ps aux
```

**API Errors:**
```bash
# Test endpoints individually
curl -v http://localhost:8090/test
curl -v http://localhost:3001/health
```

### Debug Commands
```bash
# Execute shell in container
docker exec -it opencode-multiuser /bin/bash

# Check OpenCode installation
docker exec opencode-multiuser opencode --version

# Check PocketBase status
docker exec opencode-multiuser ./pocketbase --version
```

## 📈 Scaling

### Horizontal Scaling
- Multiple container instances
- Load balancer configuration
- Shared database volume

### Vertical Scaling
- Increase container resources
- Optimize OpenCode processes
- Database performance tuning

## 🎉 Successful Deployment

Das OpenCode Multiuser System ist erfolgreich deployed und produktionsbereit!

**Nächste Schritte:**
1. Öffne `http://your-domain:8090/_/debug.html`
2. Login mit `test@test.com` / `test123456`
3. Teste einen OpenCode Prompt
4. Verwalte User und API Keys im Admin Interface

**System ist bereit für den produktiven Einsatz!** 🚀