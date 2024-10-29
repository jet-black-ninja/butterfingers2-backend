import axios from "axios";
import { NextFunction, Request, Response } from "express";
import UnauthorizedError from "../errors/UnauthorizedError";
import OauthUser from "../models/OauthUser.model";
import OauthUsernameError from "../errors/OauthUsernameError";
import { AuthenticatedRequest } from "../types";
import NotFoundError from "../errors/NotFoundError";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User.model";
export default async function auth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.token ? JSON.parse(req.cookies.token) : null;
  try {
    if (!token) {
      throw new Error("Authentication Required");
    }
    if (token.platform === "Google") {
      const dataResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer:${token.value}` } }
      );
      const id = dataResponse.data.sub;
      if (!id) {
        throw new UnauthorizedError("Authentication Required");
      }
      const oauthUser = await OauthUser.findOne({
        userId: id,
        platform: "Google",
      });
      if (!oauthUser) {
        throw new NotFoundError("User Not Found");
      }
      if (!oauthUser.username) {
        throw new OauthUsernameError("Google");
      }

      (req as AuthenticatedRequest).user = {
        username: oauthUser.username,
        platform: "Google",
      };
      next();
    } else if (token.platform === "GitHub") {
      const { data } = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer:${token.value}` },
      });
      if (!data?.id) {
        throw new UnauthorizedError("Authentication Required");
      }
      const oauthUser = await OauthUser.findOne({
        userId: data.id,
        platform: "GitHub",
      });

      if (!oauthUser) {
        throw new NotFoundError("User Not Found");
      }
      if (!oauthUser.username) {
        throw new OauthUsernameError("GitHub");
      }

      (req as AuthenticatedRequest).user = {
        username: oauthUser.username,
        platform: "GitHub",
      };
      next();
    } else {
      const jwtSecret = process.env.JWT_SECRET!;
      const decodedToken = jwt.verify(token.value, jwtSecret) as JwtPayload;
      const user = await User.findById(decodedToken.userId);

      (req as AuthenticatedRequest).user = { username: user?.username };
      next();
    }
  } catch (err) {
    next(err);
  }
}
