import { Router } from "express";

export function createFormNewFindingsRouter(prisma) {
  const router = Router();

  /* =====================================================
   * 1) LIST : ดึงรายการทั้งหมด (หน้า table)
   * GET /api/master/form-new-findings
   * ===================================================== */
  router.get("/form-new-findings", async (req, res) => {
    try {
      const rows = await prisma.form_new_findings.findMany({
        orderBy: { form_new_id: "desc" },
      });

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /* =====================================================
   * 2) DETAIL : ดึงข้อมูลทั้งหมดที่เกี่ยวข้อง (1 form)
   * GET /api/master/form-new-findings/:form_new_id
   * ===================================================== */
  router.get("/form-new-findings/:form_new_id", async (req, res) => {
    const formNewId = Number(req.params.form_new_id);

    try {
      /* ---------- form หลัก ---------- */
      const finding = await prisma.form_new_findings.findFirst({
        where: { form_new_id: formNewId },
      });

      if (!finding) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบข้อมูล form_new_findings",
        });
      }

      /* ---------- owner ---------- */
      const owner = await prisma.form_research_owner.findMany({
        where: { form_new_id: formNewId },
      });

      /* ---------- plan ---------- */
      const plan = await prisma.form_research_plan.findMany({
        where: { form_plan_form_new_id: formNewId },
      });

      /* ---------- utilization ---------- */
      const utilization = await prisma.form_utilization.findMany({
        where: { form_new_id: formNewId },
      });

      /* ---------- extend ---------- */
      const extend = await prisma.form_extend.findMany({
        where: { form_new_id: formNewId },
      });

      res.json({
        success: true,
        data: {
          finding,
          owner,
          plan,
          utilization,
          extend,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}
