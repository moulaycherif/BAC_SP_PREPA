import mongoose from "mongoose";
import dotenv from "dotenv";
import Astuce from "../models/Astuce";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Connecté à MongoDB");

    const anciennesAstuces = await Astuce.find({
      content: { $exists: true },
    });

    console.log(`🔎 ${anciennesAstuces.length} astuce(s) à migrer`);

    for (const astuce of anciennesAstuces) {
      const ancienContenu = (astuce as any).content;

      astuce.set({
        cases: [
          {
            title: "Cas 1",
            content: ancienContenu,
          },
        ],
      });

      astuce.set("content", undefined);

      await astuce.save();
      console.log(`✔ Migrée : ${astuce.title}`);
    }

    console.log("🎉 Migration terminée !");
    process.exit();
  } catch (error) {
    console.error("❌ Erreur migration:", error);
    process.exit(1);
  }
};

migrate();