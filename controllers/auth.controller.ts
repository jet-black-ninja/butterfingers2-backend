import { NextFunction, Request, Response } from "express";
import User, { UserProps } from "../models/User.model";
import Profile from "../models/Profile.model";
import jwt from "jsonwebtoken";
import ValidationError from "../errors/ValidationError";
import { AuthenticatedRequest } from "../types";
import NotFoundError from "../errors/NotFoundError";
import OauthUser from "../models/OauthUser.model";
import axios from "axios";
import { platform } from "os";
import UnauthorizedError from "../errors/UnauthorizedError";
import PropertyMissingError from "../errors/PropertyMissingError";
import InternalServerError from "../errors/InternalServerError";

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
export async function GoogleAccessToken(
  req: Request<any, { code: string; scope: string; state: string }>,
  res: Response,
  next: NextFunction
) {
  const { code, scope, state } = req.query;
  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${frontendUrl}/auth/google/access-token`,
        grant_type: "authorization_code",
      }
    );
    const accessToken = tokenResponse.data.access_token;
    const dataResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const id = dataResponse.data?.sub;

    if (id) {
      const oauthUser = await OauthUser.findOne({
        userId: id,
        platform: "Google",
      });
      if (!oauthUser) {
        const newOauthUser = new OauthUser({
          userId: id,
          platform: "Google",
        });
        await newOauthUser.save();
      }
      res.cookie(
        "token",
        JSON.stringify({ value: accessToken, platform: "Google" }),
        {
          secure: true,
          httpOnly: true,
          sameSite: "strict",
        }
      );
    }
    res.redirect(frontendUrl);
  } catch (err) {
    next(err);
  }
}
export async function GoogleFinalSteps(
  req: Request<any, { username: string }>,
  res: Response,
  next: NextFunction
) {
  const { username } = req.body;
  const token = JSON.parse(req.cookies.token || "");
  try {
    if (!token?.value) {
      throw new UnauthorizedError("Authentication Required");
    }
    if (!username?.trim().length) {
      throw new PropertyMissingError("Property `username` wasn't provided!");
    }
    const dataResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${token.value}` } }
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
      throw new NotFoundError("User not found!");
    }
    oauthUser.username = username;
    await oauthUser.save();
    const profile = new Profile({ _id: oauthUser._id });
    await profile.save();
    res.json({ username });
  } catch (err) {
    next(err);
  }
}
export async function GitHubAccessToken(
  req: Request<any, { code: string }>,
  res: Response,
  next: NextFunction
) {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  try {
    if (!clientId || !clientSecret) {
      throw new InternalServerError(
        "Github `Client id` or `Client Secret` is undefined!"
      );
    }
    if (!code) {
      throw new PropertyMissingError("Required Property wasn't provided");
    }
    axios
      .post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        },
        {
          headers: { Accept: "application/json" },
        }
      )
      .then(async (oauthResponse) => {
        const accessToken = oauthResponse.data.access_token;
        if (!accessToken) {
          throw new Error();
        }
        const { data } = await axios.get("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const id = data?.id;
        if (!id) {
          throw new Error();
        }
        const oauthUser = await OauthUser.findOne({
          userId: id,
          platform: "GitHub",
        });
        if (!oauthUser) {
          const newOauthUser = new OauthUser({
            userId: id,
            platform: "GitHub",
          });
          await newOauthUser.save();
        }
        res.cookie(
          'token',
          JSON.stringify({
            value: accessToken,
            platform: 'GitHub',
          }),
          {
            secure: true,
            httpOnly: true,
            sameSite: 'strict',
          }
        );

        res.redirect(frontendUrl);
      });
  } catch (err) {
    next(err);
  }
}
export async function GitHubFinalSteps(
  req: AuthenticatedRequest<any, Response, { username: string }>,
  res: Response,
  next: NextFunction
) {
  const { username } = req.body;
  const token = JSON.stringify(req.cookies.token || "");
  try {
    if (!token.value) {
      throw new UnauthorizedError("Authentication Required");
    }
    if (!username?.trim().length) {
      throw new PropertyMissingError("Property `username` wasn't provided!")
    }
    const { data } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.value}` };
    });
    if (!data) {
      throw new UnauthorizedError('Authentication Required!');
    }
    const oauthUser = await OauthUser.findOne({
      userId: data.id,
      platform: "GitHub",
    });
    if (!oauthUser) {
      throw new NotFoundError('User Not Found');
    }

    oauthUser.username = username;
    await oauthUser.save();
    const profile = new Profile({ _id: oauthUser._id });
    await profile.save();
    res.json({ username });
  } catch (err) {
    next(err);
  }
}
export async function Logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token", {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });
    res.json({
      message: "Logged Out successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function ChangeUsername(
  req: AuthenticatedRequest<
    any,
    Response,
    { password: string; newUsername: string }
  >,
  res: Response,
  next: NextFunction
) {
  const { password, newUsername } = req.body;
  const username = req.user!.username;
  try {
    if (!req.user?.platform) {
      const user = await User.findOne({ username });
      const passwordMatch = await user?.comparePassword(password);

      if (!user) {
        throw new NotFoundError("User Not Found");
      }
      if (!passwordMatch) {
        throw new ValidationError("Incorrect Password", "password");
      }
      user.$set("username", newUsername);
      await user.save();
    } else {
      const oauthUser = await OauthUser.findOne({ username });
      if (!oauthUser) {
        throw new NotFoundError("User Not Found");
      }
      oauthUser.$set("username", newUsername);
      await oauthUser.save();
    }
    res.json({ username: newUsername });
  } catch (err) {
    next(err);
  }
}

export async function ChangePassword(
  req: AuthenticatedRequest<
    any,
    Response,
    { oldPassword: string; newPassword: string }
  >,
  res: Response,
  next: NextFunction
) {
  if (req.user?.platform) {
    next(new Error());
  }

  const { oldPassword, newPassword } = req.body;
  const username = req.user!.username;
  try {
    const user = await User.findOne({ username });
    const passwordMatch = await user?.comparePassword(oldPassword);
    if (!user) {
      throw new NotFoundError("User Not Found");
    }
    if (!passwordMatch) {
      throw new ValidationError("Passwords do not match", "Password");
    }
    user.password = newPassword;
    user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}
