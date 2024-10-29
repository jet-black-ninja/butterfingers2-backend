import { ErrorRequestHandler } from "express";
import CustomError from "../errors/CustomError";

const error: ErrorRequestHandler = (err, req, res, next) => { 
  if (process.env.NODE_ENV === 'development') {
    console.log(err);
  }
  if (err instanceof CustomError) {
    res.status(err.statusCode).json(err.sendToClient);
  } else {
    res.status(500).json({ message: 'Something Went Wrong' });
  }
}

export default error;
