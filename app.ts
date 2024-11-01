import express, { Express, Request, Response, NextFunction } from "express";
import * as dotenv from "dotenv";
import createError from "http-errors";
import initializeMongoDb from "./config/mongodb";
import cors from "cors";
import path from "path";
import "colors";
import routes from "./routes/index";
import error from "./middleware/error.middleware";
import NotFoundError from "./errors/NotFoundError";
import logger from "morgan";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import helmet from "helmet";
const app: Express = express();
dotenv.config();
initializeMongoDb();
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin || process.env.CORS_ACCESS?.split(",").indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not Allowed by cors"));
    }
  },
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: [
    "Origin",
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Expires",
    "Pragma",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());
//routes
app.use("/", routes);

//error middleware
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Invalid path: ${req.originalUrl}`));
});
app.use(error);

export default app;
