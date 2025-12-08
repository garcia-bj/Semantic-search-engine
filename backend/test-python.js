const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testPython() {
    try {
        console.log('Test 1: Checking Python version...');
        const { stdout: version } = await execPromise('python --version');
        console.log('✓ Python version:', version.trim());

        console.log('\nTest 2: Getting Python executable path...');
        const { stdout: exePath } = await execPromise('python -c "import sys; print(sys.executable)"');
        console.log('✓ Python executable:', exePath.trim());

        console.log('\nTest 3: Checking if owlready2 is installed...');
        const { stdout: owlready2Path } = await execPromise('python -c "import owlready2; print(owlready2.__file__)"');
        console.log('✓ owlready2 found at:', owlready2Path.trim());

        console.log('\n✅ All tests passed! Python and owlready2 are accessible from Node.js');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stderr:', error.stderr);
    }
}

testPython();
