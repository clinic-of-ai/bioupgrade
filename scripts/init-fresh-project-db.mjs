#!/usr/bin/env node
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const args = new Set(process.argv.slice(2));
const expected = process.argv.find(arg => arg.startsWith("--expected-project="))?.split("=").slice(1).join("=");
if (!expected || expected !== process.env.MANUS_PROJECT_ID || !process.env.DATABASE_URL) {
  throw new Error("Require the explicitly expected new public project ID and this project's managed database environment. Never use against the original database.");
}
const sql = readFileSync(new URL("../drizzle/fresh/0000_fresh_project_baseline.sql", import.meta.url), "utf8");
const digest = createHash("sha256").update(sql).digest("hex");
const statements = sql.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean);
const tableNames = [...sql.matchAll(/CREATE TABLE `([^`]+)`/g)].map(match => match[1]);
if (tableNames.length !== 9 || new Set(tableNames).size !== 9 || statements.some(value => !/^(CREATE TABLE|CREATE (?:UNIQUE )?INDEX|ALTER TABLE[^;]+ADD CONSTRAINT)/.test(value))) {
  throw new Error("Unexpected generated fresh baseline; inspect before any DDL.");
}
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [tables] = await connection.query("SHOW TABLES");
  const existing = tables.map(row => Object.values(row)[0]);
  if (existing.length) {
    console.log(JSON.stringify({ status: "refused_nonempty", tableCount: existing.length, projectId: expected, historicalDataModified: false }));
    process.exitCode = 1;
  } else if (!args.has("--apply-to-empty-project")) {
    console.log(JSON.stringify({ status: "verified_empty", projectId: expected, plannedApplicationTables: tableNames.length, statements: statements.length, baselineSha256: digest, applied: false }));
  } else {
    // MySQL DDL auto-commits. Stop on the first failure; never blindly rerun a partially applied baseline.
    for (const statement of statements) await connection.query(statement);
    await connection.query("CREATE TABLE `bioupgradeSchemaVersions` (`versionName` varchar(96) NOT NULL PRIMARY KEY, `sha256` varchar(64) NOT NULL, `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    await connection.execute("INSERT INTO `bioupgradeSchemaVersions` (`versionName`,`sha256`) VALUES (?,?)", ["fresh_project_baseline", digest]);
    const [after] = await connection.query("SHOW TABLES");
    const created = after.map(row => Object.values(row)[0]);
    if (!tableNames.every(name => created.includes(name))) throw new Error("Fresh baseline did not establish all application tables.");
    console.log(JSON.stringify({ status: "fresh_schema_applied", projectId: expected, applicationTables: tableNames.length, totalTables: created.length, baselineSha256: digest, historicalDataImported: false, fakeAccountsOrOrdersSeeded: false }));
  }
} finally {
  await connection.end();
}
