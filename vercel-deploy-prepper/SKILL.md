---
name: vercel-deploy-prepper
description: Interactive assistant for preparing or updating Vercel projects (faresahmed174-6852s-projects). Prioritizes 100% code fidelity via direct file copying.
---

# Vercel Deploy Prepper (Fidelity First)

This skill manages Vercel projects for the dashboard at `https://vercel.com/faresahmed174-6852s-projects`. It is designed to ensure **100% code fidelity** by avoiding manual re-writing of code.

## Interactive Modes

Ask: **"Would you like to (1) Prepare a NEW file for Vercel, or (2) UPDATE a project we already made?"**

### Mode 1: New Deployment
1.  **Request Input:** Ask for the full path of the file or project to deploy.
2.  **Scaffold Project:**
    *   Create a folder: `C:\Users\sdd\vercel-deploy\[project-name]`.
    *   **PHYSICAL COPY (Mandatory):** Use `run_shell_command` with `cp` (e.g., `cp "source" "destination/index.html"`) to move the file. **NEVER** use `write_file` to re-print the code unless transformation is required.
3.  **Analyze & Convert (Only if needed):**
    *   Check for absolute paths (e.g., `C:/`, `D:/`) inside the file.
    *   If found, use surgical `replace` calls to change them to relative paths.
4.  **Deployment Commands:** Provide a single-line PowerShell command for `git init`, `add`, `commit`, `branch`, `remote`, and `push`.

### Mode 2: Update Existing Project
1.  **Identify Folder:** Ask which project folder to update.
2.  **Apply Changes:** Use `cp` to overwrite files with their updated versions.
3.  **Push Update:** Provide a single-line PowerShell command to commit and push.

## Rules
*   **Zero-Corruption Mandate:** NEVER re-type or "summarize" code. Use system copy commands (`cp`, `copy`) to preserve logic, comments, and structure.
*   **Git Identity:** Always check if a git user is set. If not, include identity setup in the deployment one-liner.
*   **One-Line Commands:** Always provide the full sequence of terminal commands as a single, copy-pasteable line.
*   **Clickable Paths:** All file paths must be clickable directories or files.
*   **DASHBOARD URL:** https://vercel.com/faresahmed174-6852s-projects

## Example One-Liner
`cd "C:\Users\sdd\vercel-deploy\my-project"; git init; git add .; git commit -m "Deploy"; git branch -M main; git remote add origin <url>; git push -u origin main`
