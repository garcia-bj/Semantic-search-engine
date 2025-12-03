#!/bin/bash

# ============================================
# Script de Despliegue Rápido para Producción
# ============================================

set -e  # Detener en caso de error

echo "🚀 Iniciando despliegue del Buscador Semántico..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor instala Docker primero.${NC}"
    echo "Visita: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker está instalado${NC}"

# Verificar archivo .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No se encontró backend/.env${NC}"
    echo "Creando desde .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Por favor edita backend/.env con tus valores de producción${NC}"
    read -p "Presiona Enter cuando hayas configurado el archivo .env..."
fi

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Construir imágenes
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache backend

# Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

# Verificar estado de los servicios
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

# Mostrar logs del backend
echo ""
echo "📝 Logs del backend (últimas 20 líneas):"
docker-compose logs --tail=20 backend

echo ""
echo -e "${GREEN}✅ Despliegue completado!${NC}"
echo ""
echo "🌐 Servicios disponibles en:"
echo "   - Backend:        http://localhost:3001"
echo "   - PostgreSQL:     localhost:5433"
echo "   - Fuseki:         http://localhost:3030"
echo "   - Elasticsearch:  http://localhost:9200"
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs:           docker-compose logs -f backend"
echo "   - Reiniciar backend:  docker-compose restart backend"
echo "   - Detener todo:       docker-compose down"
echo "   - Ver estado:         docker-compose ps"
echo ""
echo "🔍 Para verificar que Python está disponible:"
echo "   docker exec semantic_backend python3 --version"
echo "   docker exec semantic_backend pip3 list | grep owlready2"
