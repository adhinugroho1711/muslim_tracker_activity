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
   - Set up Gunicorn service
   - Configure Nginx as reverse proxy
   - Enable and start services

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
