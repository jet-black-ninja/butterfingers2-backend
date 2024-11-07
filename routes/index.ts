import { Router } from "express";
import authRouter from "./auth.router";
import typingRouter from "./typing.router";
import profileRouter from "./profile.router";
const routes = Router();

routes.use("/auth", authRouter);
routes.use("/profile", profileRouter);
routes.use("/typing", typingRouter);
export default routes;
