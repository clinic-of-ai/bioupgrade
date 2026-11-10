export type DiscussionSource = {
  title: string;
  url: string;
  doi?: string;
  finding?: string;
  limitation?: string;
};
export function createDiscussionPrompt(
  source: DiscussionSource,
  question = "Which endpoint answers this question, and what remains untested?"
) {
  let url: string;
  try {
    const parsed = new URL(source.url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password)
      throw new Error();
    url = parsed.href;
  } catch {
    throw new Error("A valid public HTTPS source is required.");
  }
  return [
    "Bioscience · source-led discussion",
    `Paper: ${source.title}`,
    `Original source: ${url}`,
    source.doi ? `DOI: ${source.doi}` : null,
    source.finding ? `Reported finding: ${source.finding}` : null,
    source.limitation ? `Limitation: ${source.limitation}` : null,
    `Question: ${question.trim().slice(0, 1200)}`,
    "Discuss the source and study design—not personal treatment or instructions for compound use.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
