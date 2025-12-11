import { Router } from "express";
import { FormData } from "undici";
import crypto from "crypto";

export function createAuthRouter(prisma) {
  const router = Router();
  const oneHour = () => new Date(Date.now() + 3600000);

  // LOGIN
  router.post("/login", async (req, res) => {
    try {
      const { email, username, password } = req.body || {};
      const loginEmail = (email || username || "").trim();
      const pass = (password || "").trim();

      if (!loginEmail || !pass) {
        return res.status(400).json({
          success: false,
          error: "email/username and password required",
        });
      }

      const form = new FormData();
      form.append("email", loginEmail);
      form.append("password", pass);

      const r = await fetch("https://triup.tsri.or.th/service/api/login", {
        method: "POST",
        body: form,
      });

      if (!r.ok) {
        return res
          .status(401)
          .json({ success: false, error: `login failed: ${r.status}` });
      }

      const data = await r.json().catch(() => ({}));
      const rawToken = data?.access_token;

      const token = rawToken
        ? `${
            data?.token_type?.toLowerCase() === "bearer"
              ? ""
              : data.token_type + " "
          }${rawToken}`
        : null;

      if (!token) {
        return res.status(500).json({
          success: false,
          error: "token not found",
        });
      }

      const saved = await prisma.session.create({
        data: {
          session_pk_uuid: crypto.randomUUID(),
          username: loginEmail,
          token,
          expiresAt: oneHour(),
          roles_id: 1000,
        },
        select: {
          token: true,
          username: true,
          expiresAt: true,
          roles_id: true,
        },
      });

      return res.json({
        success: true,
        session: {
          id: saved.token,
          expiresAt: saved.expiresAt,
          roles_id: saved.roles_id,
        },
        user: { username: saved.username },
      });
    } catch (e) {
      console.error("Login error:", e);
      return res
        .status(500)
        .json({ success: false, error: "internal error 01" });
    }
  });

  // ME
  router.get("/me", async (req, res) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.replace("Bearer ", "");

      if (!token)
        return res.status(401).json({ success: false, error: "no token" });

      const s = await prisma.session.findFirst({ where: { token } });

      if (!s)
        return res.status(401).json({ success: false, error: "invalid token" });
      if (s.expiresAt <= new Date())
        return res.status(401).json({ success: false, error: "expired" });

      return res.json({
        success: true,
        user: { username: s.username, roles_id: s.roles_id },
        expiresAt: s.expiresAt,
      });
    } catch (e) {
      console.error("ME error:", e);
      return res
        .status(500)
        .json({ success: false, error: "internal error 02" });
    }
  });

  return router;
}
