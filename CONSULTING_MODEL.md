# Bioupgrade consulting: from a broad conversation to a reusable evidence record

**Decision memo · 8 November 2026**  
**Status:** Recommendations only. No source-code edits, integrations, account access, payments, posts, private-community access or automations were performed.

## Executive recommendation

Sell **a bounded research-literacy outcome, not access to an expert or a personal optimisation protocol**. Retain the four current offers, their IDs and billing prices. Make the €200 Research Strategy Session the fixed-scope entry point: one educational question, one anchor paper, a 60-minute conversation and a durable written question map. Route wider evidence questions into a separately quoted briefing; route team training and workflow needs into the existing workshop and sprint.

The three highest-value improvements are:

1. **Make the entry product concrete and safe.** Replace broad personal-goal positioning with one source-led question, reusable prework and a written evidence/uncertainty record. This makes the purchase easier to understand and limits unpaid preparation.
2. **Turn outputs into a paid-project ladder.** Each session ends with an explicit close, a self-directed reading route, or a scoped project recommendation. Briefings, workshops and sprints have different acceptance criteria rather than being interchangeable consulting time.
3. **Use Instagram and community discussion to qualify questions, not imply authority or access.** Link a public paper and its limits before presenting the educational consultation. Discord is an optional, permission-dependent discussion step, never a purchased benefit or a claimed live integration.

## 1. What exists, and what this memo does not establish

This review is grounded in the recovered local implementation of public-facing pages, not a new live-site or competitor audit. The source already contains useful guardrails: `/products` calls the offers educational, `/research` pairs source findings with limitations, `/meta` separates entity/model/endpoint and explains its editorial method, and `/community` explicitly says it is not a live forum.

| Existing product ID | Current offer | Unchanged billing amount | Current route/status |
|---|---|---:|---|
| `research-strategy-session` | Research Strategy Session · 60 minutes · 1:1 | €200 | `checkoutEnabled: true`; payment credentials unavailable in the recovered environment |
| `evidence-briefing` | Evidence Briefing | From €850 | Scope and final quote required; checkout disabled |
| `ai-workflow-sprint` | AI Workflow Sprint | From €2,800 | Scope and final quote required; checkout disabled |
| `bioscience-ai-workshop` | Applied AI in Bioscience · team · half day | From €1,200 | Scope and final quote required; checkout disabled |

The catalogue contains project labels of 2–4 weeks for briefings and 4–8 weeks for sprints. These are existing presentation labels, **not evidence of delivery capacity or a guaranteed turnaround**. Agree actual timing before commitment.

`Products.tsx` states that site checkout and scheduling are separate; purchase does not reserve a calendar slot. `Book.tsx` states that Cal.com payments/bookings are separate from account-linked checkout and do not automatically award Signal Points. `CalEmbed.tsx` has a placeholder state that cannot confirm a reservation. A configured flag is not proof of an operational payment/calendar service. Do not advertise instant booking while these dependencies remain unverified or unavailable.

The owner reports an existing Instagram audience of approximately **25,000 followers**; that count, audience composition, engagement and purchase intent have not been independently verified. A separate public-profile check supplied to this review found that the provided `@bio.science` destination appears to be a private school-science profile showing 38 followers, inconsistent with the owner's description. **Do not promote or link the supplied profile.** The correct profile URL and ownership confirmation are pending; the owner has been asked for clarification. The owner also describes a large Bioscience Discord. Its invite is pending, membership/activity have not been verified, and private posts were not accessible or reviewed. These are prospective distribution assets, not validated demand or Bioupgrade-owned community entitlements.

No consultant credentials, regulated expertise, client outcomes, effectiveness claims or testimonials are assumed. The accompanying `consulting-profiles.json` is proposed offer copy, not a record that its expanded deliverables are already implemented.

## 2. Customer segments and jobs-to-be-done

Prioritise the first and third segments for an initial manual test. Treat all segments as hypotheses until qualified inquiries and paid delivery provide evidence.

| Segment | Concrete job-to-be-done | Appropriate first offer | Qualification signal |
|---|---|---|---|
| Scientifically curious readers, students and community participants | “Help me understand what this paper actually measured, and what I cannot conclude from it.” | Research Strategy Session | Can identify a paper and one educational uncertainty; accepts no personal-use advice |
| Science communicators and educators | “Help me explain this claim without losing its model, endpoint and limitations.” | Session for one paper; briefing for a bounded source set | Defined audience and educational output; willing to publish uncertainty rather than seek an endorsement |
| Small bioscience, research-content or knowledge-work teams | “Give our team a consistent way to find, check and discuss evidence.” | Applied AI in Bioscience workshop | Named sponsor, approved example documents and a shared learning objective |
| Teams with repetitive document-heavy research tasks | “Test whether a human-reviewed AI workflow can handle this task, and document where it fails.” | AI Workflow Sprint after scope discussion | Workflow owner, baseline examples, permitted data and reviewer availability |
| Research-oriented organisations with a specific evidence question | “Create a source-linked briefing that separates supported findings from unanswered questions.” | Evidence Briefing | One bounded question, intended internal use, agreed exclusions and quote authority |

**Not a target service:** personal diagnosis, prescribing, administration/dosing, compound selection for human use, personal cognition/recovery/longevity protocols, or reassurance about a supplier's safety or efficacy. Interest in those topics can be reframed into a general published-evidence question only if the customer accepts the boundary. Otherwise decline and direct the person to an appropriately qualified professional; do not imply Bioupgrade supplies that expertise.

## 3. A fixed-scope entry product at the existing €200

### Proposed promise

> **Research Strategy Session — €200 · 60 minutes · 1:1.** Bring one published paper and one research-literacy question. Work through the study's entity, model, endpoint and limitations, then receive a short written question map with source links and next reading steps. Educational interpretation only; not a diagnosis, treatment recommendation or human-use protocol. Scope and scheduling must be confirmed separately.

This is an operating/copy proposal, not a change to the current title, ID or price. Prefer “Bring a question” over “Bring a goal.” In `Book.tsx`, cognition/recovery/longevity examples and personal-goal language can attract the wrong expectation even beside a medical-advice disclaimer. In the catalogue, “protocol or performance goal” should likewise become “published methods or an evidence question” in a later authorised copy pass. No such edits were made here.

### Scope that can be repeated

**Included:** one agreed educational question, one customer-supplied anchor paper, contextual use of already available library references where relevant, one 60-minute discussion and a concise written question map. **Excluded:** a fresh literature landscape, exhaustive search, systematic review, formal meta-analysis, supplier/batch verification, personal records and continuing advice. If the question cannot fit, explain the limit before taking payment or committing time and offer a briefing quote instead.

**Prework template:**

- What exact question do you want to understand? Phrase it without asking what you personally should take or do.
- Link the anchor paper, DOI/PMID where available, and the relevant claim or passage.
- What do you think it establishes? What remains uncertain?
- What is your intended educational use and familiarity with the topic?
- Confirm that the request excludes personal medical information, diagnosis, prescribing, administration/dosing and personalised performance protocols.
- Confirm whether the source is accessible. A missing/paywalled source must be surfaced, not replaced with an invented finding.

Reuse the public community question builder as a **local drafting aid** only. It currently sends and saves nothing; it is not an inquiry form, Discord post or paid-consultation submission. Customers may manually use its question format in an agreed intake channel once that channel exists and is owner-approved.

**Suggested conversation structure:** agree the question; map entity/model/endpoint; inspect findings and uncertainty; distinguish inference from what was tested; close with a next-step route. Use a standard template rather than opening a new research project during the call.

### Durable written output

Produce a short, versioned question map, not merely a verbal impression:

1. Agreed question and excluded interpretations.
2. Source identity and links; exact entity, model/population, comparator and endpoint.
3. “Reported,” “not established” and “missing/inaccessible” sections. State uncertainty rather than inventing a definitive answer.
4. A reading/decision map: stop here, read a named source next, or investigate a bounded evidence gap.
5. Optional project scope outline if further paid work is appropriate, with no obligation to buy.

Agree delivery timing, format and a bounded factual-correction window before booking. Clarifying a mistake is different from answering a new question; new analysis requires a new scope. Do not promise unlimited follow-up or an unverified turnaround.

## 4. A project ladder, with distinct outputs and acceptance criteria

The ladder is **optional and branched**, not a mandatory sequence or a discount bundle. A sufficiently qualified team may go straight to a quote. Do not make every client purchase a €200 session before a project, or quietly credit/discount it against a later fee.

### Evidence Briefing — From €850, quote only

Best for one bounded research-literacy or educational evidence question that needs more than a paper walkthrough. Prework records the question, source boundaries, intended reader, date cutoff, known references and exclusions. Agree the search/review approach, source budget, meetings and revisions in the quote; do not imply exhaustive coverage from the catalogue starting price.

**Written outputs:** source map; evidence table keeping study type, entity relationship, finding and limitation together; a dated synthesis with uncertainty and missing evidence; a question/next-reading map; and the existing decision session, focused on educational understanding or an internal research workflow, not clinical decisions. Acceptance is whether agreed sources and methods are documented and conclusions are traceable—not whether the briefing delivers a preferred conclusion.

A broad landscape, multiple questions, changing source set or formal regulatory interpretation is not the €850 floor scope. Regulatory source literacy can be discussed, but this is not a legal/regulatory opinion, trial-design sign-off or regulated professional service.

### Applied AI in Bioscience — From €1,200, quote only

Make this the principal **team offer**: a half-day working session around one approved team case. Qualify the sponsor, learning objectives, participant needs, document permissions, delivery format and customisation before quoting. Participant count and facilitator coverage must be agreed, not inferred from “team.”

**Written outputs:** a case workbook, reusable source-evaluation/prompting SOP, quality rubric, and team adoption/action checklist. Demonstrate failure checking, citation verification and appropriate human review. Acceptance is delivery of the agreed exercise and reusable materials; attendance is not proof of competence, certification or an improvement guarantee. Additional cohorts, extensive bespoke research, travel and software costs require explicit scope.

The workshop may stand alone. Recommend a sprint only when the exercise reveals a concrete workflow with an owner, appropriate data and measurable evaluation criteria.

### AI Workflow Sprint — From €2,800, quote only

Focus on **one document-heavy task**, such as preparing a citation-linked evidence table from permitted research documents. Require a workflow owner, sample inputs, current process, authorised data, baseline effort and named reviewers. These are qualification requirements, not evidence that Bioupgrade already has access or delivery capability.

**Written outputs:** baseline/task specification; bounded proof-of-concept specification or agreed PoC artifact; evaluation set and rubric; results including failures and citation checks; SOP and governance handoff covering review ownership, access boundaries and escalation. Any prototype work must be separately authorised and within actual capability. This memo does not create or connect a system.

Acceptance is an agreed, reproducible evaluation and handoff—not promised accuracy, time savings, production readiness or a clinical decision system. No default production deployment, sensitive patient-data ingestion, continuous hosting, unlimited model tuning or ongoing support. Broader implementation needs a new quote, capability check and authorisation.

### Optional retainer — proposal only, no current product or price

Consider a **Research Literacy Review Desk** only after repeat projects show a recurring, bounded need. It could cover an agreed set of source updates or evidence questions, a scheduled educational review and written change notes. Define the source set, question/effort allowance, review frequency, permissions, support channel and termination terms in a new agreement. No always-on monitoring, continuous Discord/DM support, emergency response, unused-credit ambiguity or unlimited questions.

Do not sell a retainer until the owner verifies reviewer availability and actual delivery costs. It is not a live subscription, membership entitlement, newly enabled checkout or a commitment to publish on a schedule.

## 5. Qualification, scope control and reusable delivery

Use a short manual fit check; do not turn sales qualification into an unpaid mini-briefing. Capture only what is needed to decide scope and route.

| Gate | Proceed when | Stop, reframe or requote when |
|---|---|---|
| Educational fit | Question concerns papers, inference, source quality or a non-clinical team workflow | Request seeks diagnosis, prescribing, dosing, administration or a personal protocol |
| Boundedness | One answerable question/task and explicit exclusions | Open-ended “optimise me,” whole-field survey or unlimited questions |
| Source/data permission | Accessible public sources or permitted, non-sensitive examples | Private Discord content, patient records, unauthorised material or unclear confidentiality |
| Buyer and outcome | Intended audience, sponsor and tangible deliverable are clear | Buyer wants a credential, supplier endorsement, guaranteed effect or regulated sign-off |
| Feasibility | Reviewer capability, effort budget and timing are confirmed | Unsupported expertise, unavailable reviewer, excessive source burden or rushed delivery |
| Commercial readiness | Scope/terms agreed and authorised booking/payment route operational | Credentials/calendar unavailable, quote unapproved, or payment confused with reservation |

Every project statement of work should define the question, source/date boundaries, output format, meetings, review rounds, acceptance tests, exclusions, responsibilities, third-party costs and change-order trigger. Timing is agreed only after availability is checked. Establish cancellation/refund and factual-correction terms before payment rather than inventing them in marketing.

Reusable internal materials should include the intake sheet, entity/model/endpoint/replication worksheet, source table, uncertainty register, session question map, quote/SOW template, workshop workbook and sprint evaluation/handoff template. Record actual prep, meeting, writing, review and administration time by offer. Keep customer documents private by default; use a client artifact publicly only with explicit permission and appropriate de-identification. No default recordings or harvesting of private group content.

**Commercial firewall:** catalogue navigation and citations are not endorsements. Consulting must not prescribe a research-material purchase, authenticate a supplier, change material eligibility or grant Discord access. Signal Points do not certify expertise; no new awards for reading, discussion or attendance are proposed. Preserve existing verified-payment, reversal and separate-Cal.com distinctions.

## 6. Instagram → paper → optional Discord discussion → educational consult

This is a **manual channel plan**, not an integration or posting action. No Instagram/Discord login, API connection, post, invite distribution, scraping or automation was performed.

| Step | Proposed owner-operated action | Useful next step | Boundary |
|---|---|---|---|
| Owner-reported Instagram audience; destination unconfirmed | Only after the correct profile and owner control are confirmed, consider an authorised source-led explanation with a clearly paired limitation | Read the exact paper or related public `/research` context | Do not promote the supplied conflicting profile or use the reported follower count as proof of trust, efficacy or likely sales |
| Paper and Meta | Provide source identifiers and explain entity/model/endpoint; link `/meta#methods` | Frame one uncertainty using the public question format | A source link is not approval, a systematic review or supplier verification |
| Discord discussion, conditional | After a valid invite and moderator permission, the owner may invite voluntary discussion of the paper | Discuss the study and unresolved question; optionally follow a public consultation link | No access currently established; no private-content analysis, unsolicited DMs, auto-posting or paid group entitlement |
| Educational consult | Present the €200 one-question offer, or a quote discussion for team/project needs | Complete approved prework; confirm scope, scheduling and payment separately | No conversion promise, instant booking claim, human-use advice or forced upsell |

**Once the correct Instagram destination is confirmed, and until Discord permission is established:** the proposed route is Instagram → public paper/Meta → public question builder → consultation information. Before either destination is confirmed, the public paper/Meta → question builder → consultation route can stand alone. Do not add a fabricated Discord CTA or promote the conflicting Instagram profile. When permission exists, Discord remains optional; the website should clearly distinguish an external community from its own currently non-live community page. Moderator independence and opt-in participation matter more than funnel completion.

Keep the consultation CTA beside a genuine unresolved educational question, not a sensational compound claim. A possible later CTA is: “Want help understanding this study's endpoint and limitations? Discuss one research question.” This is copy guidance, not a published social post.

Start measurement manually with opt-in inquiry source, selected offer, qualifying question, quote status and actual delivery time. Record count-based progression and reasons for rejection; do not infer Discord attribution from private activity or scrape members. Conversion rates require real denominators and observations. There is no conversion forecast here and no follower-to-revenue multiplication.

## 7. Effort, capacity and contribution: illustrative arithmetic, not forecasts

All calculations below were executed in Python using the **current €200/€850/€2,800/€1,200 amounts**. Delivery hours and costs are hypothetical planning inputs, not observed operations, consultant availability or market benchmarks.

For sensitivity testing only, assume a loaded delivery labour cost of **€60/hour**, a **3% receipt-based variable-cost allowance** (not a verified Stripe fee), and other direct costs of **€0/session, €10/briefing, €80/sprint and €40/workshop**. Total effort includes preparation, meetings, writing, review and attributable delivery administration. Briefing and sprint effort are not their elapsed catalogue duration.

**Contribution proxy = catalogue-price receipt − 3% allowance − other direct costs − delivery hours × €60.** This is not net profit or a financial forecast: tax/VAT treatment is unknown, and general sales/content/admin labour, fixed costs, refunds/disputes and acquisition costs are not fully included. If the displayed price includes remittable VAT, calculate on the net revenue basis before using these margins commercially.

| Existing offer | Price used | Bounded effort assumption | Gross receipt/hour | Bounded contribution proxy | Overrun effort assumption | Overrun contribution proxy |
|---|---:|---:|---:|---:|---:|---:|
| Session | €200 | 1.75 h | €114.29 | €89.00 · 44.50% | 3 h | €14.00 · 7.00% |
| Briefing | €850 floor | 8 h | €106.25 | €334.50 · 39.35% | 16 h | −€145.50 · −17.12% |
| Sprint | €2,800 floor | 24 h | €116.67 | €1,196.00 · 42.71% | 48 h | −€244.00 · −8.71% |
| Workshop | €1,200 floor | 10 h | €120.00 | €524.00 · 43.67% | 18 h | €44.00 · 3.67% |

**Implication:** scope control matters before volume. The entry session's 1.75-hour assumption might comprise 1 hour live plus 0.75 hour total preparation/writing/admin; test whether that is achievable without compromising source quality. If not, revise the delivery design or a future offer—not silently underdeliver. The €850 briefing floor is particularly sensitive to fresh search and repeated review rounds.

An illustrative **40% contribution-proxy hurdle**, not an established company margin policy, would allow total delivery effort of approximately **1.90 h/session, 7.91 h/briefing, 25.27 h/sprint and 10.73 h/workshop** at these assumptions. Use actual measured cost/effort and net revenue to replace these limits. They are internal planning thresholds, not public capacity or service guarantees.

For a hypothetical monthly allocation of **100 available working hours**, reserve **40 hours** for sales, content, general admin and contingencies, leaving a **60-hour delivery planning envelope**. Actual headcount and available hours are unknown.

| Hypothetical delivery mix | Gross catalogue-price receipts | Bounded delivery effort | Headroom within 60 h | Contribution proxy before non-delivery overhead | Same mix at overrun effort |
|---|---:|---:|---:|---:|---:|
| 8 sessions + 2 briefings + 1 sprint | €6,100 | 54 h | 6 h | €2,577.00 · 42.25% | 104 delivery hours |
| 8 sessions + 1 briefing + 1 workshop + 1 sprint | €6,450 | 56 h | 4 h | €2,766.50 · 42.89% | 106 delivery hours |

These mixes are workload examples, **not targets, sales forecasts, conversion estimates or promises that projects fit a single month**. The overrun cases would exceed the delivery envelope. Maintain a forward work-in-progress ledger across project weeks; accept work only after checking source burden, review milestones, actual available hours and contingency. Do not launch a retainer on top of a nearly full ledger.

### Future pricing experiments — not live

1. **Entry willingness-to-pay test:** after the scoped €200 design has real delivery data, consider an owner-approved future €250 session variant with otherwise comparable scope. At 1.75 hours and the same assumptions, its contribution proxy would be €137.50. That arithmetic does not predict demand. Keep the current €200 price/ID unchanged; any future experiment requires separately authorised, clearly displayed terms before sale, with no silent repricing or guaranteed uptake.
2. **Quote architecture rather than changing floors:** preserve “From €850” and quote wider work transparently. At a hypothetical 16 hours and €10 direct cost, the same 40% hurdle yields a quote floor of approximately **€1,701.75**: `(16 × 60 + 10) / (1 − 0.03 − 0.40)`. This is an internal scenario, not a live quote, new catalogue amount or claim of market willingness to pay. Apply equivalent measured-effort logic to the existing sprint and workshop starting prices.

Do not introduce discounts, session-credit bundles or retainer billing merely to create apparent conversion. Acquisition spend cannot be justified by the Instagram follower count. Customer lifetime contribution and CAC are unknown; the usual LTV/CAC check cannot yet be calculated credibly. Start with actual paid-project contribution, repeat-purchase evidence and attributed acquisition effort/cost before assessing a ratio or scaling distribution.

## 8. Compact business-model canvas

| Building block | Recommended design |
|---|---|
| Customer segments | Source-led individual learners and communicators; small teams needing shared evidence standards or a bounded document workflow. Avoid personal protocol demand. |
| Value proposition | A traceable written record of what sources establish and do not establish; reusable reading/workflow methods, not authority, medical outcomes or guaranteed automation gains. |
| Channels | A proposed owner-operated Instagram channel only after the correct destination is confirmed, public research library and Meta, conditional moderator-approved external Discord discussion, and transparent offer/scope pages. No new automation. |
| Customer relationships | Explicit fit check, agreed educational scope, documented output, bounded correction process, optional separately quoted continuation. No unlimited DM advice. |
| Revenue streams | Existing €200 session and separately quoted From €850 briefing, From €2,800 sprint, From €1,200 workshop; retainer only a future proposal. No paid group-access entitlement. |
| Key activities | Qualification, source reading and limitation mapping, original synthesis, team education, workflow evaluation, human review and scope/cost measurement. |
| Key resources | Current public source library and editorial method, reusable templates, authorised examples, and owner-confirmed reviewers with capability appropriate to each engagement. Credentials and capacity remain unverified. |
| Key partners | Prospective external community moderators, source publishers/platforms and existing selected payment/calendar providers subject to operational confirmation. No partnership, laboratory affiliation or access agreement is assumed. |
| Cost structure | Delivery preparation/review time, writing, customisation, permitted software/tools, payment costs, sales/content/admin, privacy handling and contingency. Measure these before expanding commitments. |

The proposed defensibility is accumulated reusable methods and auditable delivery records, not a claim of unique credentials. Keep free public source literacy accessible; charge for bounded interpretation, original synthesis and team-specific work. The key trade-off is narrower scope over broad personal-advice appeal.

## 9. Bounded next steps for the owner

**Before accepting new paid work:** approve the educational scope, verify who can deliver it, confirm payment/calendar readiness through an authorised process, agree terms, and create the intake and question-map templates. Until readiness is confirmed, present scope discussion rather than a purchasable reservation. This memo does not perform reconnection or verification.

**First manual delivery test:** use the existing €200 price; record qualification reasons, actual full-cycle hours, written-output completion, factual corrections and whether clients wanted another bounded deliverable. Ask about clarity and usefulness without promising results or turning unapproved feedback into testimonials.

**Then test the team branch:** qualify one real team case and quote the existing workshop or sprint according to effort, data permissions and reviewer capability. Track scope changes, accepted handoffs and actual contribution, not claimed AI effectiveness.

**Only after evidence accumulates:** consider the separately authorised pricing experiment or a scoped retainer proposal. Obtain the pending Discord invite and moderator permission before discussing any external community participation. No automated posts, scraping, integrations or scheduled publishing are necessary to test the model.

### Local source references

- `/home/ubuntu/bioupgrade-recovered/shared/products.ts` — IDs, amounts, deliverables, catalogue timing labels and checkout flags.
- `/home/ubuntu/bioupgrade-recovered/client/src/pages/Products.tsx` — educational boundary, quotes, credential notice and payment/scheduling distinction.
- `/home/ubuntu/bioupgrade-recovered/client/src/pages/Book.tsx` — current €200/60-minute offer, personal-goal wording and separate Cal.com/account-linked payment notice.
- `/home/ubuntu/bioupgrade-recovered/client/src/pages/Research.tsx` — public source index, entity/model/endpoint/replication framework and curated-library limitations.
- `/home/ubuntu/bioupgrade-recovered/client/src/pages/Meta.tsx` — editorial method, source provenance, limitations and commercial firewall.
- `/home/ubuntu/bioupgrade-recovered/client/src/pages/Community.tsx` — non-live-forum status, local-only question builder, discussion boundaries and implemented rewards distinctions.
- `/home/ubuntu/bioupgrade-recovered/client/src/components/CalEmbed.tsx` and `client/src/lib/site.ts` — calendar placeholder/configuration behaviour, not live availability verification.
- `/home/ubuntu/bioupgrade-recovered/client/src/components/landing/Consultation.tsx` — home-page educational consultation positioning.

No external competitor research or private-community access was conducted for this memo. The conflicting public Instagram-profile finding above was supplied separately during the review; it does not verify the owner's claimed audience or the correct destination.
