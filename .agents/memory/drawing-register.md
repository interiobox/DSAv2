---
name: Drawing register product decisions
description: Durable product and data decisions for the architectural drawing management app.
---

The product is centered on a searchable architectural drawing library rather than generic project tasks. Drawings carry discipline, status, revision, project, sheet size, author, due date, and issue date; dashboard counts and activity are derived from that library.

Drawing files are stored in object storage without sign-in; each drawing keeps an upload history recording the file, uploader-entered name, timestamp, size, and type.

Reviewers use the library primarily on mobile and leave named comments directly under each drawing; comments are chronological review records, not private notes.

The product is intentionally single-purpose: the drawing library is the home screen, with drawing detail/review pages only; do not reintroduce dashboard or settings navigation unless explicitly requested.

Drawings are organized by project in the library, with project headings, drawing counts, and a project filter; unassigned drawings remain grouped under “Unassigned.”

Projects are persisted as their own selectable records, and drawing creation/editing uses a project dropdown rather than free-text project names. User-facing drawing metadata is intentionally minimal: drawing name, discipline, status, and project; drawing numbers, revision, sheet size, author, due date, and notes are not part of the visible drawing workflow.

**Why:** The user clarified the domain after the initial generic project-management direction, so future work should preserve the drawing-register vocabulary and workflow.

**How to apply:** Extend drawing metadata and review/issue workflows before introducing unrelated project-management entities.

Assignments are shared, anonymous named records rather than account-based permissions: anyone can claim a drawing for their entered name or assign it to another entered name. The Assignments view groups drawings by assignee and derives visible progress from the existing drawing status workflow.

**Why:** The app intentionally removed authentication, but the team still needs shared ownership and progress visibility without introducing accounts.

**How to apply:** Preserve the self-entered name flow unless authentication is explicitly requested; keep status as the single source of truth for assignment-board progress.