# Stage 1: Build dependencies
FROM composer:latest AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --ignore-platform-reqs \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist

# Stage 2: Production runtime environment
FROM php:8.2-apache AS runner

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql gd zip

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set Apache document root to Laravel public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Copy application source code
COPY . .

# Copy installed vendor dependencies
COPY --from=vendor /app/vendor /var/www/html/vendor

# Set up bootstrap/cache and storage permissions
RUN mkdir -p storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/app/public/zips \
    storage/app/zips_temp \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

CMD ["apache2-foreground"]
