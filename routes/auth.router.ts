import { Router } from "express";
import {
  ChangePassword,
  ChangeUsername,
  CreateAccount,
  GitHubAccessToken,
  GitHubFinalSteps,
  GoogleAccessToken,
  GoogleFinalSteps,
  Login,
  Logout,
} from "../controllers/auth.controller";
import auth from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.get("/github/access-token", GitHubAccessToken);
authRouter.post("/github/final-steps", GitHubFinalSteps);

authRouter.get("/google/access-token", GoogleAccessToken);
authRouter.post("/google/final-steps", GoogleFinalSteps);

authRouter.post("/create-account", CreateAccount);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);

authRouter.post("/change-username", auth, ChangeUsername);
authRouter.post("/change-password", auth, ChangePassword);
export default authRouter;
