#!/usr/bin/env node
/**
 * Downloads product images listed in "inventaire_complete 1(in).csv".
 *
 * Usage:  node download_images.mjs [csvFile] [--limit N]
 *   csvFile  defaults to "inventaire_complete 1(in).csv"
 *   --limit  only process the first N products (for testing)
 *
 * Output:
 *   images/<Reference>/<Reference>_1.jpg, _2.jpg, ...
 *   failed_urls.csv  (reference,url,error) for anything that could not be fetched
 *
 * The CSV has broken quoting on some rows and URLs that contain commas,
 * so we deliberately do NOT parse it as CSV: we take the Reference from
 * the start of each line and regex-extract every http(s) URL from the raw line.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, unlinkSync, appendFileSync, writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const csvFile = args.find((a) => !a.startsWith("--") && a !== String(limit)) ?? "inventaire_complete_1(in).csv";

const OUT_DIR = "images";
const FAILED_FILE = "failed_urls.csv";
const CONCURRENCY = 6;
const TIMEOUT_MS = 30_000;
const RETRIES = 2;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// --- parse ---------------------------------------------------------------

const lines = readFileSync(csvFile, "latin1").split(/\r?\n/);
const products = [];
for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  const reference = line.split(",")[0].replace(/^﻿|"/g, "").trim();
  if (!reference) continue;
  const urls = [...line.matchAll(/https?:\/\/\S+/g)]
    .map((m) => m[0].replace(/[;",]+$/, "")) // strip trailing junk: ;;;; or ;" etc.
    .filter((u, i, arr) => arr.indexOf(u) === i); // dedupe
  if (urls.length) products.push({ reference, urls });
}
const todo = products.slice(0, limit);
console.log(`${todo.length} products, ${todo.reduce((n, p) => n + p.urls.length, 0)} images to download`);

// --- download ------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(FAILED_FILE, "reference,url,error\n");

function extFromUrl(url, contentType) {
  const byType = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };
  if (contentType && byType[contentType.split(";")[0].trim()]) return byType[contentType.split(";")[0].trim()];
  const m = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.8" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

let done = 0, failed = 0, skipped = 0;

async function downloadProduct({ reference, urls }) {
  const safeRef = reference.replace(/[^\w.\-]/g, "_");
  const dir = path.join(OUT_DIR, safeRef);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const base = path.join(dir, `${safeRef}_${i + 1}`);
    // skip if already downloaded with any extension
    if ([".jpg", ".png", ".webp", ".gif", ".avif"].some((e) => existsSync(base + e) && statSync(base + e).size > 0)) {
      skipped++;
      continue;
    }
    try {
      const res = await fetchWithRetry(url);
      const file = base + extFromUrl(url, res.headers.get("content-type"));
      await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
      if (statSync(file).size === 0) { unlinkSync(file); throw new Error("empty file"); }
      done++;
    } catch (e) {
      failed++;
      appendFileSync(FAILED_FILE, `${reference},"${url}","${String(e.message ?? e).replace(/"/g, "'")}"\n`);
    }
  }
  process.stdout.write(`\r${done} ok, ${failed} failed, ${skipped} skipped`);
}

// simple worker pool
const queue = [...todo];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await downloadProduct(queue.shift());
  })
);

console.log(`\nDone: ${done} downloaded, ${failed} failed (see ${FAILED_FILE}), ${skipped} already existed.`);
