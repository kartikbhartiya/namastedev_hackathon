"use client";
// SIH PPT Builder — Generates PPTX files using pptxgenjs
// Pixel-perfect replica of the official SIH 2025 template
// Extracted from: Sih-ppt-template-2025-pdf-download.pptx
//
// NOTE: pptxgenjs uses node:fs/node:https internally, so we MUST
// dynamically import it to avoid webpack errors in Next.js.

import type { SIHSlideContent, SIHColorTheme } from "./sihPptGenerator";
import { SIH_COLOR_THEMES } from "./sihPptGenerator";

// ——— Constants from template analysis ———

const SLIDE_WIDTH = 13.33; // inches (widescreen)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SLIDE_HEIGHT = 7.5;

// Footer bar dimensions
const FOOTER_Y = 6.53;
const FOOTER_H = 0.52;

// Team name ellipse
const TEAM_ELLIPSE_X = 0.26;
const TEAM_ELLIPSE_Y = 0.21;
const TEAM_ELLIPSE_W = 1.0;
const TEAM_ELLIPSE_H = 0.65;

// SIH Logo position
const LOGO_X = 10.05;
const LOGO_Y = 0.05;
const LOGO_W = 1.78;
const LOGO_H = 0.9;

// Content area
const TITLE_Y = 0.0;
const TITLE_H = 1.0;
const CONTENT_X = 0.5;
const CONTENT_Y = 2.1;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CONTENT_W = 10.0;

// ——— Helper: Add common slide elements ———
// Using `any` for slide type since pptxgenjs is dynamically imported

function addFooterBar(
  slide: any,
  theme: SIHColorTheme,
  slideNum: number,
  _totalSlides: number
) {
  slide.addShape("rect", {
    x: 0,
    y: FOOTER_Y,
    w: SLIDE_WIDTH,
    h: FOOTER_H,
    fill: { color: theme.primary },
    shadow: {
      type: "outer",
      blur: 3,
      offset: 1.5,
      angle: 90,
      color: "808080",
      opacity: 0.35,
    },
  });

  slide.addText("@SIH Idea submission- Template", {
    x: 3.8,
    y: FOOTER_Y,
    w: 3.5,
    h: FOOTER_H,
    fontSize: 10,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
    fontFace: "Arial",
  });

  slide.addText(`${slideNum}`, {
    x: 11.5,
    y: FOOTER_Y,
    w: 1.0,
    h: FOOTER_H,
    fontSize: 10,
    bold: true,
    color: "FFFFFF",
    align: "right",
    valign: "middle",
    fontFace: "Arial",
  });
}

function addTeamNameBadge(
  slide: any,
  teamName: string,
  _theme: SIHColorTheme
) {
  slide.addShape("ellipse", {
    x: TEAM_ELLIPSE_X,
    y: TEAM_ELLIPSE_Y,
    w: TEAM_ELLIPSE_W,
    h: TEAM_ELLIPSE_H,
    fill: { color: "FFFFFF" },
    line: { color: "8064A2", width: 2 },
  });

  slide.addText(teamName, {
    x: TEAM_ELLIPSE_X,
    y: TEAM_ELLIPSE_Y,
    w: TEAM_ELLIPSE_W,
    h: TEAM_ELLIPSE_H,
    fontSize: 8,
    color: "000000",
    align: "center",
    valign: "middle",
    fontFace: "Arial",
  });
}

function addSIHLogoPlaceholder(slide: any, theme: SIHColorTheme) {
  slide.addShape("rect", {
    x: LOGO_X,
    y: LOGO_Y,
    w: LOGO_W,
    h: LOGO_H,
    fill: { color: "FFFFFF" },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.05,
  });

  slide.addText("SIH\nLOGO", {
    x: LOGO_X,
    y: LOGO_Y,
    w: LOGO_W,
    h: LOGO_H,
    fontSize: 12,
    bold: true,
    color: theme.primary,
    align: "center",
    valign: "middle",
    fontFace: "Arial",
  });
}

function addContentSlideHeader(
  slide: any,
  title: string,
  _theme: SIHColorTheme
) {
  slide.addText(title, {
    x: 0.3,
    y: TITLE_Y,
    w: 10.0,
    h: TITLE_H,
    fontSize: 36,
    bold: true,
    color: "000000",
    fontFace: "Times New Roman",
    valign: "bottom",
  });
}

// ——— Build Individual Slides ———

function buildTitleSlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  // Main decorative accent rectangle (right side)
  slide.addShape("rect", {
    x: 5.5,
    y: 0,
    w: 7.83,
    h: 7.5,
    fill: { color: theme.accent },
  });

  // Decorative overlay
  slide.addShape("rect", {
    x: 6.5,
    y: 1.0,
    w: 5.0,
    h: 5.0,
    fill: { color: theme.primaryDark, transparency: 85 },
    rectRadius: 0.1,
  });

  // SIH Logo placeholder
  addSIHLogoPlaceholder(slide, theme);

  // Main title
  slide.addText("SMART INDIA HACKATHON 2026", {
    x: 0.3,
    y: 0.2,
    w: 9.0,
    h: 0.8,
    fontSize: 40,
    bold: true,
    color: theme.primaryDark,
    fontFace: "Garamond",
  });

  // Title page label
  slide.addText("TITLE PAGE", {
    x: 1.0,
    y: 1.0,
    w: 7.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: "000000",
    fontFace: "Times New Roman",
  });

  // Bullet point details
  const details = [
    `Problem Statement ID – ${content.titleSlide.problemStatementId}`,
    `Problem Statement Title- ${content.titleSlide.problemStatementTitle}`,
    `Theme- ${content.titleSlide.theme}`,
    `PS Category- ${content.titleSlide.psCategory}`,
    `Team ID- ${content.titleSlide.teamId}`,
    `Team Name (Registered on portal) ${content.titleSlide.teamName}`,
  ];

  slide.addText(
    details.map((d) => ({
      text: d,
      options: {
        fontSize: 20,
        bold: true,
        color: "000000",
        fontFace: "Arial",
        bullet: { type: "bullet" as const },
        breakType: "none" as const,
        paraSpaceAfter: 14,
      },
    })),
    {
      x: 0.3,
      y: 1.8,
      w: 5.0,
      h: 4.5,
      lineSpacingMultiple: 1.8,
      valign: "top",
    }
  );
  slide.addNotes(content.titleSlide.speakerNotes || "");
}

function buildIdeaSlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  addContentSlideHeader(slide, "IDEA TITLE", theme);
  addTeamNameBadge(slide, content.titleSlide.teamName, theme);
  addSIHLogoPlaceholder(slide, theme);

  // Proposed Solution heading
  slide.addText("Proposed Solution (Describe your Idea/Solution/Prototype)", {
    x: CONTENT_X - 0.3,
    y: 1.4,
    w: 10.0,
    h: 0.5,
    fontSize: 26,
    bold: true,
    underline: true,
    color: theme.primaryDark,
    fontFace: "Arial",
    bullet: { code: "76", type: "bullet" },
  });

  // Solution points
  const allPoints = [
    ...content.ideaSlide.solutionPoints,
    ...content.ideaSlide.howItAddresses,
    ...content.ideaSlide.innovationPoints,
  ];

  const hasAdvanced = !!content.ideaSlide.competitorMatrix || !!content.ideaSlide.prototypeImagePrompt;
  const textWidth = hasAdvanced ? 6.0 : 11.0;
  const textHeight = hasAdvanced ? 2.8 : 4.0;

  slide.addText(
    allPoints.map((point) => ({
      text: point,
      options: {
        fontSize: 20,
        color: "000000",
        fontFace: "Arial",
        bullet: { type: "bullet" as const },
        breakType: "none" as const,
        paraSpaceAfter: 6,
      },
    })),
    {
      x: CONTENT_X - 0.3,
      y: 1.8,
      w: textWidth,
      h: textHeight,
      valign: "top",
      lineSpacingMultiple: 1.1,
    }
  );

  // Advanced: Competitor Matrix Table
  if (content.ideaSlide.competitorMatrix && content.ideaSlide.competitorMatrix.length > 0) {
    const tableData = [
      [
        { text: "Competitor", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } },
        { text: "Cost", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } },
        { text: "Speed", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } },
        { text: "Features", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } }
      ],
      ...content.ideaSlide.competitorMatrix.map(c => [c.competitor, c.cost, c.speed, c.features])
    ];
    slide.addTable(tableData, { 
      x: 0.3, y: 4.8, w: 6.0, 
      colW: [1.5, 1.0, 1.0, 2.5], 
      fontSize: 12, 
      border: { pt: 1, color: "CCCCCC" } 
    });
  }

  // Advanced: UI Prototype Image
  if (content.ideaSlide.prototypeImagePrompt) {
    try {
      const promptUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content.ideaSlide.prototypeImagePrompt)}?width=800&height=600&nologo=true`;
      slide.addImage({ path: promptUrl, x: 6.5, y: 1.8, w: 6.0, h: 4.5, sizing: { type: "contain" } });
    } catch (err) {
      console.error("Failed to add prototype image:", err);
    }
  }

  addFooterBar(slide, theme, 2, 6);
  slide.addNotes(content.ideaSlide.speakerNotes || "");
}

function buildTechnicalSlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  addContentSlideHeader(slide, "TECHNICAL APPROACH", theme);
  addTeamNameBadge(slide, content.titleSlide.teamName, theme);
  addSIHLogoPlaceholder(slide, theme);

  const techText = `Technologies to be used: ${content.technicalSlide.technologies.join(", ")}`;
  
  // If there's a diagram, constrain the text width
  const hasDiagram = !!content.technicalSlide.mermaidArchitectureDiagram;
  const textWidth = hasDiagram ? 5.5 : 9.5;

  slide.addText(
    [
      {
        text: techText,
        options: {
          fontSize: 22,
          color: "000000",
          fontFace: "Arial",
          bullet: { type: "bullet" as const },
          breakType: "none" as const,
          paraSpaceAfter: 12,
        },
      },
      ...content.technicalSlide.methodology.map((step) => ({
        text: step,
        options: {
          fontSize: 22,
          color: "000000",
          fontFace: "Arial",
          bullet: { type: "bullet" as const },
          breakType: "none" as const,
          paraSpaceAfter: 8,
        },
      })),
    ],
    {
      x: CONTENT_X,
      y: CONTENT_Y,
      w: textWidth,
      h: 4.0,
      valign: "top",
      lineSpacingMultiple: 1.2,
    }
  );

  // Embed the Auto-Architecture Diagram via Mermaid Ink
  if (hasDiagram) {
    try {
      // Safely encode to base64
      const mermaidStr = content.technicalSlide.mermaidArchitectureDiagram;
      const b64 = btoa(unescape(encodeURIComponent(mermaidStr)));
      const url = `https://mermaid.ink/img/${b64}?bgColor=ffffff`;
      
      slide.addImage({
        path: url,
        x: 6.5,
        y: 1.8,
        w: 6.0,
        h: 4.5,
        sizing: { type: "contain" }
      });
    } catch (err) {
      console.error("Failed to add mermaid diagram:", err);
    }
  }

  addFooterBar(slide, theme, 3, 6);
  slide.addNotes(content.technicalSlide.speakerNotes || "");
}

function buildFeasibilitySlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  addContentSlideHeader(slide, "FEASIBILITY AND VIABILITY", theme);
  addTeamNameBadge(slide, content.titleSlide.teamName, theme);
  addSIHLogoPlaceholder(slide, theme);

  const allPoints = [
    ...content.feasibilitySlide.feasibilityPoints,
    ...content.feasibilitySlide.challenges,
    ...content.feasibilitySlide.strategies,
  ];

  const hasTable = !!content.feasibilitySlide.costBreakdown && content.feasibilitySlide.costBreakdown.length > 0;
  const textWidth = hasTable ? 6.0 : 9.5;

  slide.addText(
    allPoints.map((point) => ({
      text: point,
      options: {
        fontSize: 20,
        color: "000000",
        fontFace: "Arial",
        bullet: { type: "bullet" as const },
        breakType: "none" as const,
        paraSpaceAfter: 6,
      },
    })),
    {
      x: CONTENT_X,
      y: CONTENT_Y,
      w: textWidth,
      h: 4.0,
      valign: "top",
      lineSpacingMultiple: 1.2,
    }
  );

  // Advanced: Cost Breakdown Table
  if (hasTable) {
    const tableData = [
      [
        { text: "Item", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } },
        { text: "Est. Cost", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } },
        { text: "Justification", options: { bold: true, color: "FFFFFF", fill: theme.primaryDark } }
      ],
      ...content.feasibilitySlide.costBreakdown.map(c => [c.item, c.estimatedCost, c.justification])
    ];
    slide.addTable(tableData, { 
      x: 6.5, y: 2.0, w: 6.0, 
      colW: [1.5, 1.5, 3.0], 
      fontSize: 14, 
      border: { pt: 1, color: "CCCCCC" } 
    });
  }

  addFooterBar(slide, theme, 4, 6);
  slide.addNotes(content.feasibilitySlide.speakerNotes || "");
}

function buildImpactSlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  addContentSlideHeader(slide, "IMPACT AND BENEFITS", theme);
  addTeamNameBadge(slide, content.titleSlide.teamName, theme);
  addSIHLogoPlaceholder(slide, theme);

  const allPoints = [
    ...content.impactSlide.targetAudienceImpact,
    ...content.impactSlide.benefits,
  ];

  slide.addText(
    allPoints.map((point) => ({
      text: point,
      options: {
        fontSize: 22,
        color: "000000",
        fontFace: "Arial",
        bullet: { type: "bullet" as const },
        breakType: "none" as const,
        paraSpaceAfter: 8,
      },
    })),
    {
      x: CONTENT_X,
      y: CONTENT_Y,
      w: 9.5,
      h: 4.0,
      valign: "top",
      lineSpacingMultiple: 1.2,
    }
  );

  addFooterBar(slide, theme, 5, 6);
  slide.addNotes(content.impactSlide.speakerNotes || "");
}

function buildReferencesSlide(
  pptx: any,
  content: SIHSlideContent,
  theme: SIHColorTheme
) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  addContentSlideHeader(slide, "RESEARCH AND REFERENCES", theme);
  addTeamNameBadge(slide, content.titleSlide.teamName, theme);
  addSIHLogoPlaceholder(slide, theme);

  const formattedRefs = content.referencesSlide.references.map(
    (r) => `[${r.year}] ${r.authors} - "${r.title}".\n${r.link}`
  );

  slide.addText(
    formattedRefs.map((ref) => ({
      text: ref,
      options: {
        fontSize: 18,
        color: "000000",
        fontFace: "Arial",
        bullet: { type: "bullet" as const },
        breakType: "none" as const,
        paraSpaceAfter: 12,
      },
    })),
    {
      x: CONTENT_X,
      y: 2.3,
      w: 10.5,
      h: 3.5,
      valign: "top",
      lineSpacingMultiple: 1.1,
    }
  );

  addFooterBar(slide, theme, 6, 6);
  slide.addNotes(content.referencesSlide.speakerNotes || "");
}

// ——— Main Export: Build Full PPTX ———

export async function buildSIHPresentation(
  content: SIHSlideContent,
  themeName: string = "sih-blue"
): Promise<void> {
  const theme =
    SIH_COLOR_THEMES.find((t) => t.name === themeName) || SIH_COLOR_THEMES[0];

  // Dynamic import to avoid webpack node:fs/node:https errors
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = content.titleSlide.teamName;
  pptx.title = `SIH 2026 - ${content.titleSlide.problemStatementTitle}`;
  pptx.subject = "Smart India Hackathon 2026 Idea Submission";
  pptx.company = content.titleSlide.teamName;
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

  // Build all 6 slides
  buildTitleSlide(pptx, content, theme);
  buildIdeaSlide(pptx, content, theme);
  buildTechnicalSlide(pptx, content, theme);
  buildFeasibilitySlide(pptx, content, theme);
  buildImpactSlide(pptx, content, theme);
  buildReferencesSlide(pptx, content, theme);

  // Generate and download
  const fileName = `SIH_2026_${content.titleSlide.teamName.replace(/\s+/g, "_")}_${content.titleSlide.problemStatementId}`;
  await pptx.writeFile({ fileName });
}

// ——— Export for preview use ———
export { SIH_COLOR_THEMES as themes };
