import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useCallback } from "react";
import { AttachAddon } from "@xterm/addon-attach";
import { useTerminalSocketStore } from "../../../store/terminalSocketStore";

export const BrowserTerminal = () => {
    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);
    const fitAddonRef = useRef(null);
    const attachAddonRef = useRef(null);

    const { terminalSocket } = useTerminalSocketStore();

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
        term.writeln("\x1b[1;34m╔══════════════════════════════════════════╗\x1b[0m");
        term.writeln("\x1b[1;34m║\x1b[0m  \x1b[1;36m⚛️  ReactForge Terminal\x1b[0m                 \x1b[1;34m║\x1b[0m");
        term.writeln("\x1b[1;34m╚══════════════════════════════════════════╝\x1b[0m");
        term.writeln("");
        term.writeln("\x1b[90mConnecting to sandbox...\x1b[0m");

        return () => {
            clearTimeout(fitTimeout);
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
            term.writeln("\x1b[32m✓ Connected to sandbox!\x1b[0m");
            term.writeln("");

            // Attach WebSocket
            if (!attachAddonRef.current) {
                const attachAddon = new AttachAddon(terminalSocket);
                attachAddonRef.current = attachAddon;
                term.loadAddon(attachAddon);
            }

            // Fit after connection
            setTimeout(fitTerminal, 50);
        };

        const handleClose = () => {
            term.writeln("");
            term.writeln("\x1b[31m✗ Disconnected from sandbox\x1b[0m");
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
    }, [terminalSocket, fitTerminal]);

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