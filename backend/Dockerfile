FROM php:8.2-fpm

# Çalışma dizini
WORKDIR /var/www/html

# Gerekli sistem paketleri ve PHP eklentileri
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    libzip-dev

RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath gd

# Composer Kurulumu
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Proje dosyalarını kopyala
COPY . /var/www/html

# Bağımlılıkları yükle (Platform gereksinimlerini ve root uyarısını yoksay)
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# İzinleri ayarla
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Entrypoint script kopyala ve izin ver
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
