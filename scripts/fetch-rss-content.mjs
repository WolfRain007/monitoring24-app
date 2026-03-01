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

/* ---------------- RIA ---------------- */

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

function cutFromFirstFooterMarker(lines) {
  const markers = [
    /^РИА Новости$/i,
    /@rian\.ru/i,
    /^ФГУП\s+МИА\s+«Россия сегодня»/i,
    /^Россия сегодня$/i,
    /^\d{4}$/ // "2026"
  ];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (markers.some((re) => re.test(l))) return lines.slice(0, i);
  }
  return lines;
}

function removeTagBlocks(lines, maxScan = 80) {
  const scanLimit = Math.min(lines.length, maxScan);

  let i = 0;
  const result = [];
  while (i < lines.length) {
    if (i < scanLimit && isProbablyTagLine(lines[i])) {
      let j = i;
      while (j < scanLimit && isProbablyTagLine(lines[j])) j++;
      if (j - i >= 3) {
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
  let lines = (text || "")
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean);

  const riaTimePrefix = /^\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}/; // "17:38 01.03.2026"

  lines = lines.filter((l) => {
    if (looksLikeIsoDateLine(l)) return false;
    if (riaTimePrefix.test(l)) return false;
    if (/\(обновлено:/i.test(l)) return false;

    if (/^Коллаж\b/i.test(l)) return false;
    if (/РИА Новости,\s*\d+/i.test(l)) return false;
    if (/- РИА Новости/i.test(l)) return false;

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

  if (lines.length >= 2 && lines[0] === lines[1]) lines.splice(1, 1);

  lines = cutFromFirstFooterMarker(lines);
  lines = removeTagBlocks(lines, 80);

  // убрать до 6 коротких "тегов" подряд в первых 15 строках
  {
    const limit = Math.min(lines.length, 15);
    const cleaned = [];
    let removedInRow = 0;

    for (let i = 0; i < limit; i++) {
      const l = lines[i];
      if (isProbablyTagLine(l) && l.length <= 35) {
        removedInRow++;
        if (removedInRow <= 6) continue;
      } else {
        removedInRow = 0;
      }
      cleaned.push(l);
    }
    lines = cleaned.concat(lines.slice(limit));
  }

  lines = lines.filter((l) => {
    if (!l) return false;
    if (letterRatioLow(l)) return false;
    if (/^\+?\d[\d\s()-]{6,}$/.test(l)) return false;
    if (/@/.test(l) && /rian\.ru/i.test(l)) return false;
    return true;
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------- EuroNews ---------------- */

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

  // убрать блок "Published on" + дату (обычно первые 2 строки)
  if (lines[0]?.toLowerCase() === "published on") {
    lines.shift();
    if (lines[0] && /^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{1,2}:\d{2}/.test(lines[0])) {
      lines.shift();
    }
  } else {
    // иногда попадается в первых 10 строках
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      if (lines[i]?.toLowerCase() === "published on") {
        lines.splice(i, 1);
        if (lines[i] && /^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{1,2}:\d{2}/.test(lines[i])) {
          lines.splice(i, 1);
        }
        break;
      }
    }
  }

  const isAdLine = (l) => {
    const u = (l || "").trim().toUpperCase();
    if (u === "AD") return true;
    if (u === "ADVE") return true;
    if (u.startsWith("ADVERTISEMENT")) return true;
    return false;
  };
  lines = lines.filter((l) => !isAdLine(l));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------- Generic ---------------- */

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

/* ---------------- Fetch/Extract ---------------- */

async function fetchHtml(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; monitoring24-app/1.0; +https://github.com/WolfRain007/monitoring24-app)",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
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

async function setStatus(id, status, content_html = "", content_text = "", error = "") {
  const payload = {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500)
  };

  const { data, error: saveErr } = await supabase.rpc("set_news_item_content", payload);

  if (saveErr) {
    console.error("set_news_item_content failed", {
      id,
      status,
      message: saveErr.message,
      details: saveErr.details,
      hint: saveErr.hint,
      code: saveErr.code
    });
    throw saveErr;
  }

  return data;
}

async function main() {
  console.log("env", {
    SUPABASE_URL,
    SERVICE_ROLE_PREFIX: (SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 6),
    BATCH_LIMIT,
    MIN_TEXT_LEN,
    MAX_TEXT_LEN
  });

  const limit = Math.min(Math.max(BATCH_LIMIT, 1), 500);

  const { data: items, error } = await supabase.rpc("fetch_next_news_items_for_content", {
    p_limit: limit
  });
  if (error) throw error;

  if (!items || items.length === 0) {
    console.log("No items to fetch.");
    return;
  }

  console.log(`Fetched batch: ${items.length}`);

  for (const it of items) {
    const { id, url, source_id } = it;

    try {
      const html = await fetchHtml(url);
      const { content_html, content_text_raw } = extractReadable(html, url);

      let content_text;
      if (source_id === "ria") content_text = normalizeRia(content_text_raw, url);
      else if (source_id === "euronews") content_text = normalizeEuronews(content_text_raw, url);
      else content_text = normalizeGeneric(content_text_raw, url);

      content_text = clampText(content_text, MAX_TEXT_LEN);

      if (!content_text || content_text.length < MIN_TEXT_LEN) {
        await setStatus(id, "error", "", "", "Extracted content too short/empty");
        console.log(`error: ${source_id} ${id} Extracted content too short/empty`);
        continue;
      }

      await setStatus(id, "ok", content_html, content_text, "");
      console.log(`ok: ${source_id} ${id}`);
    } catch (e) {
      const msg = e?.message ? e.message : String(e);

      if (msg.includes("HTTP 403") || e?.code === 403) {
        await setStatus(id, "blocked_403", "", "", "HTTP 403");
        console.log(`blocked_403: ${source_id} ${id}`);
        continue;
      }

      await setStatus(id, "error", "", "", msg);
      console.log(`error: ${source_id} ${id} ${msg}`);
    }
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
