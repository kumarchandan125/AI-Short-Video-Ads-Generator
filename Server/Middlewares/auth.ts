import { NextFunction, Request, Response } from "express";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    next();
  } catch (error: any) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};
