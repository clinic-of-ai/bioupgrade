import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Link } from "wouter";
import { getConsultingProfile } from "@shared/consulting";
import { getProduct, PRODUCTS } from "@shared/products";

const ENTRY_ID = "research-strategy-session";

// Presentation summaries of proposed scope, not evidence of completed delivery.
const OFFER_COPY: Record<string, { summary: string; outputs: string[] }> = {
  "research-strategy-session": {
    summary:
      "One educational question. One published paper. A 60-minute individual conversation, with a proposed written question map under agreed terms.",
    outputs: [
      "Written question map: source, entity, model or population, comparator and endpoint.",
      "Source-linked evidence read: findings, limitations and unsupported interpretations.",
      "Next-reading shortlist: open questions and a self-directed route, or optional separate project scope.",
    ],
  },
  "evidence-briefing": {
    summary:
      "A bounded, citation-linked briefing for a defined educational or internal research question, reader and source set.",
    outputs: [
      "Dated source map: included references, review boundaries and unavailable material.",
      "Evidence table and written synthesis: findings, limitations, uncertainty and unanswered questions.",
      "Educational decision session and written next-reading or research-question map.",
    ],
  },
  "ai-workflow-sprint": {
    summary:
      "Evaluate one owned document-heavy research workflow against a baseline, with source checks, explicit failure criteria and human review.",
    outputs: [
      "Written baseline and task specification, plus a bounded proof-of-concept specification or explicitly authorised prototype.",
      "Evaluation set, rubric and results record, including failures and citation-verification checks.",
      "Reusable SOP and governance handoff: access, human review, escalation and further implementation needs.",
    ],
  },
  "bioscience-ai-workshop": {
    summary:
      "A half-day team working session around one approved case, practising source evaluation and non-clinical, human-reviewed AI workflows.",
    outputs: [
      "Case workbook for the agreed research-literacy or document-workflow exercise.",
      "Reusable SOP and quality rubric for source evaluation, prompting, citation checks and human review.",
      "Written team adoption and next-action checklist; wider implementation is separately scoped.",
    ],
  },
};

export function resolveConsultingOffer(productId: string | null) {
  return getProduct(productId ?? "") ?? getProduct(ENTRY_ID) ?? PRODUCTS[0];
}

export function consultingSummary(productId: string) {
  return (
    OFFER_COPY[productId]?.summary ?? getConsultingProfile(productId)?.bestFor
  );
}

export default function ConsultingFit({ productId }: { productId: string }) {
  const profile = getConsultingProfile(productId);
  const outputs = OFFER_COPY[productId]?.outputs;
  if (!profile || !outputs) return null;

  return (
    <section aria-label="Engagement fit and proposed scope" className="mt-8">
      <div className="rounded-xl border border-border bg-secondary/40 p-5 md:p-6">
        <h2 className="text-xl">Who this is for</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {profile.targetAudience}
        </p>
        <h3 className="mt-5 text-base">Best fit</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {profile.bestFor}
        </p>
      </div>

      <h2 className="mt-8 text-xl">Proposed written outputs</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        These describe what an engagement would deliver, subject to agreed
        scope, delivery capability and terms. They are not completed work
        examples. Format, timing and factual-correction or revision terms must
        be confirmed before commitment.
      </p>
      <ul className="mt-5 space-y-4">
        {outputs.map(output => (
          <li key={output} className="flex gap-3 text-sm leading-relaxed">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>{output}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 rounded-xl border border-border bg-white px-5 py-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">
            Educational and research-workflow scope only.
          </strong>{" "}
          No diagnosis, prescribing, dosing, personal treatment decisions or
          human-performance protocols. Citations do not verify suppliers or
          batches, establish product safety or efficacy, or change
          research-material eligibility. No guaranteed findings or results.
        </p>
      </div>

      <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-white px-5">
        <details className="group">
          <summary className="min-h-12 cursor-pointer py-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            Prework: what to prepare
          </summary>
          <ul className="list-disc space-y-3 pb-5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {profile.prework.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
        <details className="group">
          <summary className="min-h-12 cursor-pointer py-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            Scope limits and terms to agree
          </summary>
          <ul className="list-disc space-y-3 pb-5 pl-5 text-sm leading-relaxed text-muted-foreground">
            {profile.scopeLimits.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 text-sm">
        <Link
          href="/research"
          className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
        >
          Start with the research library
        </Link>
        <Link
          href="/community#community-network"
          className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
        >
          Community connection status
        </Link>
      </div>
    </section>
  );
}

export function ConsultingWorksheet({ productId }: { productId: string }) {
  const product = resolveConsultingOffer(productId);
  const [question, setQuestion] = useState("");
  const [paper, setPaper] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [status, setStatus] = useState("");
  const draft = [
    "BIOUPGRADE — local scope draft (not a submission or booking)",
    `Offer: ${product.title} (${product.priceLabel})`,
    `Offer format: ${product.eyebrow}; timing and availability to agree separately`,
    "Proposed educational scope; written outputs and terms require confirmation.",
    "",
    `Educational question / workflow: ${question.trim() || "[to prepare]"}`,
    `Anchor paper / approved source: ${paper.trim() || "[to prepare]"}`,
    `Intended audience and use: ${intendedUse.trim() || "[to prepare]"}`,
    "",
    "Confirm before commitment: fit, source access and permissions, output format, exclusions, review boundaries, timing, final quote and separate payment/scheduling arrangements.",
    "Do not include patient records, personal medical details or confidential material.",
  ].join("\n");
  const hasDraft = Boolean(
    question.trim() || paper.trim() || intendedUse.trim()
  );

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setStatus("Draft copied to your clipboard. Nothing submitted.");
    } catch {
      setStatus(
        "Clipboard unavailable. Open the draft text below to select and copy it manually."
      );
    }
  };
  const downloadDraft = () => {
    const url = URL.createObjectURL(
      new Blob([draft], { type: "text/plain;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bioupgrade-${product.id}-scope-draft.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Draft download requested on your device. Nothing submitted.");
  };

  return (
    <section
      aria-label="Local scope draft"
      className="manus-no-record mt-8 rounded-xl border border-border bg-white p-5 md:p-6"
    >
      <p className="mono text-[10px] tracking-[0.18em] text-accent">
        PREPARE, DON’T SUBMIT
      </p>
      <h2 className="mt-3 text-xl">Your question, on one page</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Local draft only; nothing posted or saved by this site. There is no
        connected email or intake service. Reloading, leaving this page or
        changing the offer clears the draft. Copy or download only saves it
        where you choose. Do not enter patient data, medical history or
        sensitive or confidential information.
      </p>
      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="scope-question" className="block text-sm">
            One educational question or owned workflow
          </label>
          <textarea
            id="scope-question"
            autoComplete="off"
            maxLength={2000}
            rows={3}
            value={question}
            onChange={event => {
              setQuestion(event.target.value);
              setStatus("");
            }}
            placeholder="Which claim in this paper needs a closer read?"
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
        <div>
          <label htmlFor="scope-paper" className="block text-sm">
            Anchor paper: link, DOI or PMID / approved source
          </label>
          <input
            id="scope-paper"
            type="text"
            autoComplete="off"
            maxLength={1000}
            value={paper}
            onChange={event => {
              setPaper(event.target.value);
              setStatus("");
            }}
            placeholder="A public source reference, not a file upload"
            className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
        <div>
          <label htmlFor="scope-use" className="block text-sm">
            Intended audience and educational / research use
          </label>
          <textarea
            id="scope-use"
            autoComplete="off"
            maxLength={1500}
            rows={2}
            value={intendedUse}
            onChange={event => {
              setIntendedUse(event.target.value);
              setStatus("");
            }}
            placeholder="For example: explain study limitations in a reading group."
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!hasDraft}
          onClick={copyDraft}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="h-4 w-4" aria-hidden="true" /> Copy draft
        </button>
        <button
          type="button"
          disabled={!hasDraft}
          onClick={downloadDraft}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Download .txt
        </button>
        <button
          type="button"
          disabled={!hasDraft}
          onClick={() => {
            setQuestion("");
            setPaper("");
            setIntendedUse("");
            setStatus("Local draft cleared.");
          }}
          className="min-h-12 px-3 text-sm text-muted-foreground underline hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear draft
        </button>
      </div>
      <p
        role="status"
        className="mt-3 text-sm leading-relaxed text-muted-foreground"
      >
        {status}
      </p>
      <details className="mt-2">
        <summary className="min-h-11 cursor-pointer py-3 text-sm text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          View draft text for manual copying
        </summary>
        <textarea
          readOnly
          aria-label="Scope draft text"
          value={draft}
          rows={10}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background p-3 text-xs leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      </details>
    </section>
  );
}
