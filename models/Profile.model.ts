import mongoose, { Document, Schema } from "mongoose";
import NotFoundError from "../errors/NotFoundError";

type StatsAverageType = {
  wpm: number;
  accuracy: number;
  raw: number;
};

export interface ProfileProps {
  customize: {
    liveWpm: boolean;
    liveAccuracy: boolean;
    smoothCaret: boolean;
    soundOnClick: boolean;
    inputWidth: number;
    fontSize: number;
    caretStyle: string;
    theme: string;
  };
  stats: {
    testsStarted: number;
    testsCompleted: number;
    average?: StatsAverageType;
    highest?: StatsAverageType;
  };
  history: {
    timeline: { wpm: number; accuracy: number; raw: number; second: number }[];
    errors: number;
    testType: string;
    date: string;
    quoteAuthor?: string;
  }[];
}
export type ProfileInterface = ProfileProps & Document;

const StatsAverageSchemaType = {
  wpm: Number,
  accuracy: Number,
  raw: Number,
};
const ProfileSchema = new Schema({
  customize: {
    caretStyle: String,
    inputWidth: Number,
    fontSize: Number,
    liveAccuracy: Boolean,
    liveWpm: Boolean,
    smoothCaret: Boolean,
    soundOnClick: Boolean,
    theme: String,
  },
  stats: {
    testsStarted: Number,
    testsCompleted: Number,
    average: StatsAverageSchemaType,
    highest: StatsAverageSchemaType,
  },
  history: [
    {
      timeline: {
        type: [{ wpm: Number, accuracy: Number, raw: Number, second: Number }],
        required: true,
      },
      errors: { type: Number, required: true },
      testType: { type: String, required: true },
      date: { type: Date, required: true },
      quoteAuthor: { type: String },
    },
  ],
});

ProfileSchema.post("findOne", (res, next) => {
  if (!res) {
    next(new NotFoundError("Profile Not Found"));
  }
  next();
});

const Profile = mongoose.model<ProfileInterface>("Profile", ProfileSchema);
export default Profile;
