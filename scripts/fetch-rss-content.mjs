// scripts/fetch-rss-content.mjs
import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const numEnv = (name, fallback) => {
  const v = process.env[name];
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const BATCH_LIMIT = numEnv("BATCH_LIMIT", 50);
const MAX_TEXT_LEN = numEnv("MAX_TEXT_LEN", 60000);

const MIN_TEXT_LEN = numEnv("MIN_TEXT_LEN", 400);
const MIN_TEXT_LEN_RIA = numEnv("MIN_TEXT_LEN_RIA", 250);
const MIN_TEXT_LEN_EURONEWS = numEnv("MIN_TEXT_LEN_EURONEWS", 250);
const MIN_TEXT_LEN_TASS = numEnv("MIN_TEXT_LEN_TASS", 250);

const MAX_FETCH_ATTEMPTS = numEnv("MAX_FETCH_ATTEMPTS", 6);
const DEFAULT_BLOCKED_403_QUARANTINE_DAYS = numEnv("DEFAULT_BLOCKED_403_QUARANTINE_DAYS", 7);

const ENABLE_EXTRACTOR_READABILITY = String(process.env.ENABLE_EXTRACTOR_READABILITY ?? "1") !== "0";
const ENABLE_EXTRACTOR_JSONLD = String(process.env.ENABLE_EXTRACTOR_JSONLD ?? "1") !== "0";
const ENABLE_EXTRACTOR_SELECTOR = String(process.env.ENABLE_EXTRACTOR_SELECTOR ?? "1") !== "0";

const SELECTOR_TASS =
  process.env.SELECTOR_TASS ||
  "main article, article, [itemprop='articleBody'], .news-item, .tass-article, .tass-article__content, .text, .content";
const SELECTOR_RIA =
  process.env.SELECTOR_RIA ||
  "article, [itemprop='articleBody'], .article__body, .article__text, .layout-article__content";
const SELECTOR_EURONEWS =
  process.env.SELECTOR_EURONEWS ||
  "article, [itemprop='articleBody'], .c-article-content, .article-content, .o-article__body";

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
    if (looksLikeIsoDateLine(l)) return false;
    if (riaTimePrefix.test(l)) return false;
    if (/\(обновлено:/i.test(l)) return false;
    if (/^Коллаж\b/i.test(l)) return false;
    return true;
  });

  lines = lines.map(stripUrlsInsideLine).map(collapseSpacesLine).filter(Boolean);

  if (url) {
    const u = url.trim();
    lines = lines.filter((l) => l !== u);
  }

  {
    const footerMarkers = [
      /^РИА Новости$/i,
      /@rian\.ru/i,
      /^ФГУП\s+МИА\s+«Россия сегодня»/i,
      /^Россия сегодня$/i,
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

function normalizeEuronews(text, url) {
  let lines = (text || "")
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean);

  lines = lines.map(stripUrlsInsideLine).map(collapseSpacesLine).filter(Boolean);

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
    return u === "AD" || u.startsWith("ADVERTISEMENT");
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

/* ---------------- Quality scoring ---------------- */

function computeQualityScore(text) {
  const t = (text || "").trim();
  if (!t) return 0;

  const len = t.length;
  const paragraphs = t.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;
  const lines = t.split("\n").filter(Boolean).length;

  const letters = (t.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  const digits = (t.match(/[0-9]/g) || []).length;
  const ratioLetters = letters / Math.max(1, len);

  let score = 0;

  if (len >= 200) score += 10;
  if (len >= 400) score += 15;
  if (len >= 800) score += 20;
  if (len >= 1500) score += 10;

  if (paragraphs >= 2) score += 10;
  if (paragraphs >= 4) score += 10;

  if (lines >= 10) score += 5;
  if (ratioLetters >= 0.45) score += 10;
  if (digits / Math.max(1, len) < 0.2) score += 5;

  const lower = t.toLowerCase();
  const badMarkers = [
    "enable javascript",
    "please enable javascript",
    "cookies",
    "cookie",
    "subscribe",
    "подпиш",
    "оформите подписку",
    "войдите",
    "авториз",
  ];
  if (badMarkers.some((m) => lower.includes(m))) score -= 20;

  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
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
          "Mozilla/5.0 (compatible; monitoring24-content-fetcher/1.0; +https://monitoring24.info)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
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

function extractor_readability(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content) {
    return { extractor: "readability", content_html: "", content_text_raw: "" };
  }

  const content_html = article.content;

  const content_text_raw = htmlToText(content_html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  });

  return { extractor: "readability", content_html, content_text_raw };
}

function extractor_jsonld_articleBody(html, url) {
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
  return { extractor: "jsonld_articleBody", content_html: "", content_text_raw: best };
}

function extractor_selector(html, url, selector) {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const el = selector ? doc.querySelector(selector) : null;
  if (!el) return { extractor: "selector", content_html: "", content_text_raw: "" };

  const content_html = el.innerHTML || "";
  const content_text_raw = htmlToText(content_html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  });

  return { extractor: "selector", content_html, content_text_raw };
}

/* ---------------- Source config ---------------- */

function getSourceMinLen(source_id) {
  if (source_id === "ria") return MIN_TEXT_LEN_RIA;
  if (source_id === "euronews") return MIN_TEXT_LEN_EURONEWS;
  if (source_id === "tass") return MIN_TEXT_LEN_TASS;
  return MIN_TEXT_LEN;
}

function getSourceSelector(source_id) {
  if (source_id === "tass") return SELECTOR_TASS;
  if (source_id === "ria") return SELECTOR_RIA;
  if (source_id === "euronews") return SELECTOR_EURONEWS;
  return "main article, article, [itemprop='articleBody']";
}

function normalizeBySource(source_id, text, url) {
  if (source_id === "ria") return normalizeRia(text, url);
  if (source_id === "euronews") return normalizeEuronews(text, url);
  return normalizeGeneric(text, url);
}

function pickBestCandidate(candidates, source_id, minLen, url) {
  let best = null;

  for (const c of candidates) {
    const cleaned = normalizeBySource(source_id, c.content_text_raw, url);
    const clamped = clampText(cleaned, MAX_TEXT_LEN);
    const score = computeQualityScore(clamped);

    const cand = {
      ...c,
      content_text_clean: clamped,
      quality_score: score,
      len_raw: (c.content_text_raw || "").trim().length,
      len_clean: clamped.length,
    };

    if (!best) {
      best = cand;
      continue;
    }

    const bestPass = best.len_clean >= minLen;
    const candPass = cand.len_clean >= minLen;

    if (candPass && !bestPass) {
      best = cand;
      continue;
    }
    if (candPass === bestPass) {
      if (cand.quality_score > best.quality_score) {
        best = cand;
        continue;
      }
      if (cand.quality_score === best.quality_score && cand.len_clean > best.len_clean) {
        best = cand;
        continue;
      }
    }
  }

  return best;
}

/* ---------------- Save ---------------- */

async function setStatusV1({
  id,
  status,
  content_html = "",
  content_text = "",
  error = "",
  http_status = null,
  next_fetch_at = null,
}) {
  const payload = {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500),
    p_http_status: http_status,
    p_next_fetch_at: next_fetch_at,
  };

  const { error: saveErr } = await supabase.rpc("set_news_item_content", payload);
  if (saveErr) throw new Error(`set_news_item_content failed: ${saveErr.message}`);
}

async function setStatusV2({
  id,
  status,
  content_html = "",
  content_text = "",
  error = "",
  http_status = null,
  next_fetch_at = null,
  extractor = null,
  quality_score = null,
  len_raw = null,
  len_clean = null,
}) {
  const payload = {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500),
    p_http_status: http_status,
    p_next_fetch_at: next_fetch_at,
    p_extractor: extractor,
    p_quality_score: quality_score,
    p_len_raw: len_raw,
    p_len_clean: len_clean,
  };

  const { error: saveErr } = await supabase.rpc("set_news_item_content_v2", payload);
  if (saveErr) throw new Error(`set_news_item_content_v2 failed: ${saveErr.message}`);
}

async function setStatus(payload) {
  try {
    await setStatusV2(payload);
  } catch (e) {
    const msg = e?.message || String(e);
    if (
      msg.includes("set_news_item_content_v2") ||
      msg.includes("function public.set_news_item_content_v2") ||
      msg.includes("does not exist")
    ) {
      await setStatusV1(payload);
      return;
    }
    throw e;
  }
}

/* ---------------- Main ---------------- */

async function main() {
  const limit = Math.min(Math.max(BATCH_LIMIT, 1), 500);

  const { data: items, error } = await supabase.rpc("fetch_next_news_items_for_content_v2", {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`fetch_next_news_items_for_content_v2 error: ${error.message}`);
  }

  if (!items || items.length === 0) {
    console.log(JSON.stringify({ ok: true, fetched: 0, processed: 0 }, null, 2));
    return;
  }

  let processed = 0;
  const results = {};

  for (const it of items) {
    const id = it.id;
    const url = it.url;
    const source_id = it.source_id;

    const mode = String(it.content_fetch_mode || "html");
    const qDays = Number(it.blocked_403_quarantine_days || DEFAULT_BLOCKED_403_QUARANTINE_DAYS);
    const attempts = Number(it.content_fetch_attempts || 0);

    if (mode === "disabled") continue;

    const minLen = getSourceMinLen(source_id);

    if (mode === "rss_only") {
      try {
        let raw = String(it.content_text || "").trim();
        if (!raw) {
          const html = String(it.content_html || "").trim();
          raw = html
            ? htmlToText(html, {
                wordwrap: false,
                preserveNewlines: true,
                selectors: [
                  { selector: "a", options: { ignoreHref: true } },
                  { selector: "img", format: "skip" },
                ],
              })
            : "";
        }

        const cleaned = clampText(normalizeBySource(source_id, raw, url), MAX_TEXT_LEN);
        const score = computeQualityScore(cleaned);

        if (!cleaned || cleaned.length < minLen) {
          await setStatus({
            id,
            status: "skipped_too_short",
            content_html: "",
            content_text: "",
            error: `RSS-only: content too short/empty (raw_len=${raw.length}, cleaned_len=${cleaned.length}, min_len=${minLen})`,
            http_status: 200,
            next_fetch_at: null,
            extractor: "rss_only",
            quality_score: score,
            len_raw: raw.length,
            len_clean: cleaned.length,
          });
          results.skipped_too_short = (results.skipped_too_short || 0) + 1;
          processed++;
          continue;
        }

        await setStatus({
          id,
          status: "ok",
          content_html: "",
          content_text: cleaned,
          error: "",
          http_status: 200,
          next_fetch_at: null,
          extractor: "rss_only",
          quality_score: score,
          len_raw: raw.length,
          len_clean: cleaned.length,
        });
        results.ok = (results.ok || 0) + 1;
        processed++;
        continue;
      } catch (e) {
        const msg = e?.message || String(e);
        await setStatus({
          id,
          status: "error",
          content_html: "",
          content_text: "",
          error: `rss_only failed: ${msg}`,
          http_status: null,
          next_fetch_at: null,
          extractor: "rss_only",
          quality_score: null,
          len_raw: null,
          len_clean: null,
        });
        results.error = (results.error || 0) + 1;
        processed++;
        continue;
      }
    }

    try {
      const html = await fetchHtml(url);

      const candidates = [];

      if (ENABLE_EXTRACTOR_READABILITY) {
        candidates.push(extractor_readability(html, url));
      }
      if (ENABLE_EXTRACTOR_JSONLD) {
        candidates.push(extractor_jsonld_articleBody(html, url));
      }
      if (ENABLE_EXTRACTOR_SELECTOR) {
        candidates.push(extractor_selector(html, url, getSourceSelector(source_id)));
      }

      const best = pickBestCandidate(candidates, source_id, minLen, url);

      if (!best || !best.content_text_clean || best.len_clean < minLen) {
        const rawMax = Math.max(...candidates.map((c) => (c.content_text_raw || "").trim().length), 0);

        await setStatus({
          id,
          status: "skipped_too_short",
          content_html: "",
          content_text: "",
          error: `Extracted content too short/empty (best_len=${best?.len_clean || 0}, min_len=${minLen}, raw_max=${rawMax})`,
          http_status: 200,
          next_fetch_at: null,
          extractor: best?.extractor || null,
          quality_score: best?.quality_score ?? null,
          len_raw: best?.len_raw ?? null,
          len_clean: best?.len_clean ?? null,
        });
        results.skipped_too_short = (results.skipped_too_short || 0) + 1;
        processed++;
        continue;
      }

      await setStatus({
        id,
        status: "ok",
        content_html: best.content_html || "",
        content_text: best.content_text_clean,
        error: "",
        http_status: 200,
        next_fetch_at: null,
        extractor: best.extractor,
        quality_score: best.quality_score,
        len_raw: best.len_raw,
        len_clean: best.len_clean,
      });

      results.ok = (results.ok || 0) + 1;
      processed++;
    } catch (e) {
      const msg = e?.message || String(e);
      const httpStatus = Number(e?.http_status || 0) || null;

      if (httpStatus === 403 || msg.includes("HTTP 403")) {
        const nextIso = addSecondsToNow(qDays * 24 * 3600);
        await setStatus({
          id,
          status: "blocked_403",
          content_html: "",
          content_text: "",
          error: "HTTP 403",
          http_status: 403,
          next_fetch_at: nextIso,
          extractor: null,
          quality_score: null,
          len_raw: null,
          len_clean: null,
        });
        results.blocked_403 = (results.blocked_403 || 0) + 1;
        processed++;
        continue;
      }

      const is5xx = httpStatus && httpStatus >= 500 && httpStatus <= 599;
      const isNetworkish =
        msg === "fetch failed" ||
        e?.name === "AbortError" ||
        /ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|UND_ERR_CONNECT_TIMEOUT/i.test(msg);

      if (is5xx || isNetworkish) {
        const nextIso = nextRetryIso(attempts + 1);
        const finalStatus = attempts + 1 >= MAX_FETCH_ATTEMPTS ? "error" : "retry_later";
        await setStatus({
          id,
          status: finalStatus,
          content_html: "",
          content_text: "",
          error: msg,
          http_status: httpStatus,
          next_fetch_at: finalStatus === "retry_later" ? nextIso : null,
          extractor: null,
          quality_score: null,
          len_raw: null,
          len_clean: null,
        });
        results[finalStatus] = (results[finalStatus] || 0) + 1;
        processed++;
        continue;
      }

      await setStatus({
        id,
        status: "error",
        content_html: "",
        content_text: "",
        error: msg,
        http_status: httpStatus,
        next_fetch_at: null,
        extractor: null,
        quality_score: null,
        len_raw: null,
        len_clean: null,
      });
      results.error = (results.error || 0) + 1;
      processed++;
    }
  }

  console.log(JSON.stringify({ ok: true, fetched: items.length, processed, results }, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e?.stack || e?.message || String(e));
  process.exit(1);
});
