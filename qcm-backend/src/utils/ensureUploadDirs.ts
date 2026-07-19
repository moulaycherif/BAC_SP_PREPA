import fs from "fs";
import path from "path";

export function ensureUploadDirs() {
  const dirs = [
    path.join(process.cwd(), "uploads", "exercises"),
    path.join(process.cwd(), "uploads", "images"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("📁 Created:", dir);
    }
  });
}