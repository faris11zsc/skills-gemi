---
name: gh-pages-url-generator
description: Generates a GitHub Pages URL for a repository and file path. Use this to quickly provide the live URL for a file hosted on GitHub Pages (Android/iOS clickable).
---

# GitHub Pages URL Generator

This skill automates the calculation of the public GitHub Pages URL based on a repository link and a file path.

## Workflow

1.  **Extract Info**: Identify the GitHub `username`, `repository name`, and `file path`.
2.  **Determine URL Type**:
    *   **User/Org Site**: If the repo name is `<username>.github.io`, the base URL is `https://<username>.github.io/`.
    *   **Project Site**: If the repo name is anything else, the base URL is `https://<username>.github.io/<repository-name>/`.
3.  **Append File Path**:
    *   If the file path is `index.html` or at the root, you can often omit it.
    *   If it's a specific file, append it to the base URL.
4.  **Format for Mobile**: Provide the final link clearly so it can be clicked on Android or iOS.

## Examples

- **Input**: `https://github.com/faris11zsc/-arabic-ninja-game` + `index.html`
  - **Output**: `https://faris11zsc.github.io/-arabic-ninja-game/`

- **Input**: `https://github.com/user/my-app` + `game.html`
  - **Output**: `https://user.github.io/my-app/game.html`

- **Input**: `https://github.com/my-org/my-org.github.io` + `docs/index.html`
  - **Output**: `https://my-org.github.io/docs/`
