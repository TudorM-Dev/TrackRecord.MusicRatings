#!/bin/bash
set -e

# /home is the only directory App Service keeps between restarts.
mkdir -p /home/data

cd /home/site/wwwroot/server
npm run start
