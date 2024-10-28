import express, { Express, Request, Response, NextFunction } from "express";
import * as dotenv from "dotenv";
import createError from "http-errors";
import initializeMongoDb from "./config/mongodb";
import cors from "cors";
import path from "path";
import routes from "./routes";
import errorMiddleware from "./middleware/errorMiddleware";
import logger from "morgan";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import helmet from "helmet";
import chalk from "chalk";
const app: Express = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
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
app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(err.stack);
  next(createError(404));
});

app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log(chalk.green(`Server is running on port http://localhost:${PORT}`));
});
