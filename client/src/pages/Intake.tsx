import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "wouter";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import {
  CLIENT_TYPES,
  INTAKE_LIMITS,
  INTAKE_SERVICES,
  getClientType,
  getIntakeService,
} from "@shared/consultation-intake";

const field =
  "mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground/35 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";
const label = "block text-sm font-medium text-foreground";
const hint = "mt-1 block text-xs leading-relaxed text-muted-foreground";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className="mono mt-1 block text-right text-[10px] text-foreground/40">
      {value.length}/{max}
    </span>
  );
}

export default function Intake() {
  const [params] = useSearchParams();
  const [serviceId, setServiceId] = useState(
    getIntakeService(params.get("service"))?.id ?? INTAKE_SERVICES[0].id
  );
  const [clientTypeId, setClientTypeId] = useState(
    getClientType(params.get("type"))?.id ?? ""
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [goal, setGoal] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [links, setLinks] = useState("");
  const [outcome, setOutcome] = useState("");
  const [consentEducational, setConsentEducational] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [adult, setAdult] = useState(false);
  const [website, setWebsite] = useState("");
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);

  const service = getIntakeService(serviceId)!;
  const clientType = getClientType(clientTypeId);
  const submit = trpc.consultationIntake.submit.useMutation({
    onSuccess: result => {
      setBookingUrl(result.bookingUrl);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const ready = useMemo(
    () =>
      Boolean(clientType) &&
      name.trim().length >= 2 &&
      /.+@.+\..+/.test(email.trim()) &&
      introduction.trim().length >= INTAKE_LIMITS.introduction.min &&
      goal.trim().length >= INTAKE_LIMITS.goal.min &&
      consentEducational &&
      consentData &&
      adult,
    [clientType, name, email, introduction, goal, consentEducational, consentData, adult]
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || !clientType) return;
    const scopedAnswers = Object.fromEntries(
      clientType.prompts
        .map(prompt => [prompt.id, (answers[prompt.id] ?? "").trim()])
        .filter(([, value]) => value)
    );
    submit.mutate({
      serviceId,
      clientTypeId: clientType.id,
      name: name.trim(),
      email: email.trim(),
      introduction: introduction.trim(),
      goal: goal.trim(),
      answers: scopedAnswers,
      links: links.trim(),
      outcome: outcome.trim(),
      consentEducational: true,
      consentData: true,
      adult: true,
      website,
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav slim />
      <div className="relative isolate grain">
        <div className="pointer-events-none absolute -left-48 top-24 -z-10 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
        <main className="container pt-28 pb-24 md:pt-32">
          <Link
            href="/products"
            className="mono mb-6 inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.16em] text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> BACK TO
            CONSULTATIONS
          </Link>

          {bookingUrl ? (
            <section
              role="status"
              className="max-w-2xl rounded-[16px] border border-accent/40 bg-white p-8 md:p-10"
            >
              <p className="mono text-[12px] tracking-[0.22em] text-accent">
                BRIEF RECEIVED
              </p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.05]">
                Now pick your {service.minutes}-minute slot.
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-foreground/70">
                Your introduction and goal for the {service.title} are with us
                and will be reviewed before the call. Choose a time on the Read
                AI scheduler. Booking a slot does not take payment; complete
                the service purchase separately if you have not already.
              </p>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-medium text-white hover:bg-foreground"
              >
                Choose a time on Read AI{" "}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Use the same email ({email.trim()}) when booking so we can match
                your brief to your slot.
              </p>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <p className="mono text-[12px] tracking-[0.22em] text-accent">
                  <span className="text-foreground/35">§00 / </span>
                  CONSULTATION BRIEF
                </p>
                <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02]">
                  Brief us before you book.
                </h1>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-foreground/70">
                  A precise brief lets us pull the right papers, check study
                  designs and arrive with a reading map, not generic advice.
                  Five minutes here saves fifteen on the call.
                </p>
                <ol className="mt-8 space-y-3 text-sm leading-relaxed">
                  {[
                    "Choose the consultation and the profile closest to you.",
                    "Introduce yourself and state one precise, measurable goal.",
                    "Add the context questions for your profile.",
                    "Submit, then pick a slot on Read AI.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mono text-xs text-accent">
                        0{index + 1}
                      </span>
                      <span className="text-foreground/75">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-8 rounded-xl border border-border bg-white p-5 text-xs leading-relaxed text-muted-foreground">
                  Consultations are educational research-literacy sessions.
                  They are not medical advice, diagnosis or treatment, and we
                  do not recommend dosing or human use of research compounds.
                  Do not include diagnoses or prescriptions.
                </p>
              </aside>

              <form
                onSubmit={onSubmit}
                className="space-y-10 rounded-[16px] border border-accent/30 bg-white p-6 md:p-10"
                aria-label="Consultation brief"
              >
                <fieldset>
                  <legend className="mono text-[12px] tracking-[0.18em] text-accent">
                    01 / CONSULTATION
                  </legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {INTAKE_SERVICES.map(option => (
                      <label
                        key={option.id}
                        className={`cursor-pointer rounded-lg border p-4 text-sm transition-colors ${serviceId === option.id ? "border-accent bg-secondary/40" : "border-border hover:border-accent/60"}`}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={option.id}
                          checked={serviceId === option.id}
                          onChange={() => setServiceId(option.id)}
                          className="sr-only"
                        />
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{option.title}</span>
                          <span className="mono text-xs text-accent">
                            {option.priceLabel}
                          </span>
                        </span>
                        <span className="mono mt-1 block text-[10px] text-foreground/45">
                          {option.minutes} MIN · GOOGLE MEET
                        </span>
                        <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                          {option.focus}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mono text-[12px] tracking-[0.18em] text-accent">
                    02 / YOUR PROFILE
                  </legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {CLIENT_TYPES.map(option => (
                      <label
                        key={option.id}
                        className={`cursor-pointer rounded-lg border p-4 text-sm transition-colors ${clientTypeId === option.id ? "border-accent bg-secondary/40" : "border-border hover:border-accent/60"}`}
                      >
                        <input
                          type="radio"
                          name="clientType"
                          value={option.id}
                          checked={clientTypeId === option.id}
                          onChange={() => setClientTypeId(option.id)}
                          className="sr-only"
                        />
                        <span className="font-medium">{option.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {option.descriptor}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-6">
                  <legend className="mono text-[12px] tracking-[0.18em] text-accent">
                    03 / INTRODUCTION & GOAL
                  </legend>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className={label}>
                      Name
                      <input
                        className={field}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={INTAKE_LIMITS.name}
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label className={label}>
                      Email (use the same one on Read AI)
                      <input
                        className={field}
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        maxLength={INTAKE_LIMITS.email}
                        autoComplete="email"
                        required
                      />
                    </label>
                  </div>
                  <label className={label}>
                    Introduce yourself
                    <span className={hint}>
                      Background, what you do, your training or research
                      experience and why you are booking now. Minimum{" "}
                      {INTAKE_LIMITS.introduction.min} characters.
                    </span>
                    <textarea
                      className={`${field} min-h-32`}
                      value={introduction}
                      onChange={e => setIntroduction(e.target.value)}
                      maxLength={INTAKE_LIMITS.introduction.max}
                      required
                    />
                    <Counter
                      value={introduction}
                      max={INTAKE_LIMITS.introduction.max}
                    />
                  </label>
                  <label className={label}>
                    Your primary goal, stated precisely
                    <span className={hint}>
                      One outcome, a baseline, a target and a time frame.
                      {clientType ? ` Example: “${clientType.goalExample}”` : ""}
                    </span>
                    <textarea
                      className={`${field} min-h-24`}
                      value={goal}
                      onChange={e => setGoal(e.target.value)}
                      maxLength={INTAKE_LIMITS.goal.max}
                      required
                    />
                    <Counter value={goal} max={INTAKE_LIMITS.goal.max} />
                  </label>
                </fieldset>

                {clientType && (
                  <fieldset className="space-y-6">
                    <legend className="mono text-[12px] tracking-[0.18em] text-accent">
                      04 / CONTEXT · {clientType.label.toUpperCase()}
                    </legend>
                    {clientType.prompts.map(prompt => (
                      <label key={prompt.id} className={label}>
                        {prompt.label}
                        <span className={hint}>{prompt.hint}</span>
                        <textarea
                          className={`${field} min-h-20`}
                          value={answers[prompt.id] ?? ""}
                          onChange={e =>
                            setAnswers(prev => ({
                              ...prev,
                              [prompt.id]: e.target.value,
                            }))
                          }
                          maxLength={INTAKE_LIMITS.prompt}
                        />
                      </label>
                    ))}
                  </fieldset>
                )}

                <fieldset className="space-y-6">
                  <legend className="mono text-[12px] tracking-[0.18em] text-accent">
                    05 / SOURCES & OUTCOME
                  </legend>
                  <label className={label}>
                    Papers, DOIs, PMIDs or links (optional)
                    <textarea
                      className={`${field} min-h-20`}
                      value={links}
                      onChange={e => setLinks(e.target.value)}
                      maxLength={INTAKE_LIMITS.links}
                    />
                  </label>
                  <label className={label}>
                    What would make this session a success? (optional)
                    <span className={hint}>
                      e.g. an evidence-graded reading list, a clear answer on
                      study quality, a tracking framework.
                    </span>
                    <textarea
                      className={`${field} min-h-20`}
                      value={outcome}
                      onChange={e => setOutcome(e.target.value)}
                      maxLength={INTAKE_LIMITS.outcome}
                    />
                  </label>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </fieldset>

                <fieldset className="space-y-4 border-t border-border pt-8">
                  <legend className="sr-only">Consent</legend>
                  {[
                    {
                      checked: consentEducational,
                      set: setConsentEducational,
                      text: "I understand this is an educational research-literacy consultation, not medical advice, diagnosis, treatment or a recommendation to use any compound in humans.",
                    },
                    {
                      checked: consentData,
                      set: setConsentData,
                      text: "I explicitly consent to Bioupgrade processing the information in this brief, including any health-related details I chose to share, only to prepare and deliver my consultation. I can ask for it to be deleted at any time.",
                    },
                    {
                      checked: adult,
                      set: setAdult,
                      text: "I am 18 or older.",
                    },
                  ].map(item => (
                    <label
                      key={item.text}
                      className="flex cursor-pointer gap-3 text-sm leading-relaxed text-foreground/75"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => item.set(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent,#3f995f)]"
                        required
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </fieldset>

                {submit.error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    {submit.error.message.startsWith("[")
                      ? "Please check the highlighted fields and try again."
                      : submit.error.message}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                    Next: choose a {service.minutes}-minute slot on Read AI.
                  </p>
                  <button
                    type="submit"
                    disabled={!ready || submit.isPending}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-medium text-white transition-colors hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submit.isPending ? "Sending brief…" : "Send brief & choose a time"}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
