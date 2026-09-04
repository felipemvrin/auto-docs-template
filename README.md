# auto-docs-action

GitHub Action reutilizable para cualquier repositorio GitHub. Genera o actualiza un archivo markdown de estado con los últimos commits, archivos modificados recientemente, pendientes `TODO`/`FIXME` y próximos pasos sugeridos.

La versión actual funciona en modo `rules`. El input `ai` está reservado para una futura implementación y actualmente usa la misma lógica basada en reglas.

## ¿Qué hace la action?

En cada ejecución, la action:

1. Lee los últimos 10 commits del repositorio (`git log`).
2. Detecta los archivos modificados entre el commit anterior y el actual (`git diff --name-only HEAD~1 HEAD`).
3. Busca comentarios `TODO`/`FIXME` en archivos `.js`, `.ts`, `.py`, `.jsx` y `.tsx`.
4. Genera sugerencias simples de próximos pasos basadas en lo anterior.
5. Escribe todo el resultado como markdown en el archivo indicado por `status-file` (por defecto `STATUS.md`).

## Uso en cualquier proyecto

No necesitas copiar código de esta action al repositorio consumidor. Crea el archivo `.github/workflows/auto-docs.yml` en cualquier proyecto GitHub y referencia la versión publicada:

```yaml
name: Auto Docs

on:
  push:
    branches:
      - main
  workflow_dispatch:
  paths-ignore:
    - STATUS.md

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
        uses: felipemvrin/auto-docs-template@v1
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

El ejemplo funciona para proyectos JavaScript, TypeScript, Python y repositorios mixtos. `actions/checkout` usa `fetch-depth: 2` porque la action compara `HEAD` con `HEAD~1`.

### Usar otro nombre o carpeta

Puedes guardar el resultado en cualquier ruta relativa dentro del repositorio:

```yaml
- name: Actualizar estado
  uses: felipemvrin/auto-docs-template@v1
  with:
    status-file: "docs/project-status.md"
```

La carpeta se crea automáticamente. No se permiten rutas absolutas ni rutas que salgan del repositorio.

### Publicar una nueva versión

Los repositorios consumidores deben usar un tag estable como `@v1`. Al publicar cambios compatibles, mueve el tag y súbelo al repositorio de la action:

```bash
git tag -f v1
git push origin v1 --force
```

Para probar una versión concreta, usa su commit o tag exacto, por ejemplo `@v1.0.0`.

## Inputs

| Input         | Descripción                                  | Requerido | Default      |
|---------------|-----------------------------------------------|-----------|--------------|
| `mode`        | Modo de generación: `rules` (operativo) o `ai` (reservado; actualmente usa reglas) | No | `rules`      |
| `status-file` | Ruta **relativa al workspace** donde se escribirá el estado generado | No | `STATUS.md`  |

> Nota: por seguridad, `status-file` debe apuntar a una ruta dentro del repositorio (`GITHUB_WORKSPACE`). Si incluyes subcarpetas, se crean automáticamente.

## Desarrollo

Esta action está escrita en Node.js y se distribuye compilada con [`@vercel/ncc`](https://github.com/vercel/ncc) en la carpeta `dist/`, la cual **sí se commitea** al repositorio (es un requisito de las GitHub Actions basadas en Node).

```bash
npm install
npm run build
```
