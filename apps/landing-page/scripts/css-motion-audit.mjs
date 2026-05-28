import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "/Users/stephenhung/Documents/GitHub/extract-site/node_modules/playwright/index.mjs";

const target = process.argv[2] || "http://localhost:3020";
const outDir = process.argv[3] || "reports";
const referenceDir =
  process.argv[4] || "/Users/stephenhung/Documents/GitHub/extract-site/reference/clearpath-template";

const selectors = [
  ".hero",
  ".hero h1",
  ".nav",
  ".hero-panel",
  ".intro",
  ".cards",
  ".story-card",
  ".split",
  ".overlap",
  ".process",
  ".image-break",
  ".price-grid",
  ".gallery",
  ".stats",
  ".booking",
  ".faq",
  "footer",
];

await mkdir(outDir, { recursive: true });

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const referenceMotion = await readJson(`${referenceDir}/motion/per-section.json`, []);
const referenceStyles = await readJson(`${referenceDir}/dom/computed-styles.json`, []);
const referenceStyleCount = Array.isArray(referenceStyles.computed)
  ? referenceStyles.computed.length
  : Array.isArray(referenceStyles)
    ? referenceStyles.length
    : 0;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleMessages = [];
const failedRequests = [];

page.on("console", (message) => {
  consoleMessages.push({ type: message.type(), text: message.text() });
});

page.on("requestfailed", (request) => {
  failedRequests.push({
    url: request.url(),
    method: request.method(),
    failure: request.failure()?.errorText || "unknown",
  });
});

await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
const earlyFrames = [];
for (const delay of [100, 400, 900, 1400]) {
  await page.waitForTimeout(delay === 100 ? 100 : delay - earlyFrames.at(-1).timeMs);
  earlyFrames.push({
    timeMs: delay,
    heroLines: await page.evaluate(() => {
      return [...document.querySelectorAll("[data-hero-line]")].map((el, index) => {
        const style = getComputedStyle(el);
        return {
          index,
          opacity: style.opacity,
          transform: style.transform,
        };
      });
    }),
    heroPanel: await page.evaluate(() => {
      const el = document.querySelector(".hero-panel");
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        opacity: style.opacity,
        transform: style.transform,
      };
    }),
  });
}
await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

const baseState = await page.evaluate(() => {
  const body = document.body;
  const html = document.documentElement;
  return {
    title: document.title,
    scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
    clientHeight: html.clientHeight,
    hasGsap: Boolean(window.gsap),
    hasScrollTrigger: Boolean(window.ScrollTrigger || window.gsap?.plugins?.ScrollTrigger),
    sectionCount: document.querySelectorAll("section").length,
    revealCount: document.querySelectorAll("[data-reveal]").length,
    parallaxCount: document.querySelectorAll("[data-parallax]").length,
  };
});

const animationState = await page.evaluate(() => {
  const animations = document.getAnimations({ subtree: true }).map((animation) => {
    const timing = animation.effect?.getTiming?.() || {};
    const targetElement = animation.effect?.target;
    return {
      selector:
        targetElement instanceof Element
          ? `${targetElement.tagName.toLowerCase()}${targetElement.className ? `.${String(targetElement.className).trim().replace(/\s+/g, ".")}` : ""}`
          : "unknown",
      playState: animation.playState,
      currentTime: animation.currentTime,
      duration: timing.duration,
      delay: timing.delay,
      easing: timing.easing,
    };
  });
  const triggers = window.ScrollTrigger?.getAll?.().map((trigger) => ({
    trigger:
      trigger.trigger instanceof Element
        ? `${trigger.trigger.tagName.toLowerCase()}${trigger.trigger.className ? `.${String(trigger.trigger.className).trim().replace(/\s+/g, ".")}` : ""}`
        : "unknown",
    start: trigger.start,
    end: trigger.end,
    scrub: trigger.vars?.scrub ?? false,
    once: trigger.vars?.once ?? false,
    progress: Number(trigger.progress.toFixed(3)),
  }));
  return { animations, triggers: triggers || [] };
});

const snapshots = [];
for (const y of [0, 600, 1200, 2200, 3400, 4800, 6200, 8200, 10400]) {
  await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
  await page.waitForTimeout(450);
  snapshots.push({
    y,
    sections: await page.evaluate((auditSelectors) => {
      return auditSelectors.map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return { selector, missing: true };
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          selector,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          opacity: style.opacity,
          transform: style.transform,
          color: style.color,
          background: style.backgroundColor,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          transition: style.transition,
        };
      });
    }, selectors),
  });
}

const imageState = await page.evaluate(() => {
  return [...document.images].map((image) => ({
    src: image.currentSrc || image.src,
    alt: image.alt,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    renderedWidth: Math.round(image.getBoundingClientRect().width),
    renderedHeight: Math.round(image.getBoundingClientRect().height),
  }));
});

const hoverState = await page.evaluate(() => {
  return ["a", "button", "summary", "input", "textarea"].map((selector) => {
    const el = document.querySelector(selector);
    if (!el) return { selector, missing: true };
    const style = getComputedStyle(el);
    return {
      selector,
      transition: style.transition,
      background: style.backgroundColor,
      boxShadow: style.boxShadow,
      color: style.color,
    };
  });
});

const dataRevealStates = await page.evaluate(() => {
  return [...document.querySelectorAll("[data-reveal]")].slice(0, 24).map((el, index) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      index,
      tag: el.tagName.toLowerCase(),
      className: String(el.className || ""),
      text: el.textContent?.trim().replace(/\s+/g, " ").slice(0, 90),
      rect: {
        y: Math.round(rect.y),
        height: Math.round(rect.height),
      },
      opacity: style.opacity,
      transform: style.transform,
      visibility: style.visibility,
    };
  });
});

const issues = [];
const expectedViewportFadeCount = referenceMotion.filter((section) => section.hasViewportFade).length;
const imageFailures = imageState.filter((image) => !image.complete || image.naturalWidth === 0);
const zeroSizeImages = imageState.filter(
  (image) => image.naturalWidth > 0 && (image.renderedWidth === 0 || image.renderedHeight === 0),
);
const scrubbedTriggers = animationState.triggers.filter((trigger) => trigger.scrub).length;
const revealTransitions = snapshots
  .flatMap((snapshot) => snapshot.sections)
  .filter((section) => !section.missing && section.transition && section.transition !== "all 0s ease 0s");

if (!baseState.hasGsap || !animationState.triggers.length) {
  issues.push({
    severity: "medium",
    selector: "window.ScrollTrigger",
    evidence: `gsap detected=${baseState.hasGsap}; scrolltrigger count=${animationState.triggers.length}`,
    reference: "local imports gsap in module scope, but page-level tooling cannot inspect trigger config/progress",
  });
}

if (revealTransitions.length === 0) {
  issues.push({
    severity: "medium",
    selector: "[data-reveal]",
    evidence: "computed css transitions are absent on audited reveal elements; reveals are imperative gsap from/to calls",
    reference: "reference records 300ms/600ms/800ms/1200ms viewport fades with cubic-bezier(0.44, 0, 0.56, 1)",
  });
}

if (imageFailures.length) {
  issues.push({
    severity: "high",
    selector: "img",
    evidence: `${imageFailures.length} images failed: ${imageFailures.map((image) => image.src).join(", ")}`,
    reference: "reference image-heavy sections depend on all visual assets loading",
  });
}

if (zeroSizeImages.length) {
  issues.push({
    severity: "medium",
    selector: "img",
    evidence: `${zeroSizeImages.length} loaded images have zero rendered size`,
    reference: "reference section screenshots show visible imagery throughout the page",
  });
}

if (baseState.revealCount < expectedViewportFadeCount) {
  issues.push({
    severity: "medium",
    selector: "[data-reveal]",
    evidence: `local reveal hooks=${baseState.revealCount}; reference viewport-fade sections=${expectedViewportFadeCount}`,
    reference: "reference page has many independently animated Framer sections",
  });
}

if (scrubbedTriggers > 0) {
  issues.push({
    severity: "low",
    selector: "[data-parallax]",
    evidence: `scrubbed scrolltrigger count=${scrubbedTriggers}; parallax hooks=${baseState.parallaxCount}`,
    reference: "reference extraction did not identify parallax; this is a creative approximation, not a direct fidelity match",
  });
}

const aspectWarnings = consoleMessages.filter((message) => message.text.includes("width or height modified"));
if (aspectWarnings.length) {
  issues.push({
    severity: "low",
    selector: ".overlap img",
    evidence: aspectWarnings.map((message) => message.text).join(" | "),
    reference: "reference images preserve captured proportions without next/image aspect-ratio warnings",
  });
}

if (!consoleMessages.some((message) => message.text.toLowerCase().includes("lenis")) && baseState.scrollHeight > 0) {
  issues.push({
    severity: "low",
    selector: "html",
    evidence: "no lenis runtime detected from console/global inspection; css scroll-behavior is the only visible smooth-scroll hook",
    reference: "reference stack detected lenis smooth scroll with duration 1.2",
  });
}

const report = {
  target,
  referenceDir,
  capturedAt: new Date().toISOString(),
  baseState,
  referenceSummary: {
    stack: "framer + framer motion + lenis; no gsap",
    viewportFadeSections: expectedViewportFadeCount,
    dominantDurationsMs: [300, 600, 800, 1200],
    dominantEasing: "cubic-bezier(0.44, 0, 0.56, 1)",
    referenceStyleCount,
  },
  animationState,
  earlyFrames,
  hoverState,
  imageState,
  dataRevealStates,
  failedRequests,
  consoleMessages,
  snapshots,
  issues,
};

const markdown = `# css motion audit

target: ${target}
reference: ${referenceDir}
captured: ${report.capturedAt}

## summary

- local sections: ${baseState.sectionCount}
- local reveal hooks: ${baseState.revealCount}
- local parallax hooks: ${baseState.parallaxCount}
- gsap present: ${baseState.hasGsap}
- scrolltrigger count: ${animationState.triggers.length}
- early hero samples: ${earlyFrames.length}
- loaded images: ${imageState.filter((image) => image.complete && image.naturalWidth > 0).length}/${imageState.length}
- failed requests: ${failedRequests.length}
- console messages: ${consoleMessages.length}

## reference motion baseline

- stack: framer + framer motion + lenis smooth scroll, no gsap
- dominant transitions: 300ms, 600ms, 800ms, 1200ms
- dominant easing: cubic-bezier(0.44, 0, 0.56, 1)
- viewport-fade sections: ${expectedViewportFadeCount}

## issues

${
  issues.length
    ? issues
        .map(
          (issue, index) =>
            `${index + 1}. **${issue.severity}** \`${issue.selector}\`\n   evidence: ${issue.evidence}\n   reference: ${issue.reference}`,
        )
        .join("\n")
    : "no blocking motion or image issues found in the audited selectors."
}

## scrolltrigger evidence

${animationState.triggers
  .map(
    (trigger) =>
      `- \`${trigger.trigger}\`: start=${trigger.start}, end=${trigger.end}, scrub=${trigger.scrub}, once=${trigger.once}, progress=${trigger.progress}`,
  )
  .join("\n") || "- no scrolltrigger instances found"}

## early hero animation frames

${earlyFrames
  .map(
    (frame) =>
      `- t=${frame.timeMs}ms: hero lines ${frame.heroLines
        .map((line) => `#${line.index} opacity=${line.opacity} transform=${line.transform}`)
        .join("; ")}; panel opacity=${frame.heroPanel?.opacity ?? "missing"} transform=${frame.heroPanel?.transform ?? "missing"}`,
  )
  .join("\n")}

## selector snapshots

${snapshots
  .map((snapshot) => {
    const visible = snapshot.sections
      .filter((section) => !section.missing && section.rect.y < 900 && section.rect.y + section.rect.height > 0)
      .map((section) => `\`${section.selector}\` opacity=${section.opacity} transform=${section.transform} y=${section.rect.y}`)
      .join("; ");
    return `- scroll y=${snapshot.y}: ${visible || "no audited selectors in viewport"}`;
  })
  .join("\n")}
`;

await writeFile(`${outDir}/css-motion-audit.json`, JSON.stringify(report, null, 2));
await writeFile(`${outDir}/css-motion-audit.md`, markdown);
await browser.close();

console.log(`wrote ${outDir}/css-motion-audit.json`);
console.log(`wrote ${outDir}/css-motion-audit.md`);
