# ============================================
# Script de Despliegue Rápido para Producción (Windows)
# ============================================

Write-Host "🚀 Iniciando despliegue del Buscador Semántico..." -ForegroundColor Cyan

# Verificar que Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker está instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    Write-Host "Visita: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Verificar archivo .env
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  No se encontró backend\.env" -ForegroundColor Yellow
    Write-Host "Creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  Por favor edita backend\.env con tus valores de producción" -ForegroundColor Yellow
    Read-Host "Presiona Enter cuando hayas configurado el archivo .env"
}

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

# Construir imágenes
Write-Host "🔨 Construyendo imágenes Docker..." -ForegroundColor Cyan
docker-compose build --no-cache backend

# Levantar servicios
Write-Host "🚀 Levantando servicios..." -ForegroundColor Cyan
docker-compose up -d

# Esperar a que PostgreSQL esté listo
Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar estado de los servicios
Write-Host ""
Write-Host "📊 Estado de los servicios:" -ForegroundColor Cyan
docker-compose ps

# Mostrar logs del backend
Write-Host ""
Write-Host "📝 Logs del backend (últimas 20 líneas):" -ForegroundColor Cyan
docker-compose logs --tail=20 backend

Write-Host ""
Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Servicios disponibles en:" -ForegroundColor Cyan
Write-Host "   - Backend:        http://localhost:3001"
Write-Host "   - PostgreSQL:     localhost:5433"
Write-Host "   - Fuseki:         http://localhost:3030"
Write-Host "   - Elasticsearch:  http://localhost:9200"
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   - Ver logs:           docker-compose logs -f backend"
Write-Host "   - Reiniciar backend:  docker-compose restart backend"
Write-Host "   - Detener todo:       docker-compose down"
Write-Host "   - Ver estado:         docker-compose ps"
Write-Host ""
Write-Host "🔍 Para verificar que Python está disponible:" -ForegroundColor Cyan
Write-Host "   docker exec semantic_backend python3 --version"
Write-Host "   docker exec semantic_backend pip3 list | grep owlready2"
