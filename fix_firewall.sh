#!/bin/bash
# fix_firewall.sh
# Configures UFW firewall to allow essential ports

echo "Configuring Firewall..."

# Force reset to ensure clean state (optional, but safer to just allow)
# sudo ufw reset

# Allow essential ports
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# Reload firewall to apply changes
sudo ufw reload
sudo ufw --force enable

echo "Firewall Configured!"
echo "Status:"
sudo ufw status verbose
