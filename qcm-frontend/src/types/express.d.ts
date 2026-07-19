import { StudentDocument } from "../models/Student";

declare global {
  namespace Express {
    interface Request {
      student?: StudentDocument;
    }
  }
}
