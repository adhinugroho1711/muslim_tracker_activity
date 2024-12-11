#!/bin/bash

# Set PostgreSQL passwords
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "ALTER USER tracker_muslim WITH PASSWORD '\$n9q%B>C';"

# Configure pg_hba.conf
sudo sed -i 's/peer/md5/g' /etc/postgresql/14/main/pg_hba.conf
sudo sed -i 's/scram-sha-256/md5/g' /etc/postgresql/14/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Initialize database
cd /var/www/tracker_muslim
source venv/bin/activate
python reset_db.py

# Restart the application
sudo systemctl restart tracker_muslim
