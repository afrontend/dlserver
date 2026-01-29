import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

describe("package.json", () => {
  describe("required fields", () => {
    it("should have a name", () => {
      assert.strictEqual(pkg.name, "dlserver");
    });

    it("should have a version", () => {
      assert.ok(pkg.version);
      assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
    });

    it("should have a description", () => {
      assert.ok(pkg.description);
      assert.strictEqual(typeof pkg.description, "string");
    });

    it("should be an ES module", () => {
      assert.strictEqual(pkg.type, "module");
    });

    it("should have a license", () => {
      assert.strictEqual(pkg.license, "MIT");
    });
  });

  describe("scripts", () => {
    it("should have dev script", () => {
      assert.strictEqual(pkg.scripts.dev, "vite");
    });

    it("should have build script", () => {
      assert.strictEqual(pkg.scripts.build, "vite build");
    });

    it("should have webapp script", () => {
      assert.strictEqual(pkg.scripts.webapp, "tsx server.ts");
    });

    it("should have typecheck script", () => {
      assert.strictEqual(pkg.scripts.typecheck, "tsc --noEmit");
    });

    it("should have mcpsse script", () => {
      assert.ok(pkg.scripts.mcpsse);
    });

    it("should have mcpstdio script", () => {
      assert.ok(pkg.scripts.mcpstdio);
    });
  });

  describe("engines", () => {
    it("should require Node.js >= 22.22.0", () => {
      assert.strictEqual(pkg.engines.node, ">=22.22.0");
    });
  });

  describe("dependencies", () => {
    it("should have express", () => {
      assert.ok(pkg.dependencies.express);
    });

    it("should have dongnelibrary", () => {
      assert.ok(pkg.dependencies.dongnelibrary);
    });

    it("should have @modelcontextprotocol/sdk", () => {
      assert.ok(pkg.dependencies["@modelcontextprotocol/sdk"]);
    });

    it("should have react", () => {
      assert.ok(pkg.dependencies.react);
    });

    it("should have react-dom", () => {
      assert.ok(pkg.dependencies["react-dom"]);
    });
  });

  describe("devDependencies", () => {
    it("should have typescript", () => {
      assert.ok(pkg.devDependencies.typescript);
    });

    it("should have vite", () => {
      assert.ok(pkg.devDependencies.vite);
    });

    it("should have tsx", () => {
      assert.ok(pkg.devDependencies.tsx);
    });
  });

  describe("repository", () => {
    it("should have repository type", () => {
      assert.strictEqual(pkg.repository.type, "git");
    });

    it("should have valid repository URL", () => {
      assert.ok(pkg.repository.url.includes("github.com/afrontend/dlserver"));
    });

    it("should have bugs URL", () => {
      assert.strictEqual(
        pkg.bugs.url,
        "https://github.com/afrontend/dlserver/issues"
      );
    });

    it("should have homepage", () => {
      assert.strictEqual(
        pkg.homepage,
        "https://github.com/afrontend/dlserver#readme"
      );
    });
  });

  describe("keywords", () => {
    it("should include dongnelibrary keyword", () => {
      assert.ok(pkg.keywords.includes("dongnelibrary"));
    });

    it("should include mcp-server keyword", () => {
      assert.ok(pkg.keywords.includes("mcp-server"));
    });
  });
});
