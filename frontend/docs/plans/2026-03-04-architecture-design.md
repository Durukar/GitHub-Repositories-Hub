# GitHub Repositories Hub Design

## Overview
A web-based tool for bulk management of a user's GitHub repositories. It allows users to authenticate via Personal Access Token, list all their repositories, view visibility status, and toggle visibility in bulk or individually.

## Architecture
**Option 1: Direct Client (Pure Web App) on Cloudflare Pages**
- The application will be a React SPA built with Vite.
- Hosted entirely on Cloudflare Pages.
- No backend/database component is required. The browser will communicate directly with GitHub's REST API (`api.github.com`).
- The user's Personal Access Token (PAT) remains in their browser state/local storage and is never sent to a third-party server.

## Components & Data Flow
1.  **Authentication/Input Panel:**
    -   Inputs for GitHub Username and PAT.
    -   Fetch button to retrieve repositories.
2.  **Repository Data Table:**
    -   Displays Repository ID, Name, URL, and Status (Public/Private).
    -   Checkboxes for selecting repositories to manage.
    -   Action buttons to change visibility status.
3.  **Data Flow:**
    -   `App.tsx` (or extracted hooks) calls `axios.get('https://api.github.com/user/repos')`.
    -   State is maintained via React `useState` (or Zustand if requested, though `useState`/Context is sufficient).
    -   Status updates call `axios.patch` on the specific repository endpoint.

## Error Handling
- Invalid tokens will display an inline error to the user.
- Rate limits (GitHub API limits) will be caught and displayed gracefully.
- Failed repository updates will revert the optimistic UI update and show a toast notification.

## Testing
- Unit tests for the API interaction hooks to ensure proper header formatting.
- Component tests for the data table and selection logic.

## Next Steps
- Strip out the `apps/backend` from the boilerplate.
- Port `App.tsx` logic into `apps/frontend`.
- Refactor `App.tsx` into smaller components (e.g., `RepoTable`, `AuthForm`).
