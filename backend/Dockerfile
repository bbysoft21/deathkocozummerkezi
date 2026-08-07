FROM php:8.2-apache

# ModRewrite Aktifleştir
RUN a2enmod rewrite

# Gerekli paketler ve PHP extension'ları
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    libzip-dev

RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath gd

# Apache DocumentRoot Ayarı (/var/www/html/public)
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN echo "upload_max_filesize = 25M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size = 25M" >> /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/html

# Composer Kurulumu
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Proje dosyalarını kopyala
COPY . /var/www/html

# Bağımlılıkları yükle
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# İzinleri ayarla
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Entrypoint script kopyala ve izin ver
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
