import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types";
import User from "../models/User.model";
import Profile, { ProfileProps } from "../models/Profile.model";
import PropertyMissingError from "../errors/PropertyMissingError";

export async function TypingStarted(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const username = req.user!.username;
  try {
    const user = await User.findOne({ username });
    await Profile.updateOne(
      { _id: user?._id },
      { $inc: { "stats.textStarted": 1 } }
    );
    return res.json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}
export async function TypingCompleted(
  req: AuthenticatedRequest<
    any,
    any,
    Omit<ProfileProps["history"][number], "date">
  >,
  res: Response,
  next: NextFunction
) {
  const result = req.body;
  const username = req.user!.username;
  try {
    if (
      !result?.timeline?.length ||
      result?.errors === undefined ||
      result?.testType === undefined
    ) {
      throw new PropertyMissingError("Required Property Missing");
    }
    const user = (await User.findOne({ username }))!;
    const profile = (await Profile.findOne({ _id: user._id }))!;
    const resultLatest = result.timeline[result.timeline.length - 1];
    const statsAverageKeys = [
      "wpm",
      "accuracy",
      "raw",
    ] as (keyof typeof profile.stats.average)[];

    statsAverageKeys.forEach((key) => {
      //average
      const average =
        (profile.stats.average && profile.stats.average[key]) || 0;
      const testsCompleted = profile.stats.testsCompleted || 0;
      profile.$set(
        `stats.average.${key}`,
        Number(
          (
            (average * testsCompleted + resultLatest[key]) /
            (testsCompleted + 1)
          ).toFixed(2)
        )
      );
      //Highest
      const highest =
        (profile.stats.highest && profile.stats.highest[key]) || 0;
      if (highest < resultLatest[key]) {
        profile.$set(`stats.highest.${key}`, resultLatest[key]);
      }
    });
    profile.history.unshift({ ...result, date: new Date().toISOString() });
    profile.$inc("stats.testsCompleted", 1);
    await profile.save();
    res.json({ message: "success" });
  } catch (err) {
    next(err);
  }
}
