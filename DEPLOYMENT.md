# Guía de Deployment - Semantic Search Engine

## 🚀 Deployment con Docker Compose

### Prerequisitos
- Docker y Docker Compose instalados
- Git
- Mínimo 4GB RAM disponible

### Paso 1: Configuración

1. **Clonar el repositorio**:
```bash
git clone <your-repo-url>
cd BUSCADOR_SEMANTICO
```

2. **Configurar variables de entorno**:
```bash
# Copiar template de producción
cp .env.production .env

# Editar .env y cambiar las contraseñas
nano .env
```

**Variables importantes a cambiar**:
- `POSTGRES_PASSWORD`: Contraseña segura para PostgreSQL
- `FUSEKI_PASSWORD`: Contraseña para Apache Fuseki
- `CORS_ORIGIN`: URL de tu frontend en producción
- `NEXT_PUBLIC_API_URL`: URL de tu backend en producción

### Paso 2: Deploy

**Opción A: Script automático** (Linux/Mac):
```bash
chmod +x deploy.sh
./deploy.sh prod
```

**Opción B: Manual**:
```bash
# Construir y levantar servicios
docker-compose up -d --build

# Esperar a que PostgreSQL esté listo
docker-compose exec postgres pg_isready -U postgres

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Verificar estado
docker-compose ps
```

### Paso 3: Verificar

Servicios disponibles en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **Fuseki**: http://localhost:3030
- **Elasticsearch**: http://localhost:9200

### Comandos Útiles

```bash
# Ver logs
docker-compose logs -f [service-name]

# Reiniciar un servicio
docker-compose restart [service-name]

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Ver estado de servicios
docker-compose ps

# Ejecutar comando en contenedor
docker-compose exec backend [command]
```

---

## 🌐 Deployment en Producción (VPS/Cloud)

### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
```

### 2. Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/semantic-search
```

**Contenido de configuración**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/semantic-search /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d yourdomain.com

# Auto-renovación (ya configurado)
sudo certbot renew --dry-run
```

### 5. Actualizar .env para Producción

```bash
# En el servidor
cd /path/to/BUSCADOR_SEMANTICO
nano .env
```

Actualizar:
```env
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 6. Deploy

```bash
# Clonar repositorio
git clone <your-repo-url>
cd BUSCADOR_SEMANTICO

# Configurar .env
cp .env.production .env
nano .env

# Deploy
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs -f
```

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Uso de Recursos
```bash
# Ver uso de CPU/RAM
docker stats

# Ver espacio en disco
docker system df
```

### Health Checks
```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# Elasticsearch
curl http://localhost:9200/_cluster/health

# Fuseki
curl http://localhost:3030/$/ping
```

---

## 🔄 Actualización

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir y levantar
docker-compose up -d --build

# Ejecutar migraciones si hay cambios en DB
docker-compose exec backend npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Servicio no inicia
```bash
# Ver logs del servicio
docker-compose logs [service-name]

# Reiniciar servicio específico
docker-compose restart [service-name]
```

### Base de datos corrupta
```bash
# Backup primero!
docker-compose exec postgres pg_dump -U postgres semantic_search > backup.sql

# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### Limpiar espacio
```bash
# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa
docker system prune -a --volumes
```

---

## 📦 Backup

### Backup Automático

Crear script `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U postgres semantic_search > $BACKUP_DIR/db_$DATE.sql

# Backup Fuseki
docker cp semantic-search-fuseki:/fuseki $BACKUP_DIR/fuseki_$DATE

# Comprimir
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/db_$DATE.sql $BACKUP_DIR/fuseki_$DATE

# Limpiar archivos temporales
rm $BACKUP_DIR/db_$DATE.sql
rm -rf $BACKUP_DIR/fuseki_$DATE

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

Agregar a crontab:
```bash
# Backup diario a las 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 🔒 Seguridad

1. **Cambiar contraseñas por defecto** en `.env`
2. **Usar HTTPS** en producción (Let's Encrypt)
3. **Configurar firewall** (UFW)
4. **Actualizar regularmente** Docker images
5. **Limitar acceso** a puertos de servicios internos
6. **Backups regulares** de base de datos

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica health checks
3. Consulta la documentación de cada servicio
