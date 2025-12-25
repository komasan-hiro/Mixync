#!/bin/bash
# restore_ssl.sh
# Automates SSL Certificate Generation and Nginx Configuration Restoration

echo "Starting SSL Restoration..."

# 1. Create SSL directory
sudo mkdir -p /etc/nginx/ssl
sudo chmod 700 /etc/nginx/ssl

# 2. Generate Self-Signed Certificate
echo "Generating Self-Signed Certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx.key \
  -out /etc/nginx/ssl/nginx.crt \
  -subj "/C=JP/ST=Tokyo/L=City/O=BioMixer/CN=210.131.211.133.nip.io"

# 3. Restore Nginx Config (Targeting 'biomixer' conf as per DEPLOY.md)
echo "Restoring Nginx Configuration..."
sudo bash -c 'cat > /etc/nginx/sites-available/biomixer <<EOF
server {
    listen 80;
    server_name 210.131.211.133.nip.io 210.131.211.133;
    
    # HTTP -> HTTPS Redirect
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name 210.131.211.133.nip.io 210.131.211.133;

    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

# Ensure proper symlink
sudo ln -sf /etc/nginx/sites-available/biomixer /etc/nginx/sites-enabled/
# Remove default to prevent conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Restart Nginx
echo "Restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

echo "SSL Restoration Completed! Access via https://210.131.211.133.nip.io"
