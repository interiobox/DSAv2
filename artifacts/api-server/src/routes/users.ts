import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  CreateUserResponse,
  ListUsersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(asc(usersTable.name));
  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  if (!name) {
    res.status(400).json({ error: "User name is required" });
    return;
  }

  const existingUsers = await db.select({ name: usersTable.name }).from(usersTable);
  const duplicate = existingUsers.some((user) => user.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (duplicate) {
    res.status(409).json({ error: "A user with this name already exists" });
    return;
  }

  const [user] = await db.insert(usersTable).values({ name }).returning();
  res.status(201).json(CreateUserResponse.parse(user));
});

export default router;