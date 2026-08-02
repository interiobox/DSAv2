import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, drawingsTable, projectsTable } from "@workspace/db";
import {
  CreateProjectBody,
  CreateProjectResponse,
  ListProjectsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (_req, res): Promise<void> => {
  const [projects, drawings] = await Promise.all([
    db.select().from(projectsTable).orderBy(asc(projectsTable.name)),
    db.select({ projectName: drawingsTable.projectName }).from(drawingsTable),
  ]);
  const knownNames = new Set(projects.map((project) => project.name.toLocaleLowerCase()));
  const legacyNames = new Map<string, string>();
  for (const drawing of drawings) {
    const name = drawing.projectName.trim();
    const normalizedName = name.toLocaleLowerCase();
    if (name && !knownNames.has(normalizedName)) {
      legacyNames.set(normalizedName, name);
    }
  }
  const legacyProjects = Array.from(legacyNames.values())
    .sort((a, b) => a.localeCompare(b))
    .map((name, index) => ({
      id: -(index + 1),
      name,
      createdAt: new Date(0),
    }));
  res.json(ListProjectsResponse.parse([...projects, ...legacyProjects]));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "Project name is required" });
    return;
  }
  // Project names are case-insensitive for the user-facing picker.
  const [existingProjects, drawings] = await Promise.all([
    db.select().from(projectsTable),
    db.select({ projectName: drawingsTable.projectName }).from(drawingsTable),
  ]);
  const normalizedName = name.toLocaleLowerCase();
  const duplicate = existingProjects.some((project) => project.name.toLocaleLowerCase() === normalizedName)
    || drawings.some((drawing) => drawing.projectName.trim().toLocaleLowerCase() === normalizedName);
  if (duplicate) {
    res.status(409).json({ error: "A project with this name already exists" });
    return;
  }
  const [project] = await db.insert(projectsTable).values({ name }).returning();
  res.status(201).json(CreateProjectResponse.parse(project));
});

export default router;