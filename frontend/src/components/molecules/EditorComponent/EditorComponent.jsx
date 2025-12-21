import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import { useActiveFileTabStore } from "../../../store/activeFileTabStore";
import { useEditorSocketStore } from "../../../store/editorSocketStore";
import { extensionToFileType } from "../../../utils/extensionToFileType";

export const EditorComponent = () => {
    const timerRef = useRef(null);
    const [editorState, setEditorState] = useState({
        theme: null,
    });

    const { activeFileTab } = useActiveFileTabStore();
    const { editorSocket } = useEditorSocketStore();

    async function downloadTheme() {
        try {
            const response = await fetch("/Dracula.json");
            const data = await response.json();
            setEditorState({ ...editorState, theme: data });
        } catch (error) {
            console.error("Failed to load theme:", error);
        }
    }

    function handleEditorTheme(editor, monaco) {
        if (editorState.theme) {
            monaco.editor.defineTheme("dracula", editorState.theme);
            monaco.editor.setTheme("dracula");
        }
    }

    function handleChange(value) {
        if (timerRef.current != null) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            const editorContent = value;
            editorSocket?.emit("writeFile", {
                data: editorContent,
                pathToFileOrFolder: activeFileTab.path,
            });
        }, 1500);
    }

    useEffect(() => {
        downloadTheme();
    }, []);

    // Show welcome screen when no file is open
    if (!activeFileTab?.path) {
        return (
            <div className="h-full w-full bg-[#282a36] flex flex-col items-center justify-center text-gray-400">
                <div className="text-center">
                    <div className="text-6xl mb-6">📝</div>
                    <h2 className="text-2xl font-semibold text-white mb-3">
                        Welcome to ReactForge
                    </h2>
                    <p className="text-gray-500 mb-6 max-w-md">
                        Double-click a file in the explorer to start editing
                    </p>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2 justify-center">
                            <kbd className="px-2 py-1 bg-[#1a1b26] rounded text-xs">Ctrl</kbd>
                            <span>+</span>
                            <kbd className="px-2 py-1 bg-[#1a1b26] rounded text-xs">S</kbd>
                            <span className="text-gray-600">to save</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            {editorState.theme && (
                <Editor
                    width="100%"
                    height="100%"
                    defaultLanguage={undefined}
                    options={{
                        fontSize: 14,
                        fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                        fontLigatures: true,
                        minimap: {
                            enabled: true,
                            scale: 1,
                            showSlider: "mouseover",
                        },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        padding: {
                            top: 16,
                            bottom: 16,
                        },
                        lineNumbers: "on",
                        renderLineHighlight: "all",
                        bracketPairColorization: {
                            enabled: true,
                        },
                        automaticLayout: true,
                    }}
                    language={extensionToFileType(activeFileTab?.extension)}
                    onChange={handleChange}
                    value={activeFileTab?.value || ""}
                    onMount={handleEditorTheme}
                />
            )}
        </div>
    );
};