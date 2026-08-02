---
name: Drawing register product decisions
description: Durable product and data decisions for the architectural drawing management app.
---

The product is centered on a searchable architectural drawing register rather than generic project tasks. Drawings carry discipline, status, revision, project, sheet size, author, due date, and issue date; dashboard counts and activity are derived from that register.

Drawing files are stored in object storage without sign-in; each drawing keeps an upload history recording the file, uploader-entered name, timestamp, size, and type.

Reviewers use the register primarily on mobile and leave named comments directly under each drawing; comments are chronological review records, not private notes.

The product is intentionally single-purpose: the drawing register is the home screen, with drawing detail/review pages only; do not reintroduce dashboard or settings navigation unless explicitly requested.

Drawings are organized by project in the register, with project headings, drawing counts, and a project filter; unassigned drawings remain grouped under “Unassigned.”

Projects are persisted as their own selectable records, and drawing creation/editing uses a project dropdown rather than free-text project names. User-facing drawing metadata is intentionally minimal: drawing number, title, discipline, status, and project; revision, sheet size, author, due date, and notes are not part of the visible drawing workflow.

**Why:** The user clarified the domain after the initial generic project-management direction, so future work should preserve the drawing-register vocabulary and workflow.

**How to apply:** Extend drawing metadata and review/issue workflows before introducing unrelated project-management entities.