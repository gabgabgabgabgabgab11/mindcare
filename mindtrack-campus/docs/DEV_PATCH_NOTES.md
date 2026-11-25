# Updating the public patch notes

Edit `frontend/frontend/src/content/dev-patch-notes.json`. This is the single source for the **What’s new** card on the sign-in page, below Professional Guidance.

Put the newest entry first. Each entry has a version label, an ISO date (`YYYY-MM-DD`), a short title, and a list of changes. Example:

```json
[
  {
    "version": "November update",
    "date": "2026-11-25",
    "title": "A smoother MindCare visit",
    "changes": [
      "Describe a change students can use.",
      "Describe a fix that has been released."
    ]
  }
]
```

Keep previous entries below the newest one, separated by commas. Use double quotes; JSON does not allow comments or trailing commas. An empty array `[]` hides the card. The card scrolls when the history grows and is visible below the sign-in form on mobile.

Save the file, run `npm run build` in `frontend/frontend`, and deploy the frontend through the normal release process. Edits appear after deployment; this is not a dashboard editor. Only include public release information, never student information, credentials, or private incident details.

The student guide is at `/user-manual`, with its content in `frontend/frontend/src/pages/UserManual.tsx`. Update it when student workflows change.
