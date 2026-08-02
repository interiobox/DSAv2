import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, drawingActivityTable, drawingCommentsTable, drawingUploadsTable, drawingsTable } from "@workspace/db";
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
  ListDrawingUploadsResponse,
  RecordDrawingUploadBody,
  RecordDrawingUploadResponse,
  ListDrawingCommentsResponse,
  CreateDrawingCommentBody,
  CreateDrawingCommentResponse,
  UpdateDrawingUploadParams,
  UpdateDrawingUploadBody,
  UpdateDrawingUploadResponse,
  DeleteDrawingUploadParams,
  UpdateDrawingCommentParams,
  UpdateDrawingCommentBody,
  UpdateDrawingCommentResponse,
  DeleteDrawingCommentParams,
} from "@workspace/api-zod";
import { addActivity, getIdParam, listDrawingRows, toDateString } from "../lib/drawings";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

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
    drawingNumber: data.drawingNumber ?? `DR-${Date.now().toString().slice(-6)}`,
    title: data.title ?? "Untitled drawing",
    discipline: data.discipline ?? "architectural",
    status: data.status ?? "draft",
    revision: data.revision ?? "—",
    projectName: data.projectName ?? "Unassigned",
    sheetSize: data.sheetSize ?? "A1",
    author: data.author ?? "—",
    description: data.description,
    dueDate: toDateString(data.dueDate),
    issuedDate: toDateString(data.issuedDate),
  }).returning();
  await addActivity("drawing_added", `${drawing.title} was added to the drawing library`, drawing.id);
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
  await addActivity(activityType, `${drawing.title} was updated`, drawing.id);
  res.json(UpdateDrawingResponse.parse(drawing));
});

router.delete("/drawings/:id", async (req, res): Promise<void> => {
  const parsed = DeleteDrawingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, parsed.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const uploads = await db.select().from(drawingUploadsTable).where(eq(drawingUploadsTable.drawingId, drawing.id));
  for (const upload of uploads) {
    await objectStorageService.deleteObjectEntity(upload.filePath);
  }
  await db.delete(drawingCommentsTable).where(eq(drawingCommentsTable.drawingId, drawing.id));
  await db.delete(drawingUploadsTable).where(eq(drawingUploadsTable.drawingId, drawing.id));
  await db.delete(drawingsTable).where(eq(drawingsTable.id, drawing.id));
  res.sendStatus(204);
});

router.get("/activity", async (_req, res): Promise<void> => {
  const activity = await db.select().from(drawingActivityTable).orderBy(desc(drawingActivityTable.createdAt)).limit(12);
  res.json(ListActivityResponse.parse(activity));
});

router.get("/drawings/:id/uploads", async (req, res): Promise<void> => {
  const parsed = GetDrawingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drawing] = await db.select({ id: drawingsTable.id }).from(drawingsTable).where(eq(drawingsTable.id, parsed.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const uploads = await db.select().from(drawingUploadsTable)
    .where(eq(drawingUploadsTable.drawingId, parsed.data.id))
    .orderBy(desc(drawingUploadsTable.uploadedAt));
  res.json(ListDrawingUploadsResponse.parse(uploads));
});

router.post("/drawings/:id/uploads", async (req, res): Promise<void> => {
  const params = GetDrawingParams.safeParse(req.params);
  const body = RecordDrawingUploadBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, params.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const [upload] = await db.insert(drawingUploadsTable).values({
    drawingId: drawing.id,
    ...body.data,
  }).returning();
  await db.update(drawingsTable).set({
    attachmentPath: upload.filePath,
    attachmentName: upload.fileName,
    attachmentSize: upload.fileSize,
    attachmentContentType: upload.contentType,
    updatedAt: new Date(),
  }).where(eq(drawingsTable.id, drawing.id));
  await addActivity("drawing_uploaded", `${upload.fileName} uploaded by ${upload.uploadedBy}`, drawing.id);
  res.status(201).json(RecordDrawingUploadResponse.parse(upload));
});

router.patch("/drawings/:id/uploads/:uploadId", async (req, res): Promise<void> => {
  const params = UpdateDrawingUploadParams.safeParse(req.params);
  const body = UpdateDrawingUploadBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [upload] = await db.select().from(drawingUploadsTable).where(eq(drawingUploadsTable.id, params.data.uploadId));
  if (!upload || upload.drawingId !== params.data.id) {
    res.status(404).json({ error: "Upload not found" });
    return;
  }
  const [updated] = await db.update(drawingUploadsTable).set(body.data)
    .where(eq(drawingUploadsTable.id, upload.id)).returning();
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, upload.drawingId));
  if (drawing?.attachmentPath === upload.filePath) {
    await db.update(drawingsTable).set({
      attachmentName: updated.fileName,
      attachmentSize: updated.fileSize,
      attachmentContentType: updated.contentType,
      updatedAt: new Date(),
    }).where(eq(drawingsTable.id, upload.drawingId));
  }
  await addActivity("drawing_updated", `${updated.fileName} upload metadata was edited`, upload.drawingId);
  res.json(UpdateDrawingUploadResponse.parse(updated));
});

router.delete("/drawings/:id/uploads/:uploadId", async (req, res): Promise<void> => {
  const params = DeleteDrawingUploadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [upload] = await db.select().from(drawingUploadsTable).where(eq(drawingUploadsTable.id, params.data.uploadId));
  if (!upload || upload.drawingId !== params.data.id) {
    res.status(404).json({ error: "Upload not found" });
    return;
  }
  await objectStorageService.deleteObjectEntity(upload.filePath);
  await db.delete(drawingUploadsTable).where(eq(drawingUploadsTable.id, upload.id));
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, upload.drawingId));
  if (drawing?.attachmentPath === upload.filePath) {
    const [replacement] = await db.select().from(drawingUploadsTable)
      .where(eq(drawingUploadsTable.drawingId, upload.drawingId))
      .orderBy(desc(drawingUploadsTable.uploadedAt))
      .limit(1);
    await db.update(drawingsTable).set({
      attachmentPath: replacement?.filePath ?? null,
      attachmentName: replacement?.fileName ?? null,
      attachmentSize: replacement?.fileSize ?? null,
      attachmentContentType: replacement?.contentType ?? null,
      updatedAt: new Date(),
    }).where(eq(drawingsTable.id, upload.drawingId));
  }
  await addActivity("drawing_updated", `${upload.fileName} upload was deleted`, upload.drawingId);
  res.sendStatus(204);
});

router.get("/drawings/:id/comments", async (req, res): Promise<void> => {
  const parsed = GetDrawingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drawing] = await db.select({ id: drawingsTable.id }).from(drawingsTable).where(eq(drawingsTable.id, parsed.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const comments = await db.select().from(drawingCommentsTable)
    .where(eq(drawingCommentsTable.drawingId, parsed.data.id))
    .orderBy(desc(drawingCommentsTable.createdAt));
  res.json(ListDrawingCommentsResponse.parse(comments));
});

router.post("/drawings/:id/comments", async (req, res): Promise<void> => {
  const params = GetDrawingParams.safeParse(req.params);
  const body = CreateDrawingCommentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [drawing] = await db.select().from(drawingsTable).where(eq(drawingsTable.id, params.data.id));
  if (!drawing) {
    res.status(404).json({ error: "Drawing not found" });
    return;
  }
  const [comment] = await db.insert(drawingCommentsTable).values({
    drawingId: drawing.id,
    ...body.data,
  }).returning();
  await addActivity("comment_added", `${comment.author} commented on ${drawing.title}`, drawing.id);
  res.status(201).json(CreateDrawingCommentResponse.parse(comment));
});

router.patch("/drawings/:id/comments/:commentId", async (req, res): Promise<void> => {
  const params = UpdateDrawingCommentParams.safeParse(req.params);
  const body = UpdateDrawingCommentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [comment] = await db.select().from(drawingCommentsTable).where(eq(drawingCommentsTable.id, params.data.commentId));
  if (!comment || comment.drawingId !== params.data.id) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  const [updated] = await db.update(drawingCommentsTable).set(body.data)
    .where(eq(drawingCommentsTable.id, comment.id)).returning();
  await addActivity("drawing_updated", `${updated.author} edited a review comment`, comment.drawingId);
  res.json(UpdateDrawingCommentResponse.parse(updated));
});

router.delete("/drawings/:id/comments/:commentId", async (req, res): Promise<void> => {
  const params = DeleteDrawingCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [comment] = await db.select().from(drawingCommentsTable).where(eq(drawingCommentsTable.id, params.data.commentId));
  if (!comment || comment.drawingId !== params.data.id) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  await db.delete(drawingCommentsTable).where(eq(drawingCommentsTable.id, comment.id));
  await addActivity("drawing_updated", `${comment.author}'s review comment was deleted`, comment.drawingId);
  res.sendStatus(204);
});

export default router;