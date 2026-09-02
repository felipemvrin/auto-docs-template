const core = require("@actions/core");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ejecuta un comando de shell y devuelve su salida como texto, o un mensaje
// de fallback si el comando falla (por ejemplo, historial insuficiente).
function runCommand(command, fallback = "") {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    core.warning(`Comando falló: "${command}" -> ${error.message}`);
    return fallback;
  }
}

// Obtiene los últimos commits del repo (hash corto + mensaje).
function getRecentCommits() {
  const output = runCommand(
    'git log -10 --pretty=format:"- %h %s (%an, %ar)"',
    "No se pudo obtener el historial de commits."
  );
  return output || "No hay commits disponibles.";
}

// Obtiene los archivos modificados entre el commit anterior y el actual.
function getRecentlyModifiedFiles() {
  const output = runCommand(
    "git diff --name-only HEAD~1 HEAD",
    ""
  );
  if (!output) {
    return "No se detectaron cambios respecto al commit anterior.";
  }
  return output
    .split("\n")
    .filter(Boolean)
    .map((file) => `- ${file}`)
    .join("\n");
}

// Busca ocurrencias de TODO/FIXME en archivos de código fuente comunes.
function findPendingTasks() {
  const extensions = ["*.js", "*.ts", "*.py", "*.jsx", "*.tsx"];
  const includeArgs = extensions.map((ext) => `--include="${ext}"`).join(" ");
  // -r: recursivo, -n: número de línea, -E: regex extendido para TODO|FIXME
  const command = `grep -rnE "TODO|FIXME" ${includeArgs} --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .`;
  const output = runCommand(command, "");

  if (!output) {
    return "No se encontraron pendientes (TODO/FIXME) en el código.";
  }

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

// Genera sugerencias simples de próximos pasos basadas en lo detectado.
function getSuggestedNextSteps(pendingTasksSection) {
  const suggestions = [];

  if (pendingTasksSection.includes("TODO") || pendingTasksSection.includes("FIXME")) {
    suggestions.push("- Revisar y resolver los TODO/FIXME detectados en el código.");
  }

  suggestions.push("- Verificar que los últimos cambios cuenten con pruebas asociadas.");
  suggestions.push("- Actualizar la documentación si los archivos modificados afectan la API pública.");
  suggestions.push("- Revisar el pipeline de CI/CD para asegurar que los cambios pasen correctamente.");

  return suggestions.join("\n");
}

// Construye el contenido markdown final combinando todas las secciones.
function buildMarkdownContent() {
  const recentCommits = getRecentCommits();
  const modifiedFiles = getRecentlyModifiedFiles();
  const pendingTasks = findPendingTasks();
  const nextSteps = getSuggestedNextSteps(pendingTasks);
  const timestamp = new Date().toISOString();

  return `# Estado del proyecto

_Generado automáticamente el ${timestamp}_

## Últimos cambios

${recentCommits}

## Archivos modificados recientemente

${modifiedFiles}

## Pendientes detectados (TODO/FIXME)

${pendingTasks}

## Próximos pasos sugeridos

${nextSteps}
`;
}

function resolveStatusFilePath(statusFile) {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const candidatePath = statusFile || "STATUS.md";
  const resolvedPath = path.resolve(workspace, candidatePath);
  const relativePath = path.relative(workspace, resolvedPath);

  if (
    path.isAbsolute(candidatePath) ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(
      `El input "status-file" debe ser una ruta relativa dentro de ${workspace}.`
    );
  }

  return resolvedPath;
}

// Punto de entrada principal de la action.
async function run() {
  try {
    const mode = core.getInput("mode") || "rules";
    const statusFile = resolveStatusFilePath(core.getInput("status-file"));

    core.info(`Modo seleccionado: ${mode}`);
    core.info(`Archivo de estado: ${statusFile}`);

    if (mode !== "rules") {
      core.warning(`El modo "${mode}" no está implementado todavía; usando lógica basada en reglas.`);
    }

    const markdownContent = buildMarkdownContent();

    fs.mkdirSync(path.dirname(statusFile), { recursive: true });
    fs.writeFileSync(statusFile, markdownContent, "utf-8");
    core.info(`Archivo "${statusFile}" actualizado correctamente.`);
  } catch (error) {
    core.setFailed(`La action falló: ${error.message}`);
  }
}

run();
