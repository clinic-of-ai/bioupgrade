import verifiedBriefs from "./research-data.json";

export type ResearchPaper = {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
  doi: string;
  pmid: string;
  studyType: string;
  finding: string;
  limitation: string;
  relationship: "named compound" | "component only" | "related entity";
};
export type ResearchBrief = {
  id: string;
  name: string;
  topic: string;
  mechanisticSummary: string;
  evidenceSummary: string;
  limitation: string;
  productCopy: string;
  evidenceLevel:
    | "Human research"
    | "Preclinical research"
    | "Mixed evidence"
    | "Identity unresolved";
  papers: ResearchPaper[];
  sourceUrls: string[];
  reportPath: string;
};

export const RESEARCH_UPDATED_AT = "8 November 2026";
export const RESEARCH_BRIEFS = verifiedBriefs as ResearchBrief[];
export const FAMILY_NAMES: Record<string, string> = {
  tirzepatide: "Tirzepatide",
  semaglutide: "Semaglutide",
  "hgh-fragment": "HGH Fragment",
  klow: "Klow",
  glow: "Glow",
  "ghk-cu": "GHK-Cu",
  tesamorelin: "Tesamorelin",
  "ipamorelin-cjc": "Ipamorelin + CJC",
  sermorelin: "Sermorelin",
  wolverine: "Wolverine Stack",
  "mots-c": "MOTS-c",
  ss31: "SS31",
  epithalon: "Epithalon",
  oxytocin: "Oxytocin",
  dsip: "DSIP",
  glutathione: "Glutathione",
};

export function getResearchBrief(familyId?: string) {
  return RESEARCH_BRIEFS.find(brief => brief.id === familyId);
}
export function getFamilyName(familyId: string) {
  return FAMILY_NAMES[familyId] ?? familyId;
}
export function getResearchPapers() {
  const seen = new Set<string>();
  return RESEARCH_BRIEFS.flatMap(brief =>
    brief.papers.map(paper => ({
      ...paper,
      familyId: brief.id,
      familyName: getFamilyName(brief.id),
    }))
  )
    .filter(paper => {
      const identity = paper.doi || paper.pmid || paper.url;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .sort((a, b) => b.year - a.year);
}
