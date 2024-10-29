import CustomError from "./CustomError";

export default class PropertyMissingError extends CustomError {
  readonly statusCode = 402;
  readonly sendToClient: Record<any, any>;

  constructor(message: string) {
    super(message);
    this.sendToClient = { message };
  }
}
