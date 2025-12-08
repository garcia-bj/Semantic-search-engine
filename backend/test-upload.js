const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

async function testFileUpload() {
    const filePath = 'C:\\\\Users\\\\garci\\\\.gemini\\\\antigravity\\\\brain\\\\e7cc42a2-a665-4501-812d-12bf359abbc7\\\\test-ontology.owl';

    console.log('📤 Testing file upload to backend...\n');
    console.log('File:', filePath);
    console.log('Endpoint: http://localhost:3001/upload\n');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/upload',
        method: 'POST',
        headers: form.getHeaders()
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            console.log(`Status Code: ${res.statusCode}\n`);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Response:');
                try {
                    const json = JSON.parse(data);
                    console.log(JSON.stringify(json, null, 2));
                } catch (e) {
                    console.log(data);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error:', error.message);
            reject(error);
        });

        form.pipe(req);
    });
}

testFileUpload().catch(console.error);
