import { IStudent } from "../../models/Student";

declare global {
  namespace Express {
    interface Request {
      student?: IStudent;
    }
  }
}

export {};
