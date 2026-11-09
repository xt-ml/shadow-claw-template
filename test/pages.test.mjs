import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHADOW_CLAW_LOBSTER_HASHES = new Set([
  "33a5914fdb9b42c622ceb4bdfd421d7c8792ce3809a10acc83dd356a975c1f66", // 48.png
  "a48ba6e50b2f8c54ee08480cb131365372757e9677e71fb09996395e3dacc086", // 72.png
  "1c7002983e6a36a309914466acf7aa98044b95e7fb940c17a03189638aa54a1d", // 96.png
  "4c1f774f8df852836dfbac0ac9400f0ae9fe9d3f340379f7588dbfee599c8e59", // 128.png
  "7d8bb2f52284861d86f389820f887c9b804e15f347cc3b38777612abc3c37e1f", // 152.png
  "9898621a296cc836d79a2b8881fe126bd73823eb53a8fbabbb9a0761e0280cc4", // 180.png
  "46fe87f35e8d62257eda46149045bad8edd8e382d22f0df92a4a635e0286e8a0", // 192.png
  "02c2881dbb68aa86e5e499c38c893386c1af4f048d557438987b7c2e7286eace", // 512.png
  "423e9e930bd88b9e7f28087b1a1a26e55f6c75426996d10172596e939833f5f2", // 1024.png
  "035f49ba449226300ac237220e8a5ed0472ea77885dee63a978f3db35128adda", // favicon.ico
  "8aa7e215fa7ebe34bb5a12f1842f75caa365659733c460caa42d038afe25911b", // shadow-claw-screenshot-1920x1052.png
  "7997952cc418887610d1d24d3306805ccf028d9b6f73740d456042eb0592f5e9", // shadow-claw-screenshot-731x1045.png
]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

test("PWA Manifest: Template manifest metadata and isolation", () => {
  const manifestPath = resolve(ROOT, "pages/resources/manifest.json");
  assert.ok(existsSync(manifestPath), "manifest.json must exist");

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.id, "shadow-claw-template");
  assert.equal(manifest.scope, ".");
  assert.equal(manifest.start_url, ".");
  assert.equal(manifest.theme_color, "#121212");
  assert.equal(manifest.background_color, "#121212");

  const iconSources = manifest.icons.map((i) => i.src);
  assert.ok(
    !iconSources.includes("assets/icons/favicon.svg"),
    "manifest.icons must not include SVG favicon (avoids Chrome DevTools image decode failure)",
  );
  assert.ok(
    iconSources.includes("assets/icons/180.png"),
    "Must include 180.png for Apple/high-res launchers",
  );
  assert.ok(
    iconSources.includes("assets/icons/192.png"),
    "Must include 192.png",
  );
  assert.ok(
    iconSources.includes("assets/icons/512.png"),
    "Must include 512.png",
  );

  // Screenshots: must include both wide (desktop) and narrow (mobile) for Richer PWA Install UI
  const screenshots = manifest.screenshots || [];
  assert.ok(
    screenshots.some((s) => s.form_factor === "wide"),
    "manifest.screenshots must include a wide screenshot for desktop Richer PWA Install UI",
  );
  assert.ok(
    screenshots.some((s) => s.form_factor === "narrow" || !s.form_factor),
    "manifest.screenshots must include a narrow/mobile screenshot for mobile Richer PWA Install UI",
  );
  for (const s of screenshots) {
    assert.doesNotMatch(
      s.src,
      /shadow-claw-screenshot/,
      "Must not reference default ShadowClaw red lobster screenshot",
    );
    const screenshotPath = resolve(ROOT, "pages/resources", s.src);
    assert.ok(
      existsSync(screenshotPath),
      `Screenshot file ${s.src} must exist on disk`,
    );
  }
});

test("Site Config: Template branding points to raster apple-touch-icon and defines custom logo", () => {
  const configPath = resolve(ROOT, "shadow-claw.config.json");
  assert.ok(existsSync(configPath), "shadow-claw.config.json must exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.branding.faviconPath, "assets/icons/favicon.svg");
  assert.equal(config.branding.appleTouchIconPath, "assets/icons/180.png");
  assert.ok(
    config.branding.logoSlotHtml &&
      config.branding.logoSlotHtml.includes("<svg"),
    "branding.logoSlotHtml must provide custom template SVG logo",
  );
});

test("Iconography: Template icons are template-specific and do not collide with default ShadowClaw lobster icons", () => {
  const iconsDir = resolve(ROOT, "pages/resources/assets/icons");
  assert.ok(existsSync(iconsDir), "assets/icons directory must exist");

  const requiredIcons = [
    "favicon.svg",
    "favicon.ico",
    "apple-touch-icon.png",
    "48.png",
    "72.png",
    "96.png",
    "128.png",
    "152.png",
    "180.png",
    "192.png",
    "512.png",
    "1024.png",
  ];

  for (const iconName of requiredIcons) {
    const iconPath = resolve(iconsDir, iconName);
    assert.ok(existsSync(iconPath), `Icon file ${iconName} must exist`);

    const bytes = readFileSync(iconPath);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(
      !SHADOW_CLAW_LOBSTER_HASHES.has(hash),
      `Icon ${iconName} has hash ${hash} which matches default ShadowClaw lobster icon! Must be template-specific.`,
    );
  }

  // Also verify favicon.svg contains the isometric cube artwork
  const svgContent = readFileSync(resolve(iconsDir, "favicon.svg"), "utf8");
  assert.ok(
    svgContent.includes("#3b82f6") || svgContent.includes("#1d4ed8"),
    "favicon.svg must contain Template isometric cube colors",
  );
});

test("Screenshots: No default ShadowClaw lobster screenshots exist in assets/screenshots", () => {
  const screenshotsDir = resolve(ROOT, "pages/resources/assets/screenshots");
  assert.ok(
    existsSync(screenshotsDir),
    "assets/screenshots directory must exist",
  );

  const files = readdirSync(screenshotsDir);
  assert.ok(files.length > 0, "At least one screenshot must exist");
  for (const file of files) {
    const filePath = resolve(screenshotsDir, file);
    const bytes = readFileSync(filePath);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(
      !SHADOW_CLAW_LOBSTER_HASHES.has(hash),
      `Screenshot ${file} matches default ShadowClaw lobster screenshot!`,
    );
  }
});
