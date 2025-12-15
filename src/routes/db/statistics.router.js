import { Router } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export function createStatisticsRouter(prisma) {
  const router = Router();

  // ---------------------------------------------------------
  // 1) ผู้ใช้ทั้งหมด + แยกตาม roles_id
  // ---------------------------------------------------------
  // 1) ผู้ใช้ทั้งหมด + แยกตาม roles_id + ชื่อ role
  router.get("/users", async (req, res) => {
    try {
      const total = await prisma.psu_user_login.count();

      const byRoles = await prisma.psu_user_login.groupBy({
        by: ["roles_id"],
        _count: { roles_id: true },
      });

      // ดึงชื่อ role
      const roleNames = await prisma.psu_roles.findMany({
        select: { roles_id: true, roles_name: true },
      });

      // Map roles_id -> roles_name
      const merged = byRoles.map((item) => {
        const found = roleNames.find((r) => r.roles_id === item.roles_id);
        return {
          ...item,
          roles_name: found ? found.roles_name : "ไม่ทราบสิทธิ์",
        };
      });

      res.json({
        success: true,
        data: {
          total_users: total,
          users_by_role: merged,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 2) งานวิจัยใหม่ + แยกสถานะ
  // ---------------------------------------------------------
  router.get("/findings", async (req, res) => {
    try {
      const total = await prisma.form_new_findings.count();

      const byStatus = await prisma.form_new_findings.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      res.json({
        success: true,
        data: {
          total_findings: total,
          findings_by_status: byStatus,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 3) ข้อมูลงานวิจัยตามภาควิชา
  // ---------------------------------------------------------
  router.get("/department", async (req, res) => {
    try {
      const data = await prisma.form_research_owner.groupBy({
        by: ["form_own_department"],
        _count: { form_own_department: true },
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 4) ข้อมูลงานวิจัยตามคณะ
  // ---------------------------------------------------------
  router.get("/faculty", async (req, res) => {
    try {
      const data = await prisma.psu_user_profile.groupBy({
        by: ["faculty_id"],
        _count: { faculty_id: true },
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 5) งบประมาณรวมจากแผนงานวิจัย (รายปี)
  // ---------------------------------------------------------
  router.get("/budget/year", async (req, res) => {
    try {
      const data = await prisma.form_research_plan.groupBy({
        by: ["form_plan_start_date"],
        _sum: { form_plan_usage_value: true },
      });

      const result = data.map((item) => ({
        year: new Date(item.form_plan_start_date).getFullYear(),
        budget: item._sum.form_plan_usage_value || 0,
      }));

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 6) Line Chart: จำนวนงานวิจัยรายเดือน (ปีปัจจุบัน)
  // ---------------------------------------------------------
  router.get("/findings/monthly", async (req, res) => {
    try {
      const year = new Date().getFullYear();

      const data = await prisma.form_new_findings.findMany({
        where: {
          sla_at: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
        },
        select: { sla_at: true },
      });

      const monthly = Array(12).fill(0);

      data.forEach((item) => {
        const m = new Date(item.sla_at).getMonth();
        monthly[m]++;
      });

      res.json({
        success: true,
        data: monthly.map((v, i) => ({
          month: i + 1,
          count: v,
        })),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 7) สถิติงานวิจัยรายปี
  // ---------------------------------------------------------
  router.get("/findings/yearly", async (req, res) => {
    try {
      const data = await prisma.form_new_findings.groupBy({
        by: ["sla_at"],
        _count: { sla_at: true },
      });

      const result = {};

      data.forEach((item) => {
        const year = new Date(item.sla_at).getFullYear();
        result[year] = (result[year] || 0) + item._count.sla_at;
      });

      const formatted = Object.keys(result).map((y) => ({
        year: Number(y),
        count: result[y],
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 8) ดาวน์โหลดรายงาน Excel
  // ---------------------------------------------------------
  router.get("/export/excel", async (req, res) => {
    try {
      const data = await prisma.form_new_findings.findMany();

      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet("Findings Report");

      sheet.addRow(["Report Code", "Title TH", "Title EN", "Status"]);

      data.forEach((item) => {
        sheet.addRow([
          item.report_code,
          item.report_title_th,
          item.report_title_en,
          item.status,
        ]);
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=findings.xlsx"
      );

      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // 9) ดาวน์โหลด PDF
  // ---------------------------------------------------------
  router.get("/export/pdf", async (req, res) => {
    try {
      const data = await prisma.form_new_findings.findMany();
      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=findings.pdf");

      doc.pipe(res);

      doc.fontSize(20).text("Research Findings Report", { align: "center" });

      doc.moveDown();

      data.forEach((item) => {
        doc
          .fontSize(12)
          .text(
            `${item.report_code} - ${item.report_title_th} (${item.status})`
          );
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
