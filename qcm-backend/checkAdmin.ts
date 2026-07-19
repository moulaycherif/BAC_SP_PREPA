import mongoose from "mongoose";
import Admin from "./models/Admin";

const MONGO_URI = "mongodb://127.0.0.1:27017/qcmdb";

async function run() {
  await mongoose.connect(MONGO_URI);
  const admins = await Admin.find();
  
  await mongoose.disconnect();
}

run().catch(console.error);
