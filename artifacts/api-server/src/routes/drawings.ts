import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, drawingActivityTable, drawingsTable } from "@workspace/db";
import {
  CreateDrawingBody,
  CreateDrawingResponse,
  DeleteDrawingParams,
  GetDrawingParams,
  GetDrawingResponse,
  ListActivityResponse,
  ListDrawingsQueryParams,
  ListDrawingsResponse,
  UpdateDrawingBody,
  UpdateDrawingParams,
  UpdateDrawingResponse,
} from "@workspace/api-zod";
import { addActivity, getIdParam, listDrawingRows, toDateString } from "../lib/drawings";

const router: IRouter = Router();

router.get("/drawings", async (req, res): Promise<void> => {
  const parsed = ListDrawingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await listDrawingRows(parsed.data);
  res.json(ListDrawingsResponse.parse(rows));
});

router.post("/drawings", async (req, res): Promise<void> => {
  const parsed = CreateDrawingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [drawing] = await db.insert(drawingsTable).values({
    drawingNumber: data.drawingNumber,
    title: data.title,
    discipline: data.discipline,
    status: data.status ?? "draft",
    revision: data.revision,
    projectName: data.projectName,
    sheetSize: data.sheetSize,
    author: data.author,
    description: data.description,
    dueDate: toDateString(data.dueDate),
    issuedDate: toDateString(data.issuedDate),
  }).returning();
  await addActivity("drawing_added", `${drawing.drawingNumber} was added to the register`, drawing.id);
  res.status(201).json(CreateDrawingResponse.parse(drawing));
});

router.get("/drawings/:id", async (req, res): Promise<void> => {
  const parsed = GetDrawingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, parsed.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  res.json(GetDrawingResponse.parse(drawing));
});

router.patch("/drawings/:id", async (req, res): Promise<void> => {
  const params = UpdateDrawingParams.safeParse(req.params);
  const body = UpdateDrawingBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const data = body.data;
  const issuedDate = data.status === "issued" && data.issuedDate === undefined
    ? new Date().toISOString().slice(0, 10)
    : data.issuedDate !== undefined
      ? toDateString(data.issuedDate)
      : undefined;
  const [drawing] = await db.update(drawingsTable).set({
    ...(data.drawingNumber !== undefined ? { drawingNumber: data.drawingNumber } : {}),
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.discipline !== undefined ? { discipline: data.discipline } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.revision !== undefined ? { revision: data.revision } : {}),
    ...(data.projectName !== undefined ? { projectName: data.projectName } : {}),
    ...(data.sheetSize !== undefined ? { sheetSize: data.sheetSize } : {}),
    ...(data.author !== undefined ? { author: data.author } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.dueDate !== undefined ? { dueDate: toDateString(data.dueDate) } : {}),
    ...(issuedDate !== undefined ? { issuedDate } : {}),
    ...(data.attachmentPath !== undefined ? { attachmentPath: data.attachmentPath } : {}),
    ...(data.attachmentName !== undefined ? { attachmentName: data.attachmentName } : {}),
    ...(data.attachmentSize !== undefined ? { attachmentSize: data.attachmentSize } : {}),
    ...(data.attachmentContentType !== undefined ? { attachmentContentType: data.attachmentContentType } : {}),
    updatedAt: new Date(),
  }).where(eq(drawingsTable.id, params.data.id)).returning();
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const activityType = data.status === "issued" ? "drawing_issued" : data.status === "approved" ? "drawing_approved" : "drawing_updated";
  await addActivity(activityType, `${drawing.drawingNumber} was updated to revision ${drawing.revision}`, drawing.id);
  res.json(UpdateDrawingResponse.parse(drawing));
});

router.delete("/drawings/:id", async (req, res): Promise<void> => {
  const parsed = DeleteDrawingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drawing] = await db.delete(drawingsTable).where(eq(drawingsTable.id, parsed.data.id)).returning();
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/activity", async (_req, res): Promise<void> => {
  const activity = await db.select().from(drawingActivityTable).orderBy(desc(drawingActivityTable.createdAt)).limit(12);
  res.json(ListActivityResponse.parse(activity));
});

export default router;