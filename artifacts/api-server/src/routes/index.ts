import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import disciplinesRouter from "./disciplines";
import drawingsRouter from "./drawings";
import projectsRouter from "./projects";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";
import { authenticatePortalUser } from "../lib/portalAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use((req, res, next): void => {
  void authenticatePortalUser(req, res, next);
});
router.use(adminRouter);
router.use(disciplinesRouter);
router.use(drawingsRouter);
router.use(projectsRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
