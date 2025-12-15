// src/routes/psu_user.router.js
import { Router } from "express";

export function createPsuUserRouter(prisma) {
  const router = Router();

  router.get("/all", async (req, res) => {
    try {
      const logins = await prisma.psu_user_login.findMany({
        orderBy: { user_id: "asc" }
      });

      const profiles = await prisma.psu_user_profile.findMany();

      const result = logins.map((login) => ({
        ...login,
        profile: profiles.find((p) => p.user_id === login.username) || null
      }));

      return res.json({
        success: true,
        total: result.length,
        data: result
      });
    } catch (error) {
      console.error("JOIN ERROR:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}