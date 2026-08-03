#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Generating APP_KEY if missing..."
php artisan key:generate --force || true

echo "Running migrations..."
php artisan migrate --force || true

echo "Running seeders..."
php artisan db:seed --force || true

echo "Linking storage..."
php artisan storage:link --force || true

echo "Caching config & routes..."
php artisan config:cache || true
php artisan route:cache || true

echo "Starting Apache Web Server..."
exec apache2-foreground
