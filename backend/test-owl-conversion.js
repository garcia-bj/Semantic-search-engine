const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

async function testOWLConversion() {
    try {
        console.log('=== Simulando el proceso del backend ===\n');

        // Ruta al script de Python (igual que en el backend)
        const scriptPath = path.join(process.cwd(), 'scripts', 'convert_owl.py');
        console.log('1. Script path:', scriptPath);

        // Detectar la ruta de Python dinámicamente (igual que en el backend)
        let pythonPath = 'python';
        try {
            const { stdout: pythonExePath } = await execPromise('python -c "import sys; print(sys.executable)"');
            pythonPath = pythonExePath.trim();
            console.log('2. Using Python at:', pythonPath);
        } catch (err) {
            console.warn('Could not detect Python path, using default "python" command');
        }

        // Probar importar owlready2
        console.log('\n3. Testing owlready2 import...');
        const { stdout: testImport } = await execPromise(`"${pythonPath}" -c "from owlready2 import *; print('SUCCESS')"`);
        console.log('   Result:', testImport.trim());

        // Probar el script sin archivo (debería dar error de uso)
        console.log('\n4. Testing script execution (without file)...');
        try {
            await execPromise(`"${pythonPath}" "${scriptPath}"`);
        } catch (error) {
            console.log('   Expected error:', error.stderr.trim());
        }

        console.log('\n✅ Todo funciona correctamente desde Node.js!');
        console.log('\n📝 Comando que usaría el backend:');
        console.log(`   "${pythonPath}" "${scriptPath}" "<archivo.owl>"`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.stderr) {
            console.error('Stderr:', error.stderr);
        }
    }
}

testOWLConversion();
