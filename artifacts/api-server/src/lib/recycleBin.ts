import { and, eq, isNull, isNotNull, lt } from "drizzle-orm";
import {
  checklistTemplatesTable,
  contactProjectsTable,
  contactsTable,
  db,
  disciplinesTable,
  drawingCommentsTable,
  drawingUploadsTable,
  drawingsTable,
  personalNotesTable,
  projectChecklistsTable,
  projectNotesTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { ObjectStorageService } from "./objectStorage";
import type { PortalUser } from "./portalAuth";

export type RecycleBinType =
  | "project"
  | "drawing"
  | "upload"
  | "comment"
  | "project-note"
  | "personal-note"
  | "contact"
  | "contact-project"
  | "checklist"
  | "template"
  | "category"
  | "user";

export type RecycleBinEntry = {
  type: RecycleBinType;
  id: number;
  label: string;
  deletedAt: Date;
};

const objectStorageService = new ObjectStorageService();
const expiredBefore = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

export async function listRecycleBin(user: PortalUser): Promise<RecycleBinEntry[]> {
  const [
    projects, drawings, uploads, comments, projectNotes, personalNotes,
    contacts, contactProjects, checklists, templates, categories, users,
  ] = await Promise.all([
    db.select({ id: projectsTable.id, label: projectsTable.name, deletedAt: projectsTable.deletedAt }).from(projectsTable).where(isNotNull(projectsTable.deletedAt)),
    db.select({ id: drawingsTable.id, label: drawingsTable.title, deletedAt: drawingsTable.deletedAt }).from(drawingsTable).where(isNotNull(drawingsTable.deletedAt)),
    db.select({ id: drawingUploadsTable.id, label: drawingUploadsTable.fileName, deletedAt: drawingUploadsTable.deletedAt }).from(drawingUploadsTable).where(isNotNull(drawingUploadsTable.deletedAt)),
    db.select({ id: drawingCommentsTable.id, label: drawingCommentsTable.comment, deletedAt: drawingCommentsTable.deletedAt }).from(drawingCommentsTable).where(isNotNull(drawingCommentsTable.deletedAt)),
    db.select({ id: projectNotesTable.id, label: projectNotesTable.content, deletedAt: projectNotesTable.deletedAt }).from(projectNotesTable).where(isNotNull(projectNotesTable.deletedAt)),
    db.select({
      id: personalNotesTable.id,
      label: personalNotesTable.title,
      userId: personalNotesTable.userId,
      deletedAt: personalNotesTable.deletedAt,
    }).from(personalNotesTable).where(isNotNull(personalNotesTable.deletedAt)),
    db.select({ id: contactsTable.id, label: contactsTable.companyName, deletedAt: contactsTable.deletedAt }).from(contactsTable).where(isNotNull(contactsTable.deletedAt)),
    db.select({ id: contactProjectsTable.id, label: contactProjectsTable.projectName, deletedAt: contactProjectsTable.deletedAt }).from(contactProjectsTable).where(isNotNull(contactProjectsTable.deletedAt)),
    db.select({ id: projectChecklistsTable.id, label: projectChecklistsTable.name, deletedAt: projectChecklistsTable.deletedAt }).from(projectChecklistsTable).where(isNotNull(projectChecklistsTable.deletedAt)),
    db.select({ id: checklistTemplatesTable.id, label: checklistTemplatesTable.name, deletedAt: checklistTemplatesTable.deletedAt }).from(checklistTemplatesTable).where(isNotNull(checklistTemplatesTable.deletedAt)),
    db.select({ id: disciplinesTable.id, label: disciplinesTable.name, deletedAt: disciplinesTable.deletedAt }).from(disciplinesTable).where(isNotNull(disciplinesTable.deletedAt)),
    db.select({ id: usersTable.id, label: usersTable.name, deletedAt: usersTable.deletedAt }).from(usersTable).where(isNotNull(usersTable.deletedAt)),
  ]);
  const entries = [
    ...projects.map((item) => ({ ...item, type: "project" as const })),
    ...drawings.map((item) => ({ ...item, type: "drawing" as const })),
    ...uploads.map((item) => ({ ...item, type: "upload" as const })),
    ...comments.map((item) => ({ ...item, type: "comment" as const })),
    ...projectNotes.map((item) => ({ ...item, type: "project-note" as const })),
    ...personalNotes.map((item) => ({ ...item, type: "personal-note" as const })),
    ...contacts.map((item) => ({ ...item, type: "contact" as const })),
    ...contactProjects.map((item) => ({ ...item, type: "contact-project" as const })),
    ...checklists.map((item) => ({ ...item, type: "checklist" as const })),
    ...templates.map((item) => ({ ...item, type: "template" as const })),
    ...categories.map((item) => ({ ...item, type: "category" as const })),
    ...users.map((item) => ({ ...item, type: "user" as const })),
  ].sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime()) as RecycleBinEntry[];

  if (user.role === "admin") return entries;

  const ownPersonalNoteIds = new Set(
    personalNotes
      .filter((note) => note.userId === user.id)
      .map((note) => note.id),
  );

  return entries.filter((entry) => {
    if (entry.type === "user") return false;
    if (entry.type === "personal-note") return ownPersonalNoteIds.has(entry.id);
    return true;
  });
}

export async function restoreRecycleBinEntry(type: RecycleBinType, id: number, user: PortalUser) {
  const isAdmin = user.role === "admin";
  switch (type) {
    case "project": return db.update(projectsTable).set({ deletedAt: null }).where(and(eq(projectsTable.id, id), isNotNull(projectsTable.deletedAt))).returning();
    case "drawing": return db.update(drawingsTable).set({ deletedAt: null }).where(and(eq(drawingsTable.id, id), isNotNull(drawingsTable.deletedAt))).returning();
    case "upload": return db.update(drawingUploadsTable).set({ deletedAt: null }).where(and(eq(drawingUploadsTable.id, id), isNotNull(drawingUploadsTable.deletedAt))).returning();
    case "comment": return db.update(drawingCommentsTable).set({ deletedAt: null }).where(and(eq(drawingCommentsTable.id, id), isNotNull(drawingCommentsTable.deletedAt))).returning();
    case "project-note": return db.update(projectNotesTable).set({ deletedAt: null }).where(and(eq(projectNotesTable.id, id), isNotNull(projectNotesTable.deletedAt))).returning();
    case "personal-note": return db.update(personalNotesTable).set({ deletedAt: null }).where(and(
      eq(personalNotesTable.id, id),
      isNotNull(personalNotesTable.deletedAt),
      ...(isAdmin ? [] : [eq(personalNotesTable.userId, user.id)]),
    )).returning();
    case "contact": return db.update(contactsTable).set({ deletedAt: null }).where(and(eq(contactsTable.id, id), isNotNull(contactsTable.deletedAt))).returning();
    case "contact-project": return db.update(contactProjectsTable).set({ deletedAt: null }).where(and(eq(contactProjectsTable.id, id), isNotNull(contactProjectsTable.deletedAt))).returning();
    case "checklist": return db.update(projectChecklistsTable).set({ deletedAt: null }).where(and(eq(projectChecklistsTable.id, id), isNotNull(projectChecklistsTable.deletedAt))).returning();
    case "template": return db.update(checklistTemplatesTable).set({ deletedAt: null }).where(and(eq(checklistTemplatesTable.id, id), isNotNull(checklistTemplatesTable.deletedAt))).returning();
    case "category": return db.update(disciplinesTable).set({ deletedAt: null }).where(and(eq(disciplinesTable.id, id), isNotNull(disciplinesTable.deletedAt))).returning();
    case "user": {
      if (!isAdmin) return [];
      return db.update(usersTable).set({ deletedAt: null, active: true }).where(and(eq(usersTable.id, id), isNotNull(usersTable.deletedAt))).returning();
    }
  }
}

export async function purgeExpiredRecycleBin() {
  const before = expiredBefore();
  const expiredDrawings = await db.select({ id: drawingsTable.id }).from(drawingsTable).where(and(isNotNull(drawingsTable.deletedAt), lt(drawingsTable.deletedAt, before)));
  for (const drawing of expiredDrawings) {
    const uploads = await db.select().from(drawingUploadsTable).where(eq(drawingUploadsTable.drawingId, drawing.id));
    for (const upload of uploads) await objectStorageService.deleteObjectEntity(upload.filePath);
    await db.delete(drawingCommentsTable).where(eq(drawingCommentsTable.drawingId, drawing.id));
    await db.delete(drawingUploadsTable).where(eq(drawingUploadsTable.drawingId, drawing.id));
    await db.delete(drawingsTable).where(eq(drawingsTable.id, drawing.id));
  }
  const expiredContacts = await db.select({ id: contactsTable.id }).from(contactsTable).where(and(isNotNull(contactsTable.deletedAt), lt(contactsTable.deletedAt, before)));
  for (const contact of expiredContacts) {
    await db.delete(contactsTable).where(eq(contactsTable.id, contact.id));
  }
  await db.delete(contactProjectsTable).where(and(isNotNull(contactProjectsTable.deletedAt), lt(contactProjectsTable.deletedAt, before)));
  const expiredProjects = await db.select({ id: projectsTable.id }).from(projectsTable).where(and(isNotNull(projectsTable.deletedAt), lt(projectsTable.deletedAt, before)));
  for (const project of expiredProjects) {
    await db.delete(contactProjectsTable).where(eq(contactProjectsTable.projectName, (await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, project.id)).limit(1))[0]?.name ?? ""));
    await db.delete(projectNotesTable).where(eq(projectNotesTable.projectName, (await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, project.id)).limit(1))[0]?.name ?? ""));
    await db.delete(projectChecklistsTable).where(eq(projectChecklistsTable.projectName, (await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, project.id)).limit(1))[0]?.name ?? ""));
    await db.delete(projectsTable).where(eq(projectsTable.id, project.id));
  }
  await db.delete(drawingUploadsTable).where(and(isNotNull(drawingUploadsTable.deletedAt), lt(drawingUploadsTable.deletedAt, before)));
  await db.delete(drawingCommentsTable).where(and(isNotNull(drawingCommentsTable.deletedAt), lt(drawingCommentsTable.deletedAt, before)));
  await db.delete(projectNotesTable).where(and(isNotNull(projectNotesTable.deletedAt), lt(projectNotesTable.deletedAt, before)));
  await db.delete(personalNotesTable).where(and(isNotNull(personalNotesTable.deletedAt), lt(personalNotesTable.deletedAt, before)));
  await db.delete(projectChecklistsTable).where(and(isNotNull(projectChecklistsTable.deletedAt), lt(projectChecklistsTable.deletedAt, before)));
  await db.delete(checklistTemplatesTable).where(and(isNotNull(checklistTemplatesTable.deletedAt), lt(checklistTemplatesTable.deletedAt, before)));
  await db.delete(disciplinesTable).where(and(isNotNull(disciplinesTable.deletedAt), lt(disciplinesTable.deletedAt, before)));
  await db.delete(usersTable).where(and(isNotNull(usersTable.deletedAt), lt(usersTable.deletedAt, before)));
}