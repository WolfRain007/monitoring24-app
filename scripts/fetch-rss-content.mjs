// scripts/fetch-rss-content.mjs
import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * ПРОФИ-ВЕРСИЯ:
 * - extractor chain: readability -> jsonld -> selector
 * - конфиг по source_id (TASS получает JSON-LD fallback автоматически)
 * - quality scoring (не только длина)
 * - аккуратные статусы + backoff
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ---------------- Env ---------------- */

const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");
const MAX_TEXT_LEN = Number(process.env.MAX_TEXT_LEN || "60000");

const MIN_TEXT_LEN = Number(process.env.MIN_TEXT_LEN || "400");
const MIN_TEXT_LEN_RIA = Number(process.env.MIN_TEXT_LEN_RIA || "250");
const MIN_TEXT_LEN_EURONEWS = Number(process.env.MIN_TEXT_LEN_EURONEWS || "250");
const MIN_TEXT_LEN_TASS = Number(process.env.MIN_TEXT_LEN_TASS || "250");

const MAX_FETCH_ATTEMPTS = Number(process.env.MAX_FETCH_ATTEMPTS || "6");
const DEFAULT_BLOCKED_403_QUARANTINE_DAYS = Number(
  process.env.DEFAULT_BLOCKED_403_QUARANTINE_DAYS || "7"
);

const ENABLE_EXTRACTOR_READABILITY = String(process.env.ENABLE_EXTRACTOR_READABILITY || "1") !== "0";
const ENABLE_EXTRACTOR_JSONLD = String(process.env.ENABLE_EXTRACTOR_JSONLD || "1") !== "0";
const ENABLE_EXTRACTOR_SELECTOR = String(process.env.ENABLE_EXTRACTOR_SELECTOR || "1") !== "0";

/* ---------------- Utils ---------------- */

function clampText(s, maxLen) {
  const t = (s || "").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + "…";
}

function collapseSpacesLine(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function looksLikeIsoDateLine(line) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?$/.test(line);
}

function stripUrlsInsideLine(line) {
  return (line || "").replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
}

function letterRatioLow(line) {
  const l = line || "";
  const letters = (l.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  const digits = (l.match(/[0-9]/g) || []).length;
  const other = l.length - letters - digits;
  const effective = Math.max(1, letters + digits + other);
  return letters / effective < 0.25 && l.length > 30;
}

function addSecondsToNow(sec) {
  return new Date(Date.now() + sec * 1000).toISOString();
}

function nextRetryIso(attempts) {
  const scheduleSec = [120, 300, 900, 3600, 21600, 86400];
  const idx = Math.min(Math.max(attempts, 1), scheduleSec.length) - 1;
  return addSecondsToNow(scheduleSec[idx]);
}

/* ---------------- Normalizers ---------------- */

function isProbablyTagLine(l) {
  if (!l) return false;
  if (l.length > 60) return false;
  if (/[.!?…"»)]$/.test(l)) return false;

  const words = l.split(" ").filter(Boolean);
  if (words.length < 1 || words.length > 6) return false;

  if (/@/.test(l)) return false;
  if (/^\+?\d[\d\s()-]{6,}$/.test(l)) return false;

  return true;
}

function removeTagBlocks(lines, maxScan = 60) {
  const scanLimit = Math.min(lines.length, maxScan);

  let i = 0;
  const result = [];
  while (i < lines.length) {
    if (i < scanLimit && isProbablyTagLine(lines[i])) {
      let j = i;
      while (j < scanLimit && isProbablyTagLine(lines[j])) j++;

      const blockLen = j - i;
      const blockChars = lines.slice(i, j).join(" ").length;

      if (blockLen >= 5 && blockChars <= 180) {
        i = j;
        continue;
      }
    }
    result.push(lines[i]);
    i++;
  }
  return result;
}

function normalizeRia(text, url) {
  const raw = (text || "").trim();

  let lines = raw
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean);

  const riaTimePrefix = /^\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}/;

  lines = lines.filter((l) => {
