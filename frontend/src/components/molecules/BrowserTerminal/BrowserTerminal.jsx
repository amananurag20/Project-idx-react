import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useCallback } from "react";
import { AttachAddon } from "@xterm/addon-attach";
import { useTerminalSocketStore } from "../../../store/terminalSocketStore";
import { useParams } from "react-router-dom";

export const BrowserTerminal = () => {
    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);
    const fitAddonRef = useRef(null);
    const attachAddonRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const { terminalSocket, setTerminalSocket } = useTerminalSocketStore();
    const { projectId } = useParams();

    // Fit terminal to container
    const fitTerminal = useCallback(() => {
        if (fitAddonRef.current && terminalInstance.current) {
            try {
                fitAddonRef.current.fit();
            } catch (e) {
                // Ignore fit errors
            }
        }
    }, []);

    // Reconnect to WebSocket
    const reconnect = useCallback(() => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            terminalInstance.current?.writeln(
                "\x1b[31m✗ Max reconnection attempts reached. Please refresh the page.\x1b[0m"
            );
            return;
        }

        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

        terminalInstance.current?.writeln(
            `\x1b[33m⟳ Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})\x1b[0m`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
            if (projectId) {
                try {
                    const ws = new WebSocket(
                        `${import.meta.env.VITE_TERMINAL_WS_URL || "ws://localhost:4000"}/terminal?projectId=${projectId}`
                    );
                    setTerminalSocket(ws);
                } catch (error) {
                    console.error("Reconnection failed:", error);
                    reconnect();
                }
            }
        }, delay);
    }, [projectId, setTerminalSocket]);

    // Initialize terminal
    useEffect(() => {
        if (terminalInstance.current || !terminalRef.current) {
            return;
        }

        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: "bar",
            theme: {
                background: "#1a1b26",
                foreground: "#c0caf5",
                cursor: "#c0caf5",
                cursorAccent: "#1a1b26",
                selectionBackground: "#33467c",
                black: "#15161e",
                red: "#f7768e",
                green: "#9ece6a",
                yellow: "#e0af68",
                blue: "#7aa2f7",
                magenta: "#bb9af7",
                cyan: "#7dcfff",
                white: "#a9b1d6",
                brightBlack: "#414868",
                brightRed: "#f7768e",
                brightGreen: "#9ece6a",
                brightYellow: "#e0af68",
                brightBlue: "#7aa2f7",
                brightMagenta: "#bb9af7",
                brightCyan: "#7dcfff",
                brightWhite: "#c0caf5",
            },
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontWeight: "400",
            lineHeight: 1.2,
            letterSpacing: 0,
            convertEol: true,
            scrollback: 10000,
            allowTransparency: true,
            scrollOnUserInput: true,
        });

        terminalInstance.current = term;

        // Open terminal
        term.open(terminalRef.current);

        // Setup fit addon
        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);

        // Initial fit with delay
        const fitTimeout = setTimeout(() => {
            fitTerminal();
        }, 100);

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(fitTerminal);
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // Window resize handler
        const handleResize = () => {
            requestAnimationFrame(fitTerminal);
        };
        window.addEventListener("resize", handleResize);

        // Welcome message
        term.writeln(
            "\x1b[1;34m╔══════════════════════════════════════════╗\x1b[0m"
        );
        term.writeln(
            "\x1b[1;34m║\x1b[0m  \x1b[1;36m⚛️  ReactForge Terminal\x1b[0m                 \x1b[1;34m║\x1b[0m"
        );
        term.writeln(
            "\x1b[1;34m╚══════════════════════════════════════════╝\x1b[0m"
        );
        term.writeln("");
        term.writeln("\x1b[90mConnecting to sandbox...\x1b[0m");

        return () => {
            clearTimeout(fitTimeout);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            window.removeEventListener("resize", handleResize);
            resizeObserver.disconnect();
            term.dispose();
            terminalInstance.current = null;
            fitAddonRef.current = null;
        };
    }, [fitTerminal]);

    // Attach WebSocket
    useEffect(() => {
        if (!terminalSocket || !terminalInstance.current) {
            return;
        }

        const term = terminalInstance.current;

        const handleOpen = () => {
            reconnectAttempts.current = 0; // Reset attempts on successful connection
            term.writeln("\x1b[32m✓ Connected to sandbox!\x1b[0m");
            term.writeln("");

            // Dispose old attach addon if exists
            if (attachAddonRef.current) {
                try {
                    attachAddonRef.current.dispose();
                } catch (e) {
                    // Ignore
                }
            }

            // Attach WebSocket
            const attachAddon = new AttachAddon(terminalSocket);
            attachAddonRef.current = attachAddon;
            term.loadAddon(attachAddon);

            // Fit after connection
            setTimeout(fitTerminal, 50);
        };

        const handleClose = () => {
            term.writeln("");
            term.writeln("\x1b[31m✗ Disconnected from sandbox\x1b[0m");

            // Auto-reconnect
            reconnect();
        };

        const handleError = (error) => {
            term.writeln("");
            term.writeln("\x1b[31m✗ Connection error\x1b[0m");
            console.error("WebSocket error:", error);
        };

        if (terminalSocket.readyState === WebSocket.OPEN) {
            handleOpen();
        } else if (terminalSocket.readyState === WebSocket.CONNECTING) {
            terminalSocket.addEventListener("open", handleOpen);
        }

        terminalSocket.addEventListener("close", handleClose);
        terminalSocket.addEventListener("error", handleError);

        return () => {
            terminalSocket.removeEventListener("open", handleOpen);
            terminalSocket.removeEventListener("close", handleClose);
            terminalSocket.removeEventListener("error", handleError);
        };
    }, [terminalSocket, fitTerminal, reconnect]);

    return (
        <div
            ref={terminalRef}
            className="w-full h-full bg-[#1a1b26] p-2"
            style={{
                minHeight: "150px",
            }}
        />
    );
};