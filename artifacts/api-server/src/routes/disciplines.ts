import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, disciplinesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/disciplines", async (_req, res): Promise<void> => {
  res.json(await db.select().from(disciplinesTable).orderBy(asc(disciplinesTable.name)));
});

export default router;