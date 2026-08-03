FROM php:8.2-fpm-alpine

# Gerekli PHP extension'ları ve Nginx/Supervisor kurulumu
RUN apk add --no-grad \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl

RUN docker-php-ext-install pdo_mysql mbstring zip gd pcntl bcmath

WORKDIR /var/www/html

# Composer kurulumu
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Backend kodlarını kopyala ve composer install
COPY ./backend /var/www/html
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Frontend kopyala ve build al
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend .
RUN npm run build

# Build edilen HTML'i Nginx web dizinine taşı
RUN cp -r /app/dist/* /var/www/html/public/

# İzinler
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Entrypoint
COPY ./backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

CMD ["/usr/local/bin/docker-entrypoint.sh"]
