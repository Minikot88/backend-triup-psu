// src/routes/db/master.router.js
import { Router } from 'express';

export function createMasterRouter(prisma) {
  const router = Router();

  // helper เล็ก ๆ สำหรับจับ error ให้คืน JSON สวย ๆ
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      console.error('master router error:', e);
      res
        .status(500)
        .json({ success: false, error: 'internal error master' });
    }
  };

  // ==========================
  //  MASTER แบบเดิม (province + lookups ต่าง ๆ)
  // ==========================

  // address (province)
  // GET /api/master/address
  router.get(
    '/address',
    wrap(async (_req, res) => {
      const rows = await prisma.address.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // cofunders
  // GET /api/master/cofunders
  router.get(
    '/cofunders',
    wrap(async (_req, res) => {
      const rows = await prisma.cofunders.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // departments
  // GET /api/master/departments
  router.get(
    '/departments',
    wrap(async (_req, res) => {
      const rows = await prisma.departments.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // educationlevels
  // GET /api/master/educationlevels
  router.get(
    '/educationlevels',
    wrap(async (_req, res) => {
      const rows = await prisma.educationlevels.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // findingdetaillists
  // GET /api/master/findingdetaillists
  router.get(
    '/findingdetaillists',
    wrap(async (_req, res) => {
      const rows = await prisma.findingdetaillists.findMany({
        orderBy: { id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // funder
  // GET /api/master/funders
  router.get(
    '/funders',
    wrap(async (_req, res) => {
      const rows = await prisma.funder.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // groupstudies
  // GET /api/master/groupstudies
  router.get(
    '/groupstudies',
    wrap(async (_req, res) => {
      const rows = await prisma.groupstudies.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // mainstudies
  // GET /api/master/mainstudies
  router.get(
    '/mainstudies',
    wrap(async (_req, res) => {
      const rows = await prisma.mainstudies.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // substudies
  // GET /api/master/substudies
  router.get(
    '/substudies',
    wrap(async (_req, res) => {
      const rows = await prisma.substudies.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // target_audiences
  // GET /api/master/target-audiences
  router.get(
    '/target-audiences',
    wrap(async (_req, res) => {
      const rows = await prisma.target_audiences.findMany({
        orderBy: { id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // time_settings
  // GET /api/master/time-settings
  router.get(
    '/time-settings',
    wrap(async (_req, res) => {
      const rows = await prisma.time_settings.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // roles
  // GET /api/master/roles
  router.get(
    '/roles',
    wrap(async (_req, res) => {
      const rows = await prisma.roles.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // prefixs
  // GET /api/master/prefixs
  router.get(
    '/prefixs',
    wrap(async (_req, res) => {
      const rows = await prisma.prefixs.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, data: rows });
    }),
  );

  // ==========================
  //  TABLE อื่น ๆ ทั้งหมดใน schema
  // ==========================

  // file_uploads
  // GET /api/master/file-uploads
  router.get(
    '/file-uploads',
    wrap(async (_req, res) => {
      const rows = await prisma.file_uploads.findMany({
        orderBy: { fu_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // form_allocate
  // GET /api/master/form-allocate
  router.get(
    '/form-allocate',
    wrap(async (_req, res) => {
      const rows = await prisma.form_allocate.findMany({
        orderBy: { allocate_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // form_extend
  // GET /api/master/form-extend
  router.get(
    '/form-extend',
    wrap(async (_req, res) => {
      const rows = await prisma.form_extend.findMany({
        orderBy: { extend_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // form_new_findings
  // GET /api/master/form-new-findings
  // router.get(
  //   '/form-new-findings',
  //   wrap(async (_req, res) => {
  //     const rows = await prisma.form_new_findings.findMany({
  //       orderBy: { findings_pk_id: 'asc' },
  //     });
  //     res.json({ success: true, data: rows });
  //   }),
  // );

  // form_research_owner
  // GET /api/master/form-research-owner
  router.get(
    '/form-research-owner',
    wrap(async (_req, res) => {
      const rows = await prisma.form_research_owner.findMany({
        orderBy: { owner_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // form_research_plan
  // GET /api/master/form-research-plan
  router.get(
    '/form-research-plan',
    wrap(async (_req, res) => {
      const rows = await prisma.form_research_plan.findMany({
        orderBy: { plan_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // form_utilization
  // GET /api/master/form-utilization
  router.get(
    '/form-utilization',
    wrap(async (_req, res) => {
      const rows = await prisma.form_utilization.findMany({
        orderBy: { utilization_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // pivot
  // GET /api/master/pivot
  router.get(
    '/pivot',
    wrap(async (_req, res) => {
      const rows = await prisma.pivot.findMany({
        orderBy: { pivot_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // psu_roles
  // GET /api/master/psu-roles
  router.get(
    '/psu-roles',
    wrap(async (_req, res) => {
      const rows = await prisma.psu_roles.findMany({
        orderBy: { roles_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // psu_user_login
  // GET /api/master/psu-user-login
  router.get(
    '/psu-user-login',
    wrap(async (_req, res) => {
      const rows = await prisma.psu_user_login.findMany({
        orderBy: { user_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // psu_user_profile
  // GET /api/master/psu-user-profile
  router.get(
    '/psu-user-profile',
    wrap(async (_req, res) => {
      const rows = await prisma.psu_user_profile.findMany({
        orderBy: { createdAt: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // researcher
  // GET /api/master/researcher
  router.get(
    '/researcher',
    wrap(async (_req, res) => {
      const rows = await prisma.researcher.findMany({
        orderBy: { res_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // session
  // GET /api/master/session
  router.get(
    '/session',
    wrap(async (_req, res) => {
      const rows = await prisma.session.findMany({
        orderBy: { session_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  // users
  // GET /api/master/users
  router.get(
    '/users',
    wrap(async (_req, res) => {
      const rows = await prisma.users.findMany({
        orderBy: { user_pk_id: 'asc' },
      });
      res.json({ success: true, data: rows });
    }),
  );

  return router;
}
