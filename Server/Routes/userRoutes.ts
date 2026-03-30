import express from "express";
import {
  getAllUserProjects,
  getProjectById,
  getUserCredits,
  toggleProjectPublic,
} from "../controllers/userController.js";
import { protect } from "../Middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/credits", protect, getUserCredits);
userRouter.get("/projects", protect, getAllUserProjects);
userRouter.get("/projects/:projectId", protect, getProjectById);
userRouter.put("/projects/:projectId", protect, toggleProjectPublic);

export default userRouter;
