import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, disciplinesTable, drawingsTable } from "@workspace/db";
import { requireCurrentUser } from "../lib/portalAuth";
import { addActivity } from "../lib/drawings";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  res.json(await db.select().from(disciplinesTable).orderBy(asc(disciplinesTable.name)));
});

router.post("/categories", async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Category name is required" });
    return;
  }
  const [existing] = await db.select({ id: disciplinesTable.id })
    .from(disciplinesTable)
    .where(sql`lower(${disciplinesTable.name}) = lower(${name})`)
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "That category already exists" });
    return;
  }
  const [category] = await db.insert(disciplinesTable).values({ name }).returning();
  res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!Number.isInteger(id) || id < 1 || !name) {
    res.status(400).json({ error: "Valid category id and name are required" });
    return;
  }
  const [existing] = await db.select({ id: disciplinesTable.id })
    .from(disciplinesTable)
    .where(sql`lower(${disciplinesTable.name}) = lower(${name}) AND ${disciplinesTable.id} <> ${id}`)
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "That category already exists" });
    return;
  }
  const [currentCategory] = await db.select().from(disciplinesTable)
    .where(eq(disciplinesTable.id, id))
    .limit(1);
  if (!currentCategory) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const [category] = await db.update(disciplinesTable)
    .set({ name })
    .where(eq(disciplinesTable.id, id))
    .returning();
  const affectedDrawings = await db.select({ id: drawingsTable.id, title: drawingsTable.title })
    .from(drawingsTable)
    .where(eq(drawingsTable.discipline, currentCategory.name));
  await db.update(drawingsTable)
    .set({ discipline: name })
    .where(eq(drawingsTable.discipline, currentCategory.name));
  const user = requireCurrentUser(req);
  for (const drawing of affectedDrawings) {
    await addActivity(
      "drawing_updated",
      `${drawing.title} changed category from ${currentCategory.name} to ${name}`,
      drawing.id,
      String(user.id),
      user.name,
    );
  }
  res.json(category);
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Valid category id is required" });
    return;
  }
  const [category] = await db.select().from(disciplinesTable)
    .where(eq(disciplinesTable.id, id))
    .limit(1);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const [used] = await db.select({ id: drawingsTable.id })
    .from(drawingsTable)
    .where(eq(drawingsTable.discipline, category.name))
    .limit(1);
  if (used) {
    res.status(409).json({ error: "This category is used by existing drawings and cannot be deleted" });
    return;
  }
  await db.delete(disciplinesTable).where(eq(disciplinesTable.id, id));
  res.sendStatus(204);
});

export default router;