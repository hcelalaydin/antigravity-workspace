import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const expressApp = express();
    const httpServer = createServer(expressApp);

    // Socket.io setup
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: dev ? '*' : false,
            methods: ['GET', 'POST'],
        },
    });

    // Make io available globally
    (global as any).io = io;

    // Socket.io connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });

        // TODO: Add game event handlers here
    });

    // Serve uploaded cards statically
    expressApp.use('/cards', express.static('public/cards'));

    // Let Next.js handle all other routes
    expressApp.all('*', (req, res) => {
        return handle(req, res);
    });

    httpServer.listen(port, () => {
        console.log(`
  🎴 DreamWeaver Server Started
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 http://${hostname}:${port}
  🔧 Mode: ${dev ? 'Development' : 'Production'}
  🎮 Socket.io: Ready
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    });
});
