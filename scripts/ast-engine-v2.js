import fs from "fs";
import path from "path";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";

const ROOT = process.cwd();
const files = [];

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) walk(full);
    else if (file.endsWith(".ts") || file.endsWith(".tsx")) files.push(full);
  }
}

// Track imports globally (cross-file safety layer)
const globalImports = new Map();

function fixAST(code, filePath) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"]
  });

  const localImports = new Set();
  const seenFunctions = new Set();

  traverse.default(ast, {
    ImportDeclaration(path) {
      const key = path.node.source.value;

      // normalize lib ? server
      path.node.source.value = key
        .replace("@/lib/", "@/server/")
        .replace("../lib/", "@/server/");

      const sig = path.node.source.value + "::" +
        path.node.specifiers.map(s => s.local.name).join(",");

      if (localImports.has(sig)) {
        path.remove();
      } else {
        localImports.add(sig);
      }
    },

    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (!name) return;

      if (seenFunctions.has(name)) {
        path.remove(); // prevents duplicate redeclare crashes
      } else {
        seenFunctions.add(name);
      }
    },

    Identifier(path) {
      // reserved for future semantic fixes
    }
  });

  return generate.default(ast, {}, code).code;
}

walk(path.join(ROOT, "src"));

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const fixed = fixAST(original, file);

  if (fixed !== original) {
    fs.writeFileSync(file, fixed);
    console.log("AST-fixed:", file);
  }
}

console.log("AST Engine v2 complete");
