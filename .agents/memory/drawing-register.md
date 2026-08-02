---
name: Drawing register product decisions
description: Durable product and data decisions for the architectural drawing management app.
---

The product is centered on a searchable architectural drawing library rather than generic project tasks. Drawings carry discipline, status, revision, project, sheet size, author, due date, and issue date; dashboard counts and activity are derived from that library.

Drawing files are stored in object storage behind Clerk authentication; each drawing keeps an upload history recording the signed-in user's display name, timestamp, size, and type.

Reviewers use the library primarily on mobile and leave named comments directly under each drawing; comments are chronological review records, not private notes.

The product is intentionally single-purpose: the drawing library is the home screen, with drawing detail/review pages only; do not reintroduce dashboard or settings navigation unless explicitly requested.

Drawings are organized by project in the library, with project headings, drawing counts, and a project filter; unassigned drawings remain grouped under “Unassigned.”

Projects are persisted as their own selectable records, and drawing creation/editing uses a project dropdown rather than free-text project names. User-facing drawing metadata is intentionally minimal: drawing name, discipline, status, and project; drawing numbers, revision, sheet size, author, due date, and notes are not part of the visible drawing workflow.

**Why:** The user clarified the domain after the initial generic project-management direction, so future work should preserve the drawing-register vocabulary and workflow.

**How to apply:** Extend drawing metadata and review/issue workflows before introducing unrelated project-management entities.

Assignments remain shared directory-based work records rather than permission rules: users are added to a persisted team directory, then selected when assigning drawings, while the signed-in Clerk profile is used when claiming work. The Assignments view groups drawings by assignee and derives visible progress from the existing drawing status workflow.

**Why:** The app now needs account-level identity for uploads, comments, assignment claims, and personal activity while retaining the shared roster and workload visibility.

**How to apply:** Use Clerk's authenticated profile for new user-attributed actions; preserve the directory picker for assigning work to others and keep status as the single source of truth for assignment-board progress.

My Feed combines active and completed drawings assigned to the signed-in user's display name with activity records whose actor is the signed-in Clerk user ID. New activity writes should continue recording that stable actor ID rather than parsing free-form messages.

**Why:** Display names are needed for the drawing UI and persisted assignment records, but stable Clerk IDs are required to reliably filter personal history.

**How to apply:** Keep the profile-name fallback order consistent across upload, comment, assignment, and feed surfaces; use actor IDs for “What I did” filtering.