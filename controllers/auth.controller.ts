import { NextFunction, Request, Response } from "express";
import User, { UserProps } from "../models/User.model";
import Profile from "../models/Profile.model";
import jwt from "jsonwebtoken";
import ValidationError from "../errors/ValidationError";
import { AuthenticatedRequest } from "../types";
import NotFoundError from "../errors/NotFoundError";
import OauthUser from "../models/OauthUser.model";

const frontendUrl =
  process.env.NODE_ENV === "developments" || !process.env.FRONTEND_URL
    ? "http://localhost:5173"
    : process.env.FRONTEND_URL;

export async function CreateAccount(
  req: Request<any, Response, UserProps>,
  res: Response,
  next: NextFunction
) {
  const { username, email, password } = req.body;

  try {
    const jwtSecret = process.env.JWT_SECRET!;

    const user = new User({ username, email, password });
    await user.save();

    const profile = new Profile({ _id: user._id });
    await profile.save();

    const token = jwt.sign({ userId: user._id }, jwtSecret);

    res.cookie("token", JSON.stringify({ value: token }), {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({ username });
  } catch (err: any) {
    next(err);
  }
}
export async function Login(
  req: Request<any, Response, UserProps>,
  res: Response,
  next: NextFunction
) {
  const { email, username, password } = req.body;
  try {
    const user = (await User.findOne(username ? { username } : { email }))!;
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      throw new ValidationError("Incorrect Password", "password");
    }
    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", JSON.stringify({ value: token }), {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({ message: "Logged in SuccessFully" });
  } catch (err) {
    next(err);
  }
}

export async function Logout(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        res.clearCookie('token', { secure: true, httpOnly: true, sameSite: "strict" });
        res.json({
            message: 'Logged Out successfully',
        })
    } catch (err) {
        next(err);
    }
}

export async function ChangeUsername(
  req: AuthenticatedRequest<any, Response, { password: string; newUsername: string }>,
  res: Response,
  next: NextFunction
) {
  const { password, newUsername } = req.body;
  const username = req.user!.username;
  try {
    if (!req.user?.platform) {
      const user = (await User.findOne({ username }));
      const passwordMatch = await user?.comparePassword(password);

      if (!user) {
        throw new NotFoundError('User Not Found')
      }
      if (!passwordMatch) {
        throw new ValidationError("Incorrect Password", "password");
      }
      user.$set('username', newUsername);
      await user.save();
    } else {
      const oauthUser = await OauthUser.findOne({ username });
      if (!oauthUser) {
        throw new NotFoundError('User Not Found');
      }
      oauthUser.$set('username', newUsername);
      await oauthUser.save();
    }
    res.json({username: newUsername})
  } catch (err) {
    next(err);
  }
}

export async function ChangePassword(
  req: AuthenticatedRequest<any, Response, { oldPassword: string; newPassword: string }>,
  res: Response,
  next: NextFunction
) {
  if (req.user?.platform) {
    next(new Error());
  }

  const { oldPassword, newPassword } = req.body;
  const username = req.user!.username;
  try {
    const user = (await User.findOne({ username }));
    const passwordMatch = await user?.comparePassword(oldPassword);
    if (!user) {
      throw new NotFoundError('User Not Found')
    }
    if (!passwordMatch) {
      throw new ValidationError('Passwords do not match', 'Password');
    }
    user.password = newPassword;
    user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}