import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { handleContainerCreate, listContainer } from './containers/handleContainerCreate.js';
import { WebSocketServer } from 'ws';
import { handleTerminalCreation } from './containers/handleTerminalCreation.js';


const app = express();
const server = createServer(app);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'terminal' });
});

server.listen(4000, () => {
    console.log(`Terminal server is running on port 4000`);
    console.log(process.cwd())
});

const webSocketForTerminal = new WebSocketServer({
    server,
    path: '/terminal'
});

webSocketForTerminal.on("connection", async (ws, req) => {
    console.log("WebSocket connection received");

    try {
        const url = new URL(req.url, 'ws://localhost:4000');
        const projectId = url.searchParams.get('projectId');

        if (!projectId) {
            console.error("No projectId provided");
            ws.close(1008, "ProjectId required");
            return;
        }

        console.log("Project id received after connection:", projectId);

        const container = await handleContainerCreate(projectId, webSocketForTerminal);

        if (!container) {
            console.error("Failed to create container");
            ws.send("Error: Failed to create Docker container. Make sure Docker is running.\r\n");
            return;
        }

        handleTerminalCreation(container, ws);

    } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.send(`Error: ${error.message}\r\n`);
    }
});

webSocketForTerminal.on("error", (error) => {
    console.error("WebSocket Server error:", error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
