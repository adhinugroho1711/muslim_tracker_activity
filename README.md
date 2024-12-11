# Islamic Daily Activities Tracker

A web application to help track daily Islamic activities, designed for both mobile and desktop use. The application allows users to track their daily religious activities and maintain consistency in their practice.

## Features

- 📱 **Responsive Design**: Mobile and desktop friendly interface
- 🔐 **User Management**: Secure authentication with role-based access (Admin/User)
- ✅ **Activity Tracking**: Daily activity logging with streak tracking
- 📊 **Analytics**: View progress with daily/weekly/monthly/yearly statistics

## Tech Stack

- **Backend**: Python Flask, PostgreSQL, SQLAlchemy
- **Frontend**: Bootstrap 5, Vanilla JS, Chart.js
- **Server**: Nginx, Gunicorn

## Local Development Setup

1. **Prerequisites**
   - Python 3.8+
   - PostgreSQL 12+
   - pip (Python package manager)

2. **Installation**
   ```bash
   # Clone repository
   git clone https://github.com/adhinugroho1711/muslim_tracker_activity.git
   cd muslim_tracker_activity

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Setup environment
   cp .env.example .env
   # Edit .env with your database settings
   ```

3. **Run Application**
   ```bash
   # Initialize database
   python reset_db.py

   # Start development server
   python app.py
   ```

## Production Deployment

1. **Server Requirements**
   - Ubuntu/Debian server
   - Python 3.8+
   - PostgreSQL 12+
   - Nginx
   - Gunicorn

2. **Setup Steps**
   ```bash
   # Install system dependencies
   sudo apt update
   sudo apt install python3-venv python3-pip postgresql nginx

   # Clone and setup application
   cd /var/www
   git clone https://github.com/adhinugroho1711/muslim_tracker_activity.git
   cd muslim_tracker_activity

   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Configure environment
   cp .env.example .env
   # Update .env with production settings
   ```

3. **Configure Services**

### 1. Set up Gunicorn Service

Create and configure the systemd service file for Gunicorn:

```bash
# Create service file
sudo nano /etc/systemd/system/tracker_muslim.service
```

Add the following content:

```ini
[Unit]
Description=Gunicorn instance to serve Muslim Tracker application
After=network.target

[Service]
User=your_username
Group=www-data
WorkingDirectory=/var/www/tracker_muslim
Environment="PATH=/var/www/tracker_muslim/venv/bin"
ExecStart=/var/www/tracker_muslim/venv/bin/gunicorn \
    --workers 2 \
    --threads 2 \
    --worker-class=gthread \
    --worker-tmp-dir=/dev/shm \
    --timeout 30 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --bind unix:/var/www/tracker_muslim/run/tracker_muslim.sock \
    -m 007 \
    app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable tracker_muslim
sudo systemctl start tracker_muslim
```

### 2. Configure Nginx as Reverse Proxy

Create Nginx configuration:

```bash
# Create Nginx config
sudo nano /etc/nginx/nginx.conf
```

Add the following configuration:

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Logging Settings
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Settings
    gzip on;

    server {
        listen 80;
        server_name your_server_ip;

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        location / {
            include proxy_params;
            proxy_pass http://unix:/var/www/tracker_muslim/run/tracker_muslim.sock;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### 3. Set Up Socket Directory

Create and configure the socket directory:

```bash
# Create socket directory
sudo mkdir -p /var/www/tracker_muslim/run
sudo chown -R your_username:www-data /var/www/tracker_muslim/run
sudo chmod 775 /var/www/tracker_muslim/run
```

### 4. Enable and Start Services

```bash
# Test Nginx configuration
sudo nginx -t

# Enable services to start on boot
sudo systemctl enable nginx
sudo systemctl enable tracker_muslim

# Start/restart services
sudo systemctl restart tracker_muslim
sudo systemctl restart nginx

# Verify services are running
sudo systemctl status tracker_muslim
sudo systemctl status nginx
```

### 5. Troubleshooting

If you encounter issues:

```bash
# Check Gunicorn logs
sudo journalctl -u tracker_muslim -n 50

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check permissions
ls -la /var/www/tracker_muslim/run/

# Verify socket file exists and has correct permissions
ls -la /var/www/tracker_muslim/run/tracker_muslim.sock
```

Common issues and solutions:
- Permission denied: Check user/group ownership and file permissions
- Socket not found: Verify Gunicorn service is running and creating the socket
- 502 Bad Gateway: Check Gunicorn logs for application errors

## Maintenance

Common maintenance commands:
```bash
# Check service status
sudo systemctl status tracker_muslim
sudo systemctl status nginx

# View logs
sudo journalctl -u tracker_muslim
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart tracker_muslim nginx
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
