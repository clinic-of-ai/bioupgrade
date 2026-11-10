console.error(
  "Automatic db:push is disabled for this recovered source: the original Drizzle journal and snapshots are missing."
);
console.error(
  "No migration was run. Read drizzle/0003_APPLY.md; back up and audit the actual schema, rehearse on staging, and have an authorised operator apply the additive SQL once."
);
process.exitCode = 1;
