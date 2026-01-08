import { createProjectService, getAllProjectsService, getProjectTreeService } from "../service/projectService.js";
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

export const createProjectController = async (req, res) => {

  const projectId = await createProjectService();

  return res.json({ message: 'Project created', data: projectId });
}

export const getAllProjectsController = async (req, res) => {
  try {
    const projects = await getAllProjectsService();
    return res.status(200).json({
      success: true,
      data: projects,
      message: "Successfully fetched all projects",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch projects", error: error.message });
  }
};

export const getProjectTree = async (req, res) => {
  const tree = await getProjectTreeService(req.params.projectId);
  return res.status(200).json({
    data: tree,
    success: true,
    message: "Successfully fetched the tree"
  })
}

export const exportProjectController = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.resolve(`./projects/${projectId}`);

    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Set headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="project-${projectId.slice(0, 8)}.zip"`);

    // Create archiver
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({
        success: false,
        message: "Failed to create archive"
      });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add the project directory to the archive
    archive.directory(projectPath, false);

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export project",
      error: error.message
    });
  }
}