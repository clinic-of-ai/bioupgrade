import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import {
  createDiscussionPrompt,
  type DiscussionSource,
} from "@shared/discussion-prompt";
import { getCommunityConfig } from "@/lib/community";

export default function ShareReadingPrompt({
  source,
  question,
}: {
  source: DiscussionSource;
  question?: string;
}) {
  const [status, setStatus] = useState("");
  const [manualText, setManualText] = useState<string | null>(null);
  const config = getCommunityConfig();
  const text = createDiscussionPrompt(source, question);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(text);
      setStatus("Prompt copied. Choose where to paste it; nothing was posted.");
      setManualText(null);
    } catch {
      setManualText(text);
      setStatus(
        "Clipboard access was unavailable. Select and copy the prompt below."
      );
    }
  };
  const share = async () => {
    try {
      if (!navigator.share) {
        await copy();
        return;
      }
      await navigator.share({
        title: "Bioscience research discussion",
        text,
        url: source.url,
      });
      setStatus(
        "The device share action closed. No post or reward is verified by this website."
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setManualText(text);
        setStatus("Sharing was unavailable. Copy the prompt instead.");
      }
    }
  };
  return (
    <div className="manus-no-record mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 text-xs text-accent"
        >
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          Copy discussion prompt
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 items-center gap-2 text-xs text-accent"
        >
          <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
          Share source…
        </button>
        {config.discordInviteUrl && (
          <a
            href={config.discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-xs text-accent"
          >
            Open Bioscience Discord →
          </a>
        )}
      </div>
      {status && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {status}
        </p>
      )}
      {manualText && (
        <textarea
          readOnly
          aria-label="Source-linked discussion prompt to copy"
          rows={8}
          value={manualText}
          className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-xs"
        />
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">
        A source and its limitation travel together. No automatic posting,
        private-message access or Signal Points award.
      </p>
    </div>
  );
}
