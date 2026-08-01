# Project Rules

- **Git Push Reminder**: Al finalizar la sesión o concluir una tarea importante, recuerda siempre al usuario hacer commit y push del repositorio actualizado a Git (`git status`, `git add`, `git commit`, `git push`).
- **Autosave Git (Cada 1 hora)**: Cada 1 hora durante la sesión activa, verifica si existen modificaciones en el proyecto (`git status`). **Únicamente si hay cambios o nuevos archivos**, ejecuta automáticamente `git add .`, un `git commit` descriptivo y `git push`. Si no hay cambios, no realiza ninguna acción.

## Git Workflow Rule
Whenever the user requests "GIT" or asks to save/sync changes:
1. Always run `git add .` (or `git add -A`).
2. Always run `git commit -m "<descriptive message>"`.
3. Always run `git push` to ensure all commits are pushed to the remote repository so the user can pull them on other machines (e.g. desktop PC).

## Multi-Agent Skills Integration & JIT Dynamic Skill Router (`aas-stack.json`)
1. **Dynamic Skill Selection**: Subagents must inspect `aas-stack.json` to identify skills relevant to their domain before executing tasks.
2. **JIT Context Scope**: No agent shall load more than 2-3 skills per task execution turn.
3. **Context Purging**: When delegating or completing tasks, release skill context to keep prompt token consumption under 15% of context window.
4. **Self-Healing Loop**: If a test or build fails, `qa-engineer` or `code-reviewer` must trigger the self-healing loop back to `backend-dev` or `frontend-dev` with exact log diagnostics without modifying production files directly.


