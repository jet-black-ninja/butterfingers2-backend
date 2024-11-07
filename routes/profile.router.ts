import { Router } from "express";
import auth from "../middleware/auth.middleware";
import {
  GetProfile,
  GetHistory,
  PostCustomize,
  ClearHistory,
  ResetStats,
} from "../controllers/profile.controller";

const profileRouter = Router();

profileRouter.get("/", auth, GetProfile);
profileRouter.get("/history", auth, GetHistory);
profileRouter.post("/customize", auth, PostCustomize);
profileRouter.post("/clear-history", auth, ClearHistory);
profileRouter.post("/reset-stats", auth, ResetStats);
export default profileRouter;
