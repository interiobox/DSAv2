import { Router, type IRouter } from "express";
import healthRouter from "./health";
import drawingsRouter from "./drawings";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(drawingsRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
