import { useEffect, useRef, useState } from "react";
import { useEditorSocketStore } from "../../../store/editorSocketStore";
import { usePortStore } from "../../../store/portStore";

export const Browser = ({ projectId }) => {
    const browserRef = useRef(null);
    const { port, setPort } = usePortStore();
    const { editorSocket } = useEditorSocketStore();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Listen for port success event
    useEffect(() => {
        if (!editorSocket) return;

        const handlePortSuccess = ({ port: receivedPort }) => {
            console.log("Received port:", receivedPort);
            if (receivedPort) {
                setPort(receivedPort);
                setUrl(`http://localhost:${receivedPort}`);
                setError(null);
            } else {
                setError("Port not available yet. Run 'npm run dev' in terminal first.");
            }
        };

        editorSocket.on("getPortSuccess", handlePortSuccess);

        return () => {
            editorSocket.off("getPortSuccess", handlePortSuccess);
        };
    }, [editorSocket, setPort]);

    // Request port when component mounts or when no port
    useEffect(() => {
        if (!port && editorSocket && projectId) {
            console.log("Requesting port for project:", projectId);
            editorSocket.emit("getPort", {
                containerName: projectId,
            });

            // Retry every 3 seconds if no port
            const retryInterval = setInterval(() => {
                if (!port) {
                    console.log("Retrying port request...");
                    editorSocket.emit("getPort", {
                        containerName: projectId,
                    });
                }
            }, 3000);

            return () => clearInterval(retryInterval);
        } else if (port) {
            setUrl(`http://localhost:${port}`);
        }
    }, [port, editorSocket, projectId]);

    const handleRefresh = () => {
        if (browserRef.current) {
            setIsLoading(true);
            browserRef.current.src = browserRef.current.src;
        }
    };

    const handleRetryPort = () => {
        setError(null);
        editorSocket?.emit("getPort", {
            containerName: projectId,
        });
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
    };

    if (!port) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#0f0f23] text-gray-400">
                <div className="flex flex-col items-center gap-4 p-6 max-w-md text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-white mb-2">
                            Starting Preview
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Run{" "}
                            <code className="bg-[#292e42] px-2 py-1 rounded text-blue-400">
                                npm run dev
                            </code>{" "}
                            in the terminal first
                        </p>
                        {error && (
                            <p className="text-sm text-yellow-500 mb-4">{error}</p>
                        )}
                        <button
                            onClick={handleRetryPort}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0f0f23]">
            {/* URL Bar */}
            <div className="flex items-center gap-2 p-2 bg-[#1a1b26] border-b border-[#292e42]">
                {/* Navigation buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Refresh"
                    >
                        <svg
                            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>

                {/* URL input */}
                <div className="flex-1 flex items-center gap-2 bg-[#0f0f23] rounded-lg px-3 py-2">
                    <span className="text-green-500 text-sm">🔒</span>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && browserRef.current) {
                                browserRef.current.src = url;
                            }
                        }}
                        className="flex-1 bg-transparent text-sm text-gray-300 outline-none font-mono"
                        placeholder="Enter URL..."
                    />
                </div>

                {/* Open in new tab */}
                <button
                    onClick={() => window.open(url, "_blank")}
                    className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Open in new tab"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                    </svg>
                </button>
            </div>

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 top-12 bg-[#0f0f23]/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 text-gray-400">
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Loading preview...
                    </div>
                </div>
            )}

            {/* Iframe */}
            <div className="flex-1 relative">
                <iframe
                    ref={browserRef}
                    src={`http://localhost:${port}`}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    className="w-full h-full border-none bg-white"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
            </div>
        </div>
    );
};