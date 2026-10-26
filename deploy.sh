#!/bin/bash
# Azure App Service custom deployment script for NEXUS L&D
set -euo pipefail

echo "=== NEXUS L&D Azure Deployment ==="

DEPLOYMENT_SOURCE="${DEPLOYMENT_SOURCE:-.}"
DEPLOYMENT_TARGET="${DEPLOYMENT_TARGET:-/home/site/wwwroot}"

echo ">> Installing production dependencies..."
cd "$DEPLOYMENT_SOURCE"
npm install --omit=dev

echo ">> Building frontend (Vite + TypeScript)..."
npm run build

echo ">> Syncing to deployment target: $DEPLOYMENT_TARGET"
mkdir -p "$DEPLOYMENT_TARGET"

# Copy server, built frontend, and config files
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='src' \
  --exclude='.env' \
  --exclude='*.sqlite' \
  "$DEPLOYMENT_SOURCE/" "$DEPLOYMENT_TARGET/"

# Install production dependencies in the deployment target
cd "$DEPLOYMENT_TARGET"
npm install --omit=dev

echo ">> Ensuring persistent data directory exists..."
mkdir -p /home/data

echo "=== Deployment complete ==="
