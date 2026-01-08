import uuid4 from "uuid4";
import fs from 'fs/promises';
import { REACT_PROJECT_COMMAND } from '../config/serverConfig.js';
import { execPromisified } from "../utils/execUtility.js";
import path from 'path';
import directoryTree from "directory-tree";


export const createProjectService = async () => {
  // Create a unique id and then inside the projects folder create a new folder with that id
  const projectId = uuid4();
  console.log("New project id is", projectId);

  await fs.mkdir(`./projects/${projectId}`);

  // After this call the npm create vite command in the newly created project folder
  const response = await execPromisified(REACT_PROJECT_COMMAND, {
    cwd: `./projects/${projectId}`
  });

  // Modify package.json to add --host flag to dev script
  // This makes Vite accessible from outside Docker container
  try {
    const packageJsonPath = `./projects/${projectId}/package.json`;
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.scripts && packageJson.scripts.dev) {
      // Add --host if not already present
      if (!packageJson.scripts.dev.includes('--host')) {
        packageJson.scripts.dev = packageJson.scripts.dev + ' --host';
      }
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("Modified package.json to include --host flag");
  } catch (error) {
    console.error("Error modifying package.json:", error);
  }

  // Modify vite.config.js to enable polling for HMR in Docker
  // This is required for Windows Docker volumes to detect file changes
  try {
    const viteConfigPath = `./projects/${projectId}/vite.config.js`;
    const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
`;
    await fs.writeFile(viteConfigPath, viteConfigContent);
    console.log("Modified vite.config.js to enable polling for HMR");
  } catch (error) {
    console.error("Error modifying vite.config.js:", error);
  }

  return projectId;
}

export const getAllProjectsService = async () => {
  const projectsFolder = path.resolve("./projects");
  try {
    const files = await fs.readdir(projectsFolder);
    const directories = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(projectsFolder, file);
        try {
          const stat = await fs.stat(fullPath);
          return stat.isDirectory() ? file : null;
        } catch (error) {
          console.error(`Error getting stats for file ${file}:`, error);
          return null;
        }
      })
    );

    return directories.filter(Boolean);
  } catch (error) {
    console.error("Error reading projects directory:", error);
    throw new Error("Unable to retrieve projects.");
  }
};

export const getProjectTreeService = async (projectId) => {
  const projectPath = path.resolve(`./projects/${projectId}`);
  const tree = directoryTree(projectPath);
  return tree;
}