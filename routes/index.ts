import { Router } from "express";
import authRouter from "./auth.router";
import typingRouter from "./typing.router";
const routes = Router();

routes.use("/auth", authRouter);
// routes.use('/profile', profileRouter);
routes.use("/typing", typingRouter);
