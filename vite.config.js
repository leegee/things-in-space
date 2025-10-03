import fs from 'node:fs';
import os from 'node:os';
import express from 'express';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';
import tsconfigPaths from "vite-tsconfig-paths";
const port = 5173;

// Get first non-loopback IPv4 address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        const iface = interfaces[name];
        for (const i of iface) {
            if (i.family === 'IPv4' && i.address !== '127.0.0.1') {
                return i.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

export default defineConfig({
    server: {
        port,
        host: '0.0.0.0', // Bind all interfaces so network access works
        https: fs.existsSync('./certs/local.pem') && fs.existsSync('./certs/local-key.pem') ? {
            key: fs.readFileSync('./certs/local-key.pem'),
            cert: fs.readFileSync('./certs/local.pem'),
        } : undefined,
    },
    plugins: [
        tsconfigPaths(),

        // Express API plugin
        {
            name: 'express-api-plugin',
            configureServer(viteServer) {
                const apiApp = express();
                apiApp.use(express.json());

                apiApp.put('/api/log', (req, res) => {
                    console.log('log:', req.body);
                    res.json({ ok: true });
                });

                apiApp.post('/api/record-location', (req, res) => {
                    console.log('Location received:', req.body);
                    res.json({ ok: true, ...req.body });
                });

                viteServer.middlewares.use('/api', apiApp);
            },
        },

        // QR code plugin
        qrcode({
            // Optional: specify custom URLs to include both localhost and network IP
            getUrl: (config) => {
                const protocol = config.server.https ? 'https' : 'http';
                const urls = [
                    `${protocol}://localhost:${config.server.port}`,
                    `${protocol}://${localIP}:${config.server.port}`,
                ];
                return urls;
            },
        }),
    ],
});
