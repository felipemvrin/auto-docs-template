# auto-docs-action

GitHub Action reusable que actualiza automáticamente un archivo de estado (por defecto `STATUS.md`) con información relevante del repositorio: últimos commits, archivos modificados recientemente, pendientes detectados (`TODO`/`FIXME`) en el código y sugerencias de próximos pasos.

## ¿Qué hace la action?

En cada ejecución, la action:

1. Lee los últimos 10 commits del repositorio (`git log`).
2. Detecta los archivos modificados entre el commit anterior y el actual (`git diff --name-only HEAD~1 HEAD`).
3. Busca comentarios `TODO`/`FIXME` en archivos `.js`, `.ts`, `.py`, `.jsx` y `.tsx`.
4. Genera sugerencias simples de próximos pasos basadas en lo anterior.
5. Escribe todo el resultado como markdown en el archivo indicado por `status-file` (por defecto `STATUS.md`).

## Instalación y uso

Agrega un workflow en tu repositorio, por ejemplo en `.github/workflows/auto-docs.yml`:

```yaml
name: Auto Docs

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Actualizar documentación
        uses: tu-usuario/auto-docs-action@v1
        with:
          mode: "rules"
          status-file: "STATUS.md"

      - name: Commit y push de los cambios
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add STATUS.md
          git diff --cached --quiet || git commit -m "docs: actualizar STATUS.md automáticamente"
          git push
```

Reemplaza `tu-usuario/auto-docs-action` por la ruta real del repositorio donde publiques esta action.

## Inputs

| Input         | Descripción                                  | Requerido | Default      |
|---------------|-----------------------------------------------|-----------|--------------|
| `mode`        | Modo de generación de documentación: `rules` (basado en reglas) o `ai` (aún no implementado) | No | `rules`      |
| `status-file` | Ruta **relativa al workspace** donde se escribirá el estado generado | No | `STATUS.md`  |

> Nota: por seguridad, `status-file` debe apuntar a una ruta dentro del repositorio (`GITHUB_WORKSPACE`). Si incluyes subcarpetas, se crean automáticamente.

## Desarrollo

Esta action está escrita en Node.js y se distribuye compilada con [`@vercel/ncc`](https://github.com/vercel/ncc) en la carpeta `dist/`, la cual **sí se commitea** al repositorio (es un requisito de las GitHub Actions basadas en Node).

```bash
npm install
npm run build
```
