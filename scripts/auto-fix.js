import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const EXTENSIONS = [".ts", ".tsx"];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (EXTENSIONS.some(ext => full.endsWith(ext))) {
      results.push(full);
    }
  }

  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // RULE 1: normalize lib ? server imports
  content = content
    .replace(/@\/lib\//g, "@/server/")
    .replace(/\.\.\/lib\//g, "@/server/");

  // RULE 2: remove merge conflict markers
  content = content
    .replace(/<<<<<<</g, "")
    .replace(/=======/g, "")
    .replace(/>>>>>>>.*$/gm, "");

  // RULE 3: remove duplicate imports (basic safety pass)
  const lines = content.split("\n");
  const seen = new Set();
  const cleaned = [];

  for (const line of lines) {
    if (line.startsWith("import ")) {
      if (seen.has(line)) continue;
      seen.add(line);
    }
    cleaned.push(line);
  }

  content = cleaned.join("\n");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Fixed:", filePath);
  }
}

const files = walk(path.join(ROOT, "src"));

for (const file of files) {
  fixFile(file);
}

console.log("Auto-fix complete");
