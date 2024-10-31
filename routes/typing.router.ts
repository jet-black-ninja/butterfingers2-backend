import { Router } from "express";
import auth from "../middleware/auth.middleware";
import {
  TypingStarted,
  TypingCompleted,
} from "../controllers/typing.controller";

const typingRouter = Router();

typingRouter.post("/started", auth, TypingStarted);
typingRouter.post("/completed", auth, TypingCompleted);

export default typingRouter;
