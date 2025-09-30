
'use server';

// This file cannot be used in a client component.
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

// This is a hack to store the socket server in a global variable.
declare global {
  var io: SocketIOServer | undefined;
}

let io: SocketIOServer;

export async function initializeSocketIO(httpServer: HTTPServer) {
    if (global.io) {
        console.log('Socket.IO server is already running.');
        return global.io;
    }
    
    console.log("Initializing Socket.IO server...");
    io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
    });
    
    global.io = io;

    io.on('connection', (socket) => {
        console.log('A client connected with socket ID:', socket.id);
        socket.on('disconnect', () => {
            console.log('A client disconnected:', socket.id);
        });
    });

    console.log("Socket.IO server initialized and attached.");
    return io;
}

// Function to emit events from server-side code
export async function emitSocketEvent(event: string, data: any) {
  if (global.io) {
    global.io.emit(event, data);
  } else {
    // This warning is expected on the very first event before the server is fully ready.
    // It should not appear on subsequent events.
    console.warn('Socket.IO not initialized when trying to emit event. Event will be missed.');
  }
}
