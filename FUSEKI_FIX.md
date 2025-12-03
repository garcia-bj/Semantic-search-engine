# 🔧 Solución: Error al Subir Archivos OWL/RDF

## ❌ Error Actual

```
Failed to save document: Failed to upload triples to Fuseki: 
Failed to upload RDF data: Request failed with status code 405
```

## 🎯 Causa

El dataset "semantic" no existe en Fuseki. Necesitas crearlo primero.

## ✅ Solución

### Opción 1: Ejecutar Script (Más Fácil)

```bash
# En la raíz del proyecto
.\create-fuseki-dataset.bat
```

### Opción 2: Crear Manualmente desde Fuseki UI

1. Abrir: http://localhost:3030
2. Click en "manage datasets"
3. Click en "add new dataset"
4. Nombre: `semantic`
5. Tipo: `Persistent (TDB2)`
6. Click "create dataset"

### Opción 3: Comando Manual

```bash
curl -X POST "http://localhost:3030/$/datasets" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "dbName=semantic&dbType=tdb2"
```

## 🧪 Verificar

Después de crear el dataset:

1. Ir a http://localhost:3030
2. Deberías ver el dataset "semantic" en la lista
3. Intentar subir un archivo OWL/RDF desde la app
4. Debería funcionar sin errores

## 📝 Nota

Este paso solo se hace **UNA VEZ**. Una vez creado el dataset, persistirá en el volumen de Docker.

---

## 🔄 Si Sigues Teniendo Problemas

### Verificar que Fuseki está corriendo

```bash
docker-compose -f docker-compose.dev.yml ps
```

Fuseki debe mostrar "Up".

### Ver logs de Fuseki

```bash
docker-compose -f docker-compose.dev.yml logs -f fuseki
```

### Reiniciar Fuseki

```bash
docker-compose -f docker-compose.dev.yml restart fuseki
```

---

## ✨ Después de Crear el Dataset

La app debería funcionar normalmente:
1. Subir archivos OWL/RDF ✅
2. Buscar en la base de conocimiento ✅
3. Ver resultados ✅
