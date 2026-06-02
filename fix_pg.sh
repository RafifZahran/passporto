#!/bin/bash
# Add host-based authentication rule for Windows connections
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf > /dev/null
# Also set a password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
# Restart PostgreSQL
sudo service postgresql restart
echo "PostgreSQL configured and restarted"
