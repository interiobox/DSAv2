import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, drawingActivityTable, drawingsTable } from "@workspace/db";

export function getIdParam(value: string | string[]): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(raw, 10);
}

export function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

export function projectDrawing(row: typeof drawingsTable.$inferSelect) {
  return row;
}

export async function addActivity(
  type: string,
  message: string,
  drawingId?: number,
  actor?: string,
): Promise<void> {
  await db.insert(drawingActivityTable).values({ type, message, drawingId, actor: actor ?? null });
}

export async function getDashboard() {
  const rows = await db.select().from(drawingsTable);
  const today = new Date().toISOString().slice(0, 10);
  const byDiscipline: Record<string, number> = {};
  for (const row of rows) byDiscipline[row.discipline] = (byDiscipline[row.discipline] ?? 0) + 1;
  return {
    totalDrawings: rows.length,
    inReview: rows.filter((row) => row.status === "in_review").length,
    approved: rows.filter((row) => row.status === "approved").length,
    issued: rows.filter((row) => row.status === "issued").length,
    overdue: rows.filter((row) => row.dueDate && row.dueDate < today && row.status !== "issued" && row.status !== "superseded").length,
    byDiscipline,
  };
}

export async function listDrawingRows(filters: {
  search?: string;
  status?: string;
  discipline?: string;
}) {
  const conditions = [];
  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(drawingsTable.drawingNumber, search),
        ilike(drawingsTable.title, search),
        ilike(drawingsTable.projectName, search),
        ilike(drawingsTable.author, search),
      ),
    );
  }
  if (filters.status) conditions.push(eq(drawingsTable.status, filters.status));
  if (filters.discipline) conditions.push(eq(drawingsTable.discipline, filters.discipline));
  return db
    .select()
    .from(drawingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(drawingsTable.drawingNumber));
}