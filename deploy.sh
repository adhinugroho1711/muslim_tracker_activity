#!/bin/bash

# Update system and clean up
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
sudo apt clean

# Install required packages
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib

# Configure PostgreSQL for low memory
sudo cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.backup
sudo bash -c 'cat > /etc/postgresql/14/main/conf.d/custom-config.conf << EOL
# Memory Configuration
shared_buffers = 128MB
work_mem = 4MB
maintenance_work_mem = 32MB
effective_cache_size = 256MB

# Checkpoint Configuration
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 80MB

# Connection Configuration
max_connections = 20
EOL'

# Create application directory
sudo mkdir -p /var/www/tracker_muslim
sudo chown adhinugroho:adhinugroho /var/www/tracker_muslim

# Clone repository
cd /var/www/tracker_muslim
git clone https://github.com/adhinugroho1711/muslim_tracker_activity.git .

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt
pip install --no-cache-dir gunicorn

# Set up PostgreSQL
sudo -u postgres psql -c "CREATE USER tracker_muslim WITH PASSWORD '\$n9q%B>C';"
sudo -u postgres psql -c "CREATE DATABASE tracker_muslim;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tracker_muslim TO tracker_muslim;"

# Create and configure .env file
sudo bash -c 'cat > /var/www/tracker_muslim/.env << EOL
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=mpzb-tzzq-zkzb-tzzw-zgtz

# Database configuration
DB_USER=tracker_muslim
DB_PASSWORD=\$n9q%B>C
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracker_muslim

# Full database URL
DATABASE_URL=postgresql://tracker_muslim:\$n9q%B>C@localhost:5432/tracker_muslim
SSL_MODE=allow
EOL'

# Initialize database
source venv/bin/activate
python reset_db.py

# Set up Nginx
sudo mv /home/adhinugroho/nginx_config /etc/nginx/nginx.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Set up systemd service
sudo mv /home/adhinugroho/tracker_muslim.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tracker_muslim

# Configure permissions
sudo chown -R adhinugroho:www-data /var/www/tracker_muslim
sudo chmod -R 755 /var/www/tracker_muslim

# Create swap file if not exists
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Start services
sudo systemctl start postgresql
sudo systemctl start tracker_muslim
sudo systemctl start nginx

# Show status
echo "Checking PostgreSQL status..."
sudo systemctl status postgresql
echo "Checking application status..."
sudo systemctl status tracker_muslim
echo "Checking Nginx status..."
sudo systemctl status nginx

echo "Deployment complete. Application should be accessible at http://103.127.136.79"
echo "Check logs with: sudo journalctl -u tracker_muslim"
