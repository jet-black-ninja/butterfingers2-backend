import mongoose from "mongoose";

export default function initializeMongoDb() {
  const mongoDB = `${process.env.MONGO_URI}`;
  mongoose.set("strictQuery", false);
  mongoose.connect(mongoDB);
  const db = mongoose.connection;
  console.log("Connected to MongoDB".blue);
  db.on("error", console.error.bind(console, "MongoDB connection error".red));

  process.on("SIGHT", () => {
    db.close()
      .then(() => {
        console.log("MongoDB connection closed on app termination".blue);
        process.exit(0);
      })
      .catch((err) => {
        console.error("Error while closing mongoDB connection", err);
        process.exit(1);
      });
  });
}
