import fs from 'fs';
import os from 'os';
import express from 'express';
import { defineConfig } from 'vite';

const port = 5173;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        const interfaceDetails = interfaces[interfaceName];
        for (let i = 0; i < interfaceDetails.length; i++) {
            const { family, address } = interfaceDetails[i];
            if (family === 'IPv4' && address !== '127.0.0.1') {
                return address;  // Return first non-loopback IPv4 address
            }
        }
    }
    throw new Error('Could not determine local IP address.');
}

const localIP = getLocalIP();

export default defineConfig({
    server: {
        port: port,
        host: localIP,
        https: {
            key: fs.readFileSync('./certs/local-key.pem'),
            cert: fs.readFileSync('./certs/local.pem'),
        },
    },
    plugins: [
        {
            name: 'express-api-plugin',
            configureServer(viteServer) {
                const apiApp = createApi();
                // Attach the Express app to the Vite server instance correctly
                viteServer.middlewares.use('/api', apiApp);

                console.log(`Express API server is running at https://${localIP}:${port}`);
            }
        }
    ]
});

function createApi() {
    const app = express();
    app.use(express.json());
    app.put('/api/log', (req, res) => {
        console.log('log: ', JSON.stringify(req.body, null, 4));
        res.json({ ok: true });
    });
    app.post('/api/record-location', (req, res) => {
        const { latitude, longitude, accuracy } = req.body;
        console.log(`Received location: Latitude ${latitude}, Longitude ${longitude}, Accuracy: ${accuracy} meters`);
        res.json({ ok: true, message: 'Location recorded successfully', ...req.body });
    });
    return app;
}