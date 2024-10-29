import { NextFunction, Request, Response } from "express";
import User, { UserProps } from "../models/User.model";
import Profile from "../models/Profile.model";
import jwt from "jsonwebtoken";
import ValidationError from "../errors/ValidationError";

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
