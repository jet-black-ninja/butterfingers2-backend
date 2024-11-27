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
  try {
    const token = req.cookies.token ? JSON.parse(req.cookies.token) : null;

    if (!token) {
      throw new UnauthorizedError("No authentication token found");
    }

    if (!token.platform || !token.value) {
      throw new UnauthorizedError("Invalid token format");
    }

    if (token.platform === "Google") {
      await handleGoogleAuth(token, req);
    } else if (token.platform === "GitHub") {
      await handleGitHubAuth(token, req);
    } else {
      await handleJwtAuth(token, req);
    }

    next();
  } catch (err) {
    next(err);
  }
}

async function handleGoogleAuth(token: any, req: Request) {
  const dataResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${token.value}` } }
  );
  const id = dataResponse.data.sub;
  if (!id) {
    throw new UnauthorizedError("Invalid Google token");
  }
  const oauthUser = await OauthUser.findOne({
    userId: id,
    platform: "Google",
  });
  if (!oauthUser) {
    throw new NotFoundError("Google user not found");
  }
  if (!oauthUser.username) {
    throw new OauthUsernameError("Google");
  }
  (req as AuthenticatedRequest).user = {
    username: oauthUser.username,
    platform: "Google",
  };
}

async function handleGitHubAuth(token: any, req: Request) {
  const { data } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.value}` },
  });
  if (!data?.id) {
    throw new UnauthorizedError("Invalid GitHub token");
  }
  const oauthUser = await OauthUser.findOne({
    userId: data.id,
    platform: "GitHub",
  });
  if (!oauthUser) {
    throw new NotFoundError("GitHub user not found");
  }
  if (!oauthUser.username) {
    throw new OauthUsernameError("GitHub");
  }
  (req as AuthenticatedRequest).user = {
    username: oauthUser.username,
    platform: "GitHub",
  };
}

async function handleJwtAuth(token: any, req: Request) {
  const jwtSecret = process.env.JWT_SECRET!;
  const decodedToken = jwt.verify(token.value, jwtSecret) as JwtPayload;
  if (!decodedToken || !decodedToken.userId) {
    throw new UnauthorizedError("Invalid JWT token");
  }
  const user = await User.findById(decodedToken.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  (req as AuthenticatedRequest).user = { username: user.username };
}
