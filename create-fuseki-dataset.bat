@echo off
echo Creating Fuseki dataset 'semantic'...

curl -X POST "http://localhost:3030/$/datasets" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "dbName=semantic&dbType=tdb2"

echo.
echo Dataset created successfully!
echo You can now upload OWL/RDF files.
pause
