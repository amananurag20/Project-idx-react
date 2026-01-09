import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const TERMINAL_PORT = process.env.TERMINAL_PORT || 4000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

export const REACT_PROJECT_COMMAND = process.env.REACT_PROJECT_COMMAND || "npm create vite@latest . -- --template react";