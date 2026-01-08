import { useParams, useNavigate } from "react-router-dom";
import { EditorComponent } from "../components/molecules/EditorComponent/EditorComponent";
import { TreeStructure } from "../components/organisms/TreeStructure/TreeStructure";
import { useEffect, useState } from "react";
import { useTreeStructureStore } from "../store/treeStructureStore";
import { useEditorSocketStore } from "../store/editorSocketStore";
import { io } from "socket.io-client";
import { BrowserTerminal } from "../components/molecules/BrowserTerminal/BrowserTerminal";
import { useTerminalSocketStore } from "../store/terminalSocketStore";
import { Browser } from "../components/organisms/Browser/Browser";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useActiveFileTabStore } from "../store/activeFileTabStore";

export const ProjectPlayground = () => {
    const { projectId: projectIdFromUrl } = useParams();
    const navigate = useNavigate();
    const { setProjectId, projectId } = useTreeStructureStore();
    const { setEditorSocket } = useEditorSocketStore();
    const { terminalSocket, setTerminalSocket } = useTerminalSocketStore();
    const { activeFileTab } = useActiveFileTabStore();
    const [loadBrowser, setLoadBrowser] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (projectIdFromUrl) {
            setProjectId(projectIdFromUrl);

            const editorSocketConn = io(
                `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/editor`,
                {
                    query: {
                        projectId: projectIdFromUrl,
                    },
                }
            );

            try {
                const ws = new WebSocket(
                    "ws://localhost:4000/terminal?projectId=" + projectIdFromUrl
                );
                setTerminalSocket(ws);
            } catch (error) {
                console.log("error in ws", error);
            }
            setEditorSocket(editorSocketConn);
        }
    }, [setProjectId, projectIdFromUrl, setEditorSocket, setTerminalSocket]);

    // Handle back navigation
    const handleBack = () => {
        // Close WebSocket connections
        terminalSocket?.close();
        navigate("/");
    };

    // Handle export project
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/v1/projects/${projectIdFromUrl}/export`
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `project-${projectIdFromUrl.slice(0, 8)}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Export failed");
                alert("Export feature coming soon! For now, you can access your project files at: backend/projects/" + projectIdFromUrl);
            }
        } catch (error) {
            console.error("Export error:", error);
            alert("Export feature coming soon! For now, you can access your project files at: backend/projects/" + projectIdFromUrl);
        }
        setIsExporting(false);
    };

    return (
        <div className="h-screen w-screen bg-[#0f0f23] flex overflow-hidden">
            {/* Sidebar - File Explorer */}
            <div
                className={`${sidebarCollapsed ? "w-12" : "w-64"
                    } h-full bg-[#1a1b26] border-r border-[#292e42] flex flex-col transition-all duration-300`}
            >
                {/* Sidebar Header */}
                <div className="h-12 flex items-center justify-between px-3 border-b border-[#292e42]">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title="Back to Home"
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
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                            </button>
                            <span className="text-lg">📁</span>
                            <span className="text-sm font-medium text-gray-300 truncate">
                                Explorer
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""
                                }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                        </svg>
                    </button>
                </div>

                {/* File Tree */}
                {!sidebarCollapsed && projectId && (
                    <div className="flex-1 overflow-auto p-2">
                        <TreeStructure />
                    </div>
                )}

                {/* Collapsed icons */}
                {sidebarCollapsed && (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title="Back to Home"
                        >
                            🏠
                        </button>
                        <button className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors">
                            📄
                        </button>
                        <button className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors">
                            🔍
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <div className="h-12 bg-[#1a1b26] border-b border-[#292e42] flex items-center justify-between px-4">
                    {/* Left side - Back button and tabs */}
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#292e42] text-gray-300 hover:bg-[#363b54] hover:text-white transition-all cursor-pointer"
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
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Home
                        </button>

                        {/* Tabs */}
                        {activeFileTab?.path && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0f23] rounded-t-lg border-t-2 border-blue-500">
                                <span className="text-sm">📄</span>
                                <span className="text-sm text-gray-300 font-medium">
                                    {activeFileTab.path.split("/").pop()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#292e42] text-gray-300 hover:bg-[#363b54] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                            title="Export Project"
                        >
                            {isExporting ? (
                                <svg
                                    className="animate-spin h-4 w-4"
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
                            ) : (
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
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                            )}
                            Export
                        </button>

                        {/* Preview Button */}
                        <button
                            onClick={() => setLoadBrowser(!loadBrowser)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${loadBrowser
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-[#292e42] text-gray-300 hover:bg-[#363b54] hover:text-white"
                                }`}
                        >
                            <span>{loadBrowser ? "🌐" : "👁️"}</span>
                            {loadBrowser ? "Browser Active" : "Preview"}
                        </button>
                    </div>
                </div>

                {/* Editor & Terminal / Browser Area */}
                <div className="flex-1 overflow-hidden">
                    <Allotment>
                        {/* Left Panel - Editor + Terminal */}
                        <Allotment.Pane minSize={300}>
                            <div className="h-full flex flex-col bg-[#0f0f23]">
                                <Allotment vertical>
                                    {/* Editor */}
                                    <Allotment.Pane minSize={200}>
                                        <div className="h-full">
                                            <EditorComponent />
                                        </div>
                                    </Allotment.Pane>

                                    {/* Terminal */}
                                    <Allotment.Pane minSize={100} preferredSize={250}>
                                        <div className="h-full flex flex-col bg-[#1a1b26]">
                                            {/* Terminal Header */}
                                            <div className="h-8 flex items-center justify-between px-3 border-b border-[#292e42] bg-[#1a1b26]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">💻</span>
                                                    <span className="text-xs font-medium text-gray-400">
                                                        Terminal
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                                </div>
                                            </div>

                                            {/* Terminal Content */}
                                            <div className="flex-1 overflow-hidden terminal-wrapper">
                                                <BrowserTerminal />
                                            </div>
                                        </div>
                                    </Allotment.Pane>
                                </Allotment>
                            </div>
                        </Allotment.Pane>

                        {/* Right Panel - Browser Preview */}
                        {loadBrowser && (
                            <Allotment.Pane minSize={300}>
                                <div className="h-full bg-[#1a1b26] flex flex-col">
                                    {/* Browser Header */}
                                    <div className="h-12 flex items-center gap-3 px-4 border-b border-[#292e42]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-[#0f0f23] rounded-lg px-4 py-2 text-sm text-gray-400 font-mono">
                                                localhost:5173
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setLoadBrowser(false)}
                                            className="p-2 rounded-lg hover:bg-[#292e42] text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Browser Content */}
                                    <div className="flex-1 overflow-hidden">
                                        {projectIdFromUrl && terminalSocket && (
                                            <Browser projectId={projectIdFromUrl} />
                                        )}
                                    </div>
                                </div>
                            </Allotment.Pane>
                        )}
                    </Allotment>
                </div>
            </div>
        </div>
    );
};