#!/bin/sh

echo "Waiting for MySQL database connection..."
until php -r "try { new PDO('mysql:host='.getenv('DB_HOST').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); echo 'connected'; } catch (Exception \$e) { exit(1); }" > /dev/null 2>&1; do
    echo "MySQL is unavailable - sleeping 3s..."
    sleep 3
done

echo "MySQL is up and running!"

php artisan key:generate --force || true
php artisan migrate --force || true
php artisan db:seed --force || true
php artisan storage:link --force || true

echo "Starting Apache Web Server..."
exec apache2-foreground
