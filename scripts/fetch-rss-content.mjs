import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");
const MAX_TEXT_LEN = Number(process.env.MAX_TEXT_LEN || "60000");

const MIN_TEXT_LEN = Number(process.env.MIN_TEXT_LEN || "400");
const MIN_TEXT_LEN_RIA = Number(process.env.MIN_TEXT_LEN_RIA || "250");
const MIN_TEXT_LEN_EURONEWS = Number(process.env.MIN_TEXT_LEN_EURONEWS || "250");

const MAX_FETCH_ATTEMPTS = Number(process.env.MAX_FETCH_ATTEMPTS || "6");
const DEFAULT_BLOCKED_403_QUARANTINE_DAYS = Number(
  process.env.DEFAULT_BLOCKED_403_QUARANTINE_DAYS || "7"
);

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

  lines = removeTagBlocks(lines, 60);

  lines = lines.filter((l) => {
    if (!l) return false;
    if (letterRatioLow(l)) return false;
    return true;
  });

  let cleaned = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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

/* ---------------- Backoff ---------------- */

function addSecondsToNow(sec) {
  return new Date(Date.now() + sec * 1000).toISOString();
}

function nextRetryIso(attempts) {
  const scheduleSec = [120, 300, 900, 3600, 21600, 86400];
  const idx = Math.min(Math.max(attempts, 1), scheduleSec.length) - 1;
  return addSecondsToNow(scheduleSec[idx]);
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
      err.http_status = 403;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.http_status = res.status;
      throw err;
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.startsWith("text/html")) {
      const err = new Error(`Non-HTML content-type: ${ct}`);
      err.http_status = 200;
      throw err;
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
      if (!node) continue;

      const candidates = [];
      if (Array.isArray(node["@graph"])) candidates.push(...node["@graph"]);
      candidates.push(node);

      for (const c of candidates) {
        const body = c?.articleBody;
        if (typeof body === "string" && body.trim().length > 0) bodies.push(body.trim());
      }
    }
  }

  const best = bodies.sort((a, b) => b.length - a.length)[0] || "";
  return { content_html: "", content_text_raw: best };
}

/* ---------------- Save ---------------- */

async function setStatus(
  id,
  status,
  content_html = "",
  content_text = "",
  error = "",
  http_status = null,
  next_fetch_at_iso = null
) {
  const payload = {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500),
    p_http_status: http_status,
    p_next_fetch_at: next_fetch_at_iso
  };

  const { error: saveErr } = await supabase.rpc("set_news_item_content", payload);
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
}

/* ---------------- Main ---------------- */

async function main() {
  console.log("env", {
    SUPABASE_URL,
    SERVICE_ROLE_PREFIX: (SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 6),
    BATCH_LIMIT,
    MIN_TEXT_LEN,
    MIN_TEXT_LEN_RIA,
    MIN_TEXT_LEN_EURONEWS,
    MAX_TEXT_LEN,
    MAX_FETCH_ATTEMPTS,
    DEFAULT_BLOCKED_403_QUARANTINE_DAYS
  });

  const limit = Math.min(Math.max(BATCH_LIMIT, 1), 500);

  const { data: items, error } = await supabase.rpc("fetch_next_news_items_for_content_v2", {
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

    const mode = String(it?.content_fetch_mode || "html");
    const qDays = Number(it?.blocked_403_quarantine_days || DEFAULT_BLOCKED_403_QUARANTINE_DAYS);

    // attempts может не приходить из RPC (в v2 сейчас не возвращаем), поэтому берём 0
    const attempts = 0;

    // safety: если вдруг попало disabled — не работаем
    if (mode === "disabled") {
      continue;
    }

    try {
      const html = await fetchHtml(url);

      let { content_html, content_text_raw } = extractReadable(html, url);

      if (source_id === "ria" && (!content_text_raw || content_text_raw.trim().length < 200)) {
        const fb = extractFromJsonLdArticleBody(html, url);
        if (fb.content_text_raw && fb.content_text_raw.length > (content_text_raw || "").length) {
          content_text_raw = fb.content_text_raw;
        }
      }

      let content_text;
      if (source_id === "ria") content_text = normalizeRia(content_text_raw, url);
      else if (source_id === "euronews") content_text = normalizeEuronews(content_text_raw, url);
      else content_text = normalizeGeneric(content_text_raw, url);

      content_text = clampText(content_text, MAX_TEXT_LEN);

      const minLen =
        source_id === "ria" ? MIN_TEXT_LEN_RIA :
        source_id === "euronews" ? MIN_TEXT_LEN_EURONEWS :
        MIN_TEXT_LEN;

      if (!content_text || content_text.length < minLen) {
        await setStatus(
          id,
          "skipped_too_short",
          "",
          "",
          `Extracted content too short/empty (raw_len=${(content_text_raw || "").length}, cleaned_len=${(content_text || "").length}, min_len=${minLen})`,
          200,
          null
        );
        console.log(`skipped_too_short: ${source_id} ${id}`);
        continue;
      }

      await setStatus(id, "ok", content_html || "", content_text, "", 200, null);
      console.log(`ok: ${source_id} ${id} len=${content_text.length}`);
    } catch (e) {
      const msg = e?.message ? e.message : String(e);
      const httpStatus = Number(e?.http_status || 0) || null;

      if (httpStatus === 403 || msg.includes("HTTP 403")) {
        const nextIso = addSecondsToNow(qDays * 24 * 3600);
        await setStatus(id, "blocked_403", "", "", "HTTP 403", 403, nextIso);
        console.log(`blocked_403: ${source_id} ${id} next=${nextIso}`);
        continue;
      }

      if (httpStatus && httpStatus >= 500 && httpStatus <= 599) {
        const nextIso = nextRetryIso(attempts + 1);
        const finalStatus = attempts + 1 >= MAX_FETCH_ATTEMPTS ? "error" : "retry_later";
        await setStatus(
          id,
          finalStatus,
          "",
          "",
          msg,
          httpStatus,
          finalStatus === "retry_later" ? nextIso : null
        );
        console.log(`${finalStatus}: ${source_id} ${id} ${msg}`);
        continue;
      }

      const isNetworkish =
        msg === "fetch failed" ||
        e?.name === "AbortError" ||
        /ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|UND_ERR_CONNECT_TIMEOUT/i.test(msg);

      if (isNetworkish) {
        const nextIso = nextRetryIso(attempts + 1);
        const finalStatus = attempts + 1 >= MAX_FETCH_ATTEMPTS ? "error" : "retry_later";
        await setStatus(
          id,
          finalStatus,
          "",
          "",
          msg,
          httpStatus,
          finalStatus === "retry_later" ? nextIso : null
        );
        console.log(`${finalStatus}: ${source_id} ${id} ${msg}`);
        continue;
      }

      await setStatus(id, "error", "", "", msg, httpStatus, null);
      console.log(`error: ${source_id} ${id} ${msg}`);
    }
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
