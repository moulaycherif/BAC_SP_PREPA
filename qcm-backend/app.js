"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const questionRoutes_1 = __importDefault(require("./src/routes/questionRoutes"));
const answerRoutes_1 = __importDefault(require("./src/routes/answerRoutes"));
const adminRoutes_1 = __importDefault(require("./src/routes/adminRoutes")); // ✅ AJOUT ICI
const studentRoutes_1 = __importDefault(require("./src/routes/studentRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./.env" });
const app = (0, express_1.default)();
// ✅ Middleware CORS
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173", // Frontend local
        "https://med-contest.vercel.app" // Frontend déployé
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ✅ Routes principales
app.use("/api/auth", authRoutes_1.default);
app.use("/api/questions", questionRoutes_1.default);
app.use("/api/results", answerRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/student", studentRoutes_1.default);
// ✅ Route test
app.get("/", (req, res) => {
    res.send("✅ API MED-CONTEST backend en ligne ! Utilisez /api/questions ou /api/auth pour interagir.");
});
exports.default = app;
