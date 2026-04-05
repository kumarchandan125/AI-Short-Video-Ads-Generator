import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../config/prisma.js";

//Get user credits

export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    res.json({
      credits: user ? user.credits : 0,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//get all user projects
export const getAllUserProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const projects = await prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({
      projects,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//get projects by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: {
        id: projectId as string,
        userId,
      },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }
    res.json({
      project,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

//publish and unpublish project
export const toggleProjectPublic = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: {
        id: projectId as string,
        userId,
      },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project Not Found",
      });
    }
    if (!project?.generatedImage && !project?.generatedVideo) {
      return res.status(404).json({
        message: "Project has no generated image or video",
      });
    }
    await prisma.project.update({
      where: {
        id: projectId as string,
        userId,
      },
      data: {
        isPublished: !project.isPublished,
      },
    });
    res.json({
      isPublished: !project.isPublished,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};
