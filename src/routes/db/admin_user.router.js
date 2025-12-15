import { Router } from "express";
import { randomUUID } from "crypto";

export function createAdminUserRouter(prisma) {
  const router = Router();

  const roleMap = {
    1000: "ผู้ดูแลระบบ",
    2000: "เจ้าหน้าที่วิจัย",
    3000: "ผู้ใช้งานทั่วไป",
    4000: "ผู้ร่วมวิจัยภายนอก",
    5000: "ผู้บ่มข้อมูล",
    6000: "อื่นๆ",
  };

  // -----------------------------
  // GET /api/admin/users
  // -----------------------------
  router.get("/users", async (req, res) => {
    try {
      const logins = await prisma.psu_user_login.findMany({
        orderBy: { user_id: "asc" },
      });
      const profiles = await prisma.psu_user_profile.findMany();

      const users = logins.map((u) => ({
        ...u,
        role_name: roleMap[u.roles_id] || "ไม่ทราบสิทธิ์",
        profile: profiles.find((p) => p.user_id === u.username) || null,
      }));

      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -----------------------------
  // GET /api/admin/users/:uuid
  // -----------------------------
  router.get("/users/:uuid", async (req, res) => {
    try {
      const { uuid } = req.params;

      const login = await prisma.psu_user_login.findUnique({
        where: { user_pk_uuid: uuid },
      });

      if (!login)
        return res.status(404).json({ success: false, message: "User not found" });

      const profile = await prisma.psu_user_profile.findUnique({
        where: { user_id: login.username },
      });

      res.json({
        success: true,
        data: {
          ...login,
          role_name: roleMap[login.roles_id] || "",
          profile: profile || null,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -----------------------------
  // GET /api/admin/users/:uuid/role-log
  // -----------------------------
  router.get("/users/:uuid/role-log", async (req, res) => {
    try {
      const { uuid } = req.params;

      const user = await prisma.psu_user_login.findUnique({
        where: { user_pk_uuid: uuid },
      });

      if (!user) return res.json({ success: true, data: [] });

      const logs = await prisma.psu_user_role_log.findMany({
        where: { user_id: user.username },
        orderBy: { changed_at: "desc" },
      });

      const logsWithNames = logs.map((l) => ({
        ...l,
        old_role_name: roleMap[l.old_role] || "-",
        new_role_name: roleMap[l.new_role] || "-",
      }));

      res.json({ success: true, data: logsWithNames });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -----------------------------
  // PUT /api/admin/users/:uuid/role
  // -----------------------------
  router.put("/users/:uuid/role", async (req, res) => {
    try {
      const { uuid } = req.params;
      const { roles_id, changed_by } = req.body;

      const allowedRoles = [1000, 2000, 3000, 4000, 5000, 6000];
      if (!allowedRoles.includes(Number(roles_id))) {
        return res.status(400).json({ success: false, message: "Invalid roles_id" });
      }

      const user = await prisma.psu_user_login.findUnique({
        where: { user_pk_uuid: uuid },
      });

      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      // 🔥 Save Log
      await prisma.psu_user_role_log.create({
        data: {
          log_id: randomUUID(),
          user_id: user.username,
          old_role: String(user.roles_id),
          new_role: String(roles_id),
          changed_by: changed_by ?? "unknown",
          changed_at: new Date(),
        },
      });

      // 🔥 Update role
      const updated = await prisma.psu_user_login.update({
        where: { user_pk_uuid: uuid },
        data: { roles_id: Number(roles_id) },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
