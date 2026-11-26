#!/usr/bin/env node
// Генерирует src/lib/base-path-generated.ts с захардкоженным basePath.
// Запускается перед `next build` через `prebuild` скрипт в package.json.
// Надёжнее чем NEXT_PUBLIC_ env vars — Turbopack в Next.js 16 нестабильно
// инлайнит process.env.NEXT_PUBLIC_* в клиентский бандл при статическом экспорте.

const fs = require("fs");
const path = require("path");

const isExport = process.env.BUILD_EXPORT === "true";
const basePath = isExport ? "/chest-thief" : "";

const outDir = path.join(__dirname, "..", "src", "lib");
const outFile = path.join(outDir, "base-path-generated.ts");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = `// АВТО-СГЕНЕРИРОВАНО scripts/gen-base-path.js — НЕ редактируйте вручную.
// Генерируется перед \`next build\` чтобы basePath был захардкожен в бандл.
// В dev-сервере = "" (пусто), в статическом экспорте = "/chest-thief".
export const BASE_PATH: string = ${JSON.stringify(basePath)};
`;

fs.writeFileSync(outFile, content, "utf8");
console.log(`[gen-base-path] Wrote ${outFile} with BASE_PATH=${JSON.stringify(basePath)}`);
