#!/bin/bash
# fix_python.sh
echo "--- Installing System Dependencies ---"
# Critical for 'soundfile' library
sudo apt-get update
sudo apt-get install -y libsndfile1 python3-pip

echo "--- Installing Python Libraries ---"
# Install required packages
# Using --break-system-packages is needed for newer Debian/Ubuntu if not using venv
# We try both ways to be safe
pip3 install -r backend-python/requirements.txt --break-system-packages || pip3 install -r backend-python/requirements.txt

echo "--- Restarting Python API ---"
pm2 restart python-api
pm2 logs python-api --lines 20 --nostream
