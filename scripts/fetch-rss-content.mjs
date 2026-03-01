import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");
const MAX_TEXT_LEN = Number(process.env.MAX_TEXT_LEN || "60000");
const MIN_TEXT_LEN = Number(process.env.MIN_TEXT_LEN || "400");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

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

/* ---------------- RIA helpers ---------------- */

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

// мягко удаляем только реально "список рубрик"
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

      // удаляем только если блок:
      // - >= 5 строк
      // - и суммарно <= 180 символов (похоже на рубрики/теги)
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

  // мягкая фильтрация служебных строк
  lines = lines.filter((l) => {
    if (looksLikeIsoDateLine(l)) return false;
    if (riaTimePrefix.test(l)) return false;
    if (/\(обновлено:/i.test(l)) return false;
    if (/^Коллаж\b/i.test(l)) return false;
    return true;
  });

  lines = lines
    .map(stripUrlsInsideLine)
    .map(collapseSpacesLine)
    .filter(Boolean);

  if (url) {
    const u = url.trim();
    lines = lines.filter((l) => l !== u);
  }

  // футер режем только в хвосте (последние 25 строк)
  {
    const footerMarkers = [
      /^РИА Новости$/i,
      /@rian\.ru/i,
      /^ФГУП\s+МИА\s+«Россия сегодня»/i,
      /^Россия сегодня$/i
    ];

    const tailStart = Math.max(0, lines.length - 25);
    for (let i = tailStart; i < lines.length; i++) {
      const l = lines[i];
      if (footerMarkers.some((re) => re.test(l))) {
        lines = lines.slice(0, i);
        break;
      }
    }
  }

  // теги/рубрики — только если это реально список
  lines = removeTagBlocks(lines, 60);

  // лёгкая финальная фильтрация
  lines = lines.filter((l) => {
    if (!l) return false;
    if (letterRatioLow(l)) return false;
    return true;
  });

  let cleaned = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // предохранитель: если чистка "убила" текст — вернём raw
  // (у тебя raw_len 2k-6k, а cleaned становился слишком маленьким)
  if (cleaned.length < 300 && raw.length > 800) cleaned = raw;

  return cleaned;
}

/* ---------------- EuroNews normalizer ---------------- */

function normalizeEuronews(text, url) {
  let lines = (text || "")
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean);

  lines = lines
    .map(stripUrlsInsideLine)
    .map(collapseSpacesLine)
    .filter(Boolean);

  if (url) {
    const u = url.trim();
    lines = lines.filter((l) => l !== u);
  }

  // "Published on" + дата
  if (lines[0]?.toLowerCase() === "published on") {
    lines.shift();
    if (lines[0] && /^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{1,2}:\d{2}/.test(lines[0])) {
      lines.shift();
    }
  }

  const isAdLine = (l) => {
    const u = (l || "").trim().toUpperCase();
    return u === "AD" || u === "ADVE" || u.startsWith("ADVERTISEMENT");
  };
  lines = lines.filter((l) => !isAdLine(l));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeGeneric(text, url) {
  let lines = (text || "")
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean)
    .map(stripUrlsInsideLine)
    .map(collapseSpacesLine)
    .filter(Boolean);

  if (url) {
    const u = url.trim();
    lines = lines.filter((l) => l !== u);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------- Fetch ---------------- */

async function fetchHtml(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; monitoring24-app/1.0; +https://github.com/WolfRain007/monitoring24-app)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (res.status === 403) {
      const err = new Error("HTTP 403");
      err.code = 403;
      throw err;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.startsWith("text/html")) {
      throw new Error(`Non-HTML content-type: ${ct}`);
    }

    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/* ---------------- Extractors ---------------- */

function extractReadable(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content) {
    return { content_html: "", content_text_raw: "" };
  }

  const content_html = article.content;

  const content_text_raw = htmlToText(content_html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" }
    ]
  });

  return { content_html, content_text_raw };
}

function extractFromJsonLdArticleBody(html, url) {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const bodies = [];

  for (const s of scripts) {
    const raw = (s.textContent || "").trim();
    if (!raw) continue;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const stack = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of stack) {
      if (!node
