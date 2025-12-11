// src/routes/psu_auth.router.js
import { Router } from "express";
import soap from "soap";
import { randomUUID } from "crypto";

export function createPsuAuthRouter(prisma) {
  const router = Router();

  // POST /api/psu_auth/login
  router.post("/login", async (req, res) => {
    try {
      console.log("\n================ LOGIN REQUEST ================");
      console.log("REQ BODY =", req.body);

      const { username, password } = req.body || {};

      if (!username || !password) {
        console.log("Missing username/password");
        return res.json({
          success: false,
          message: "username และ password จำเป็นต้องกรอก",
        });
      }

      // ---------------- SOAP CALL PSU PASSPORT ----------------
      let userDetail = null;
      try {
        const wsdl =
          "https://passport.psu.ac.th/authentication/authentication.asmx?WSDL";

        console.log("Creating SOAP client...");
        const client = await soap.createClientAsync(wsdl);
        console.log("SOAP CLIENT CREATED OK");

        console.log("Sending SOAP Request with:", { username, password });
        const [result] = await client.GetUserDetailsAsync({
          username,
          password,
        });

        userDetail = result?.GetUserDetailsResult;

        console.log("SOAP RESPONSE =", userDetail);
      } catch (err) {
        console.error("SOAP Error:", err);
        return res.json({
          success: false,
          message: "ไม่สามารถเชื่อมต่อ PSU Passport ได้",
        });
      }

      if (!userDetail || !userDetail.string) {
        console.log("Invalid credentials from SOAP");
        return res.json({
          success: false,
          message: "Incorrect Username or Password",
        });
      }

      // ---------------- MAP ข้อมูลจาก SOAP ----------------
      console.log("PSU USER ARRAY =", userDetail.string);
      const arr = userDetail.string;

      const userId = arr[0] || ""; // รหัสนักศึกษา / staff
      const firstName = arr[1] || "";
      const lastName = arr[2] || "";
      const staffid = arr[3] || null;
      const gender = arr[4] || null;
      const idcard = arr[5] || null;
      const department_id = arr[6] || null;
      const rawFac = arr[7] || ""; // เช่น F08
      const department_name = arr[8] || null;
      const rawCampus = arr[9] || ""; // เช่น C01
      const campus_name = arr[10] || null;
      const prefix = arr[12] || null; // นาย / นาง / น.ส.
      const emailFromSoap = arr[14] || null; // gmail หรือ email อื่น

      const faculty_id = String(rawFac).replace("F", "");
      const campus_id = String(rawCampus).replace("C", "");
      const uname = String(userId).toLowerCase();

      const psuEmailGuess = userId ? `${userId}@psu.ac.th` : null;
      const email = emailFromSoap || psuEmailGuess || null;

      const fullname =
        firstName && lastName ? `${firstName} ${lastName}` : firstName || null;

      console.log("PARSED USER =", {
        userId,
        uname,
        prefix,
        firstName,
        lastName,
        fullname,
        staffid,
        idcard,
        department_id,
        department_name,
        faculty_id,
        campus_id,
        campus_name,
        email,
        gender,
      });

      // ---------------- TABLE: psu_user_login ----------------
      console.log("Checking user in DB =", uname);

      let dtuser = await prisma.psu_user_login.findFirst({
        where: { username: uname },
      });

      console.log("DB USER FOUND =", dtuser);

      const token = randomUUID();

      if (!dtuser) {
        console.log("Creating new user in psu_user_login");
        dtuser = await prisma.psu_user_login.create({
          data: {
            user_pk_uuid: randomUUID(),
            username: uname,
            token,
            roles_id: 5000,
          },
        });
      } else {
        console.log("Updating user token in psu_user_login");
        dtuser = await prisma.psu_user_login.update({
          where: { user_pk_uuid: dtuser.user_pk_uuid },
          data: {
            token,
            updateAt: new Date(),
          },
        });
      }

      console.log("FINAL DB USER (psu_user_login) =", dtuser);

      // ---------------- TABLE: psu_user_profile ----------------
      console.log("Upsert psu_user_profile for user_id =", uname);

      const profileData = {
        user_id: uname,
        prefix,
        first_name: firstName,
        last_name: lastName,
        fullname,
        idcard,
        staffid,
        department_id,
        department_name,
        faculty_id,
        campus_id,
        campus_name,
        email,
        updatedAt: new Date(),
      };

      let existingProfile = await prisma.psu_user_profile.findUnique({
        where: { user_id: uname },
      });

      let profile;
      if (!existingProfile) {
        console.log("Creating new psu_user_profile");
        profile = await prisma.psu_user_profile.create({
          data: {
            profile_uuid: randomUUID(),
            createdAt: new Date(),
            ...profileData,
          },
        });
      } else {
        console.log("Updating psu_user_profile");
        profile = await prisma.psu_user_profile.update({
          where: { user_id: uname },
          data: profileData,
        });
      }

      console.log("FINAL DB PROFILE =", profile);

      // ---------------- ROLE (ถ้ามีใน psu_roles) ----------------
      let role = null;
      if (dtuser.roles_id != null) {
        role = await prisma.psu_roles.findUnique({
          where: { roles_id: dtuser.roles_id },
        });
      }

      console.log("ROLE =", role);
      console.log("============ LOGIN SUCCESS ============\n");

      return res.json({
        success: true,
        message: "Login success",
        user: {
          username: uname,
          email,
          useridcard: idcard,
          staffid,
          faculty_id,
          campus_id,
          campus_name,
          role_id: dtuser.roles_id,
          role_name: role?.roles_name || null,
        },
        profile,
        session: { token },
      });
    } catch (err) {
      console.error("UNEXPECTED LOGIN ERROR =", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });

  return router;
}
