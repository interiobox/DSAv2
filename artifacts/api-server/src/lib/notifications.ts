import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";

type NotificationInput = {
  recipientId: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
};

export async function createNotification(input: NotificationInput) {
  await db.insert(notificationsTable).values({
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link ?? null,
  });
}

export async function notifyUserByName(name: string | null | undefined, input: Omit<NotificationInput, "recipientId">, excludeUserId?: number) {
  const trimmed = name?.trim();
  if (!trimmed) return;
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.name, trimmed)).limit(1);
  if (user && user.id !== excludeUserId) {
    await createNotification({ ...input, recipientId: user.id });
  }
}

export async function notifyMentions(content: string, input: Omit<NotificationInput, "recipientId">, excludeUserId?: number) {
  const usernames = Array.from(new Set(Array.from(content.matchAll(/@([a-z0-9._-]+)/gi), (match) => match[1].toLowerCase())));
  if (!usernames.length) return;
  const users = await db.select({ id: usersTable.id, username: usersTable.username })
    .from(usersTable)
    .where(inArray(usersTable.username, usernames));
  await Promise.all(users.filter((user) => user.id !== excludeUserId).map((user) => createNotification({
    ...input,
    recipientId: user.id,
    message: input.message.replace("{mention}", `@${user.username}`),
  })));
}

export async function notifyDrawingAssignee(drawingId: number, assignedTo: string | null | undefined, input: Omit<NotificationInput, "recipientId">, excludeUserId?: number) {
  await notifyUserByName(assignedTo, { ...input, link: input.link ?? `/drawings/${drawingId}` }, excludeUserId);
}

export async function listUserNotifications(userId: number) {
  return db.select().from(notificationsTable)
    .where(eq(notificationsTable.recipientId, userId))
    .orderBy(asc(notificationsTable.readAt), asc(notificationsTable.createdAt), asc(notificationsTable.id));
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const [notification] = await db.update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.recipientId, userId), isNull(notificationsTable.readAt)))
    .returning();
  return notification;
}