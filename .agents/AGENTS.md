# Project Rules

- **Git Push Reminder**: Al finalizar la sesión o concluir una tarea importante, recuerda siempre al usuario hacer commit y push del repositorio actualizado a Git (`git status`, `git add`, `git commit`, `git push`).
- **Autosave Git (Cada 1 hora)**: Cada 1 hora durante la sesión activa, verifica si existen modificaciones en el proyecto (`git status`). **Únicamente si hay cambios o nuevos archivos**, ejecuta automáticamente `git add .`, un `git commit` descriptivo y `git push`. Si no hay cambios, no realiza ninguna acción.

## Git Workflow Rule
Whenever the user requests "GIT" or asks to save/sync changes:
1. Always run `git add .` (or `git add -A`).
2. Always run `git commit -m "<descriptive message>"`.
3. Always run `git push` to ensure all commits are pushed to the remote repository so the user can pull them on other machines (e.g. desktop PC).

