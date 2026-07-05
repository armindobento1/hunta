import { readFileSync } from "node:fs";
import path from "node:path";

describe("Vite application shell", () => {
  it("builds Hunta as a clean-URL React SPA", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };
    const indexHtml = readFileSync(
      path.join(process.cwd(), "index.html"),
      "utf8",
    );
    const vercel = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as { rewrites: Array<{ source: string; destination: string }> };

    expect(packageJson.scripts.dev).toBe("vite");
    expect(packageJson.scripts.build).toBe("tsc --noEmit && vite build");
    expect(packageJson.dependencies).toHaveProperty("react-router-dom");
    expect(packageJson.dependencies).not.toHaveProperty("next");
    expect(indexHtml).toContain('<div id="root"></div>');
    expect(indexHtml).toContain("Hunta — Private hunting portfolio");
    expect(vercel.rewrites).toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
