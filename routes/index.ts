import { Router } from "express";

const routes = Router();

routes.use('/auth', authRouter);
routes.use('/profile', profileRouter);
routes.use('/typing', typingRouter);