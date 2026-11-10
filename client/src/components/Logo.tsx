import { ASSETS } from "@/lib/site";

/**
 * bioupgrade wordmark — recurring amber pixel-square mark + GeistPixel-Square logotype.
 * Always lowercase, lightly tracked; the amber square is a signature, never a tiny favicon.
 * Style: pale mint canvas, forest wordmark, warm golden mark, weight 400, tight tracking.
 */
export default function Logo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const mark = size === "lg" ? "h-7 w-7" : "h-[22px] w-[22px]";
  const type = size === "lg" ? "text-[22px]" : "text-[19px]";
  return (
    <span className={`group inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={ASSETS.logoMark}
        alt=""
        aria-hidden="true"
        className={`${mark} shrink-0 select-none transition-transform duration-300 group-hover:rotate-[-6deg]`}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
        draggable={false}
      />
      <span
        className={`${type} lowercase leading-none text-foreground`}
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.5px" }}
      >
        bioupgrade
      </span>
    </span>
  );
}
