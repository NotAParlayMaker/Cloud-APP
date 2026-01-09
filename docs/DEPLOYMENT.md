# Deployment Guide

This guide covers various deployment options for OpenSportsAnalytics.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 16+
- Node.js 20+ (for non-Docker deployments)
- Domain name (optional, for production)

## Docker Deployment (Recommended)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/opensportsanalytics.git
cd opensportsanalytics

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Initialize database
docker-compose exec backend node -e "require('./dist/config/database').initializeDatabase()"

# Access application
# Frontend: http://localhost
# Backend: http://localhost:3001
```

### Production Deployment

1. Update `.env` with production values:
```bash
DB_PASSWORD=strong_production_password
JWT_SECRET=long_random_secret_key
```

2. Use production Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Set up SSL with Let's Encrypt (optional):
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

## Cloud Platform Deployments

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker opensportsanalytics

# Create environment
eb create opensportsanalytics-prod

# Deploy
eb deploy

# Configure environment variables
eb setenv DB_PASSWORD=xxx JWT_SECRET=xxx
```

### Google Cloud Platform

```bash
# Build and push images
gcloud builds submit --tag gcr.io/PROJECT_ID/opensports-backend backend/
gcloud builds submit --tag gcr.io/PROJECT_ID/opensports-frontend frontend/

# Deploy to Cloud Run
gcloud run deploy opensports-backend --image gcr.io/PROJECT_ID/opensports-backend
gcloud run deploy opensports-frontend --image gcr.io/PROJECT_ID/opensports-frontend
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create opensportsanalytics

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# Configure environment
heroku config:set JWT_SECRET=xxx
```

### Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
1. Import repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`

**Backend on Railway:**
1. Import repository to Railway
2. Set root directory to `backend`
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy

## Manual Deployment

### Ubuntu Server

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql nginx

# Clone repository
git clone https://github.com/yourusername/opensportsanalytics.git
cd opensportsanalytics

# Install and build
npm install
npm run build

# Set up PostgreSQL
sudo -u postgres psql
CREATE DATABASE opensportsanalytics;
CREATE USER opensports WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE opensportsanalytics TO opensports;
\q

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env

# Start backend with PM2
npm install -g pm2
cd backend
pm2 start dist/server.js --name opensports-backend

# Build frontend
cd ../frontend
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/opensportsanalytics
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/opensportsanalytics/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/opensportsanalytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Database Backups

### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres opensportsanalytics > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker-compose exec postgres pg_isready
```

### Logging

```bash
# View all logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Tail logs
docker-compose logs -f --tail=100
```

## Scaling

### Horizontal Scaling

Use Docker Swarm or Kubernetes for multiple instances:

```bash
# Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml opensports

# Scale backend
docker service scale opensports_backend=3
```

### Vertical Scaling

Update `docker-compose.yml`:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets
- [ ] Enable CORS restrictions

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d opensportsanalytics
```

### Port Conflicts
```bash
# Check what's using ports
sudo lsof -i :3001
sudo lsof -i :80

# Kill process
sudo kill -9 PID
```

### Build Failures
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Performance Optimization

- Enable Nginx gzip compression
- Use CDN for static assets
- Enable database query caching
- Optimize images
- Use Redis for session storage
- Enable HTTP/2

## Support

For deployment issues, open an issue on GitHub or check existing documentation.
