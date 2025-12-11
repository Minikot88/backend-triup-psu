// src/routes/index.js
import { Router } from "express";
import { createAuthRouter } from "./login_api_triup.router.js";
import { createFetchAllRouter } from "./triup/fetch_all.router.js";
import { createImportServerFixRouter } from "./triup/import_server_fix.router.js";
import { createImportServerFormRouter } from "./triup/import_server_form.router.js";
import { createImportServerUserRouter } from "./triup/import_server_user.router.js";
import { createMasterRouter } from "./db/master.router.js";
import { createPsuAuthRouter } from "./psu_auth.router.js"; // <--- เพิ่ม

export function mountRouters(app, prisma) {
  const api = Router();

  api.use("/login-api-triup", createAuthRouter(prisma));

  // PSU auth login
  api.use("/psu_auth", createPsuAuthRouter(prisma)); // → POST /api/psu_auth/login

  // scripts
  api.use("/scripts", createFetchAllRouter(prisma)); // ต้องใช้ token
  api.use("/scripts", createImportServerFixRouter(prisma)); // ไม่ต้อง login
  api.use("/scripts", createImportServerFormRouter(prisma));
  api.use("/scripts", createImportServerUserRouter(prisma));

  // master tables
  api.use("/master", createMasterRouter(prisma));

  app.use("/api", api);
}
