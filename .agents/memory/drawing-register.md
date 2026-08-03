---
name: Drawing register product decisions
description: Durable product and data decisions for the architectural drawing management app.
---

The product is centered on a searchable architectural drawing library rather than generic project tasks. Drawings carry discipline, status, revision, project, sheet size, author, due date, and issue date; dashboard counts and activity are derived from that library.

Drawing files are stored in object storage behind first-party portal authentication; each drawing keeps an upload history recording the signed-in user's display name, timestamp, size, and type.

Reviewers use the library primarily on mobile and leave named comments directly under each drawing; comments are chronological review records, not private notes.

The product is intentionally single-purpose: the drawing library remains the core workflow, while dashboard, notifications, chat, and settings are supporting navigation explicitly requested for coordination.

Drawings are organized by project in the library, with project headings, drawing counts, and a project filter; unassigned drawings remain grouped under “Unassigned.”

Projects are persisted as their own selectable records, and drawing creation/editing uses a project dropdown rather than free-text project names. User-facing drawing metadata is intentionally minimal: drawing name, discipline, status, and project; drawing numbers, revision, sheet size, author, due date, and notes are not part of the visible drawing workflow.

**Why:** The user clarified the domain after the initial generic project-management direction, so future work should preserve the drawing-register vocabulary and workflow.

**How to apply:** Extend drawing metadata and review/issue workflows before introducing unrelated project-management entities.

Assignments remain shared directory-based work records rather than permission rules: users are added to a persisted team directory, then selected when assigning drawings, while the signed-in portal profile is used when claiming work. The Assignments view groups drawings by assignee and derives visible progress from the existing drawing status workflow.

**Why:** The app now needs account-level identity for uploads, comments, assignment claims, and personal activity while retaining the shared roster and workload visibility.

**How to apply:** Use the authenticated portal profile for new user-attributed actions; preserve the directory picker for assigning work to others and keep status as the single source of truth for assignment-board progress.

My Feed combines active and completed drawings assigned to the signed-in user's display name with activity records whose actor is the signed-in portal user ID. New activity writes should continue recording that stable actor ID rather than parsing free-form messages.

**Why:** Display names are needed for the drawing UI and persisted assignment records, but stable local portal account IDs are required to reliably filter personal history.

**How to apply:** Keep the profile-name fallback order consistent across upload, comment, assignment, and feed surfaces; use actor IDs for “What I did” filtering.

Destructive drawing and account-management actions are administrator-only; regular users can edit drawing records, while the standalone Users directory is an administrator-only page. The shared roster endpoint remains available for assignment pickers.

**Why:** The portal needs collaborative editing without allowing regular users to remove shared records or browse the full directory page.

**How to apply:** Keep delete controls and delete APIs role-gated, redirect non-admins away from `/users`, and preserve only the minimum roster access needed by Assignments.

Reusable checklist templates are separate from project checklist instances; applying a template snapshots its items so later template edits do not rewrite active project work.

**Why:** Project teams need stable, auditable checklist progress even when the organization improves its standard template.

**How to apply:** Treat templates as reusable definitions and project checklists as independent working records with their own item completion and attribution.

Team chat is persisted as channels plus messages, with the signed-in local portal user recorded as the message author; the UI refreshes active conversations on a short polling interval.

**Why:** Drawing-review and site-coordination conversations need to survive reloads and be visible to other authenticated users without requiring a WebSocket service.

**How to apply:** Keep channel/message mutations behind portal authentication, use generated API hooks, and preserve immediate local updates plus periodic freshness for the active channel.

Every drawing mutation is mirrored into the persistent `drawing-reviews` chat channel, including metadata/status edits, assignments, uploads, comments, discipline changes, and deletion.

**Why:** The team needs one durable conversation stream that reflects the drawing library’s audit trail without requiring users to manually repost changes.

**How to apply:** Route server-side drawing activity through the shared activity helper so UI, API, and admin-originated mutations remain covered.

The navigation now includes operational views for projects, review queue, activity, deadlines, archive, notifications, reports, standards, issue register, files, team directory, and personal settings.

**Why:** The portal should support the complete drawing-review workflow without turning the existing single-purpose drawing library into an unrelated project-management system.

**How to apply:** Prefer live aggregations of drawings, projects, comments, uploads, checklists, users, and activity; keep settings local to the signed-in browser unless a server preference model is explicitly added.

My Feed is a distinct user-specific workspace and should remain a primary navigation destination even when shared Activity, Reports, or Team Directory tabs are consolidated or hidden.

**Why:** The user needs a personal view of assigned work and their own actions, which is not interchangeable with shared audit history or team-wide notifications.

**How to apply:** Preserve `/feed` and its sidebar entry during navigation simplification; remove only truly overlapping shared aggregation tabs.

Assignments and comments should retain stable portal user IDs alongside display names; legacy name-based records remain readable, but new notification and ownership checks should prefer IDs.

**Why:** Display names can be duplicated or changed, and using them as identity caused incorrect assignment notifications and comment impersonation risks.

**How to apply:** Resolve new assignments to active users, notify by stored ID, derive comment authorship from the session, and allow comment edits/deletes only for the author or an administrator.

Personal notifications are persisted per portal user and are created for username mentions, drawing assignments, and assigned-drawing status changes; chat and comment mention delivery currently uses short polling rather than a WebSocket.

**Why:** The portal needs reliable unread/read state across reloads while preserving the existing simple deployment model.

**How to apply:** Keep notification records recipient-scoped, never cache private API responses in the service worker, and resolve mentions against active portal usernames while excluding the author.

The PWA service worker caches only the static application shell and same-origin non-API assets; authenticated API data remains network-only with an offline shell fallback.

**Why:** Installability and offline navigation are useful for site work, but caching private drawing data could expose stale or cross-user information.

**How to apply:** Expand static shell caching deliberately and keep `/api/` requests out of the cache strategy.