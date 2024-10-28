import mongoose, { mongo } from "mongoose";
import chalk from "chalk";

export default function initializeMongoDb() {
  const mongoDB = `${process.env.MONGO_URI}`;
  mongoose.set("strictQuery", false);
  mongoose.connect(mongoDB);
  const db = mongoose.connection;
  console.log(chalk.blue("Connected to MongoDB"));
  db.on("error", console.error.bind(console, "MongoDB connection error"));

  process.on("SIGHT", () => {
    db.close()
      .then(() => {
        console.log(chalk.blue("MongoDB connection closed on app termination"));
        process.exit(0);
      })
      .catch((err) => {
        console.error("Error while closing mongoDB connection", err);
        process.exit(1);
      });
  });
}
