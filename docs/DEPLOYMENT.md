# Guía de Despliegue - MasterDash

Esta guía detalla los pasos para desplegar MasterDash en un entorno de producción utilizando Docker sobre Linux.

## 1. Requisitos Previos

- Docker y Docker Compose instalados en el servidor Linux.
- Acceso a la base de datos SQL Server (App) y SQL Server (DataWarehouse).
- Archivo `.env` configurado con las credenciales de producción.

## 2. Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente formato:

```env
# App Database (SQL Server Express o Prod)
DATABASE_URL="sqlserver://host:port;database=MasterDash;user=user;password=pass;encrypt=true;trustServerCertificate=true"

# DataWarehouse (Staging/Prod)
DW_DATABASE_URL="sqlserver://10.50.80.10:1433;database=Staging;user=user;password=pass;encrypt=true;trustServerCertificate=true"

# Auth.js
AUTH_SECRET="generar-con-openssl-rand-hex-32"
NEXTAUTH_URL="https://midominio.com"
```

## 3. Despliegue con Docker Compose

El despliegue se realiza mediante el archivo `docker-compose.yml` que ya está optimizado para producción.

### Pasos para el Deploy:

1. **Subir archivos al servidor:**
   ```bash
   scp -r . user@server:/path/to/masterdash
   ```

2. **Construir y levantar contenedores:**
   ```bash
   docker-compose up -d --build
   ```

3. **Verificar logs:**
   ```bash
   docker-compose logs -f masterdash
   ```

## 4. Optimizaciones de Producción

### Standalone Build
El `Dockerfile` utiliza la salida `standalone` de Next.js, lo que reduce el tamaño de la imagen de ~1GB a ~200MB al incluir solo lo estrictamente necesario para ejecutar la app.

### Reverse Proxy (Nginx)
Se recomienda usar Nginx como reverse proxy para manejar SSL (HTTPS) y balanceo de carga. Ejemplo de configuración base:

```nginx
server {
    listen 80;
    server_name midominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. Mantenimiento

- **Actualizar App:**
  ```bash
  git pull
  docker-compose up -d --build
  ```
- **Prisma Migrations:**
  Si hay cambios en el schema de la base de datos de la app, ejecutarlos antes del build o mediante un contenedor temporal.
