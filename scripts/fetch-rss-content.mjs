import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");

// чтобы база не раздувалась
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
  // 2026-03-01T18:54:00+03:00
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?$/.test(line);
}

function stripUrlsInsideLine(line) {
  // убираем URL внутри строки (часто "https://... Заголовок ...")
  return line.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
}

function letterRatioLow(line) {
  // если букв почти нет — часто это мусор/служебное
  const l = line || "";
  const letters = (l.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  const digits = (l.match(/[0-9]/g) || []).length;
  const other = l.length - letters - digits;
  const effective = Math.max(1, letters + digits + other);
  return letters / effective < 0.25 && l.length > 30;
}

function normalizeRia(text, url) {
  let lines = (text || "")
    .split(/\r?\n/)
    .map(collapseSpacesLine)
    .filter(Boolean);

  // 1) выпиливаем явные служебные строки
  const riaUpdated = /^$обновлено:\s*\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}$$/i;
  const riaTimePrefix = /^\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}/; // "19:07 01.03.2026 ..."
  const riaBrand = /- РИА Новости/i;

  lines = lines.filter((l) => {
    if (riaUpdated.test(l)) return false;
    if (looksLikeIsoDateLine(l)) return false;
    if (riaTimePrefix.test(l)) return false;
    if (/^Коллаж\b/i.test(l)) return false;
    if (/РИА Новости,\s*\d+/i.test(l)) return false; // "РИА Новости, 1920, ..."
    if (riaBrand.test(l)) return false;
    return true;
  });

  // 2) убрать URL внутри строк
  lines = lines
    .map(stripUrlsInsideLine)
    .map(collapseSpacesLine)
    .filter(Boolean);

  // 3) убрать дубли заголовка (часто 2 раза подряд)
  if (lines.length >= 2 && lines[0] === lines[1]) {
    lines.splice(1, 1);
  }

  // 4) убрать строку, равную URL статьи (если вдруг осталась)
  if (url) {
    const u = url.trim();
    lines = lines.filter((l) => l !== u);
  }

  // 5) выкинуть блок тегов в начале:
  // подряд идут короткие строки (1-4 слова) без точек/знаков конца предложения
  // пример: "в мире", "израиль", "египет", ...
  const isTagLine = (l) => {
    if (l.length > 40) return false;
    if (/[.!?…"»)]$/.test(l)) return false;
    const words = l.split(" ").filter(Boolean);
    if (words.length < 1 || words.length > 4) return false;
    // если есть глаголы/сложные конструкции — не тег
    return true;
  };

  // ищем “пучок” тегов в первых 30 строках
  let tagStart = -1;
  let tagEnd = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    if (isTagLine(lines[i])) {
      if (tagStart === -1) tagStart = i;
      tagEnd = i;
    } else if (tagStart !== -1) {
      break;
    }
  }
  // удаляем только если тегов было хотя бы 3 подряд
  if (tagStart !== -1 && tagEnd - tagStart + 1 >= 3) {
    lines.splice(tagStart, tagEnd - tagStart + 1);
  }

  // 6) финальная фильтрация мусорных строк
  lines = lines.filter((l) => !letterRatioLow(l));

  // 7) собрать обратно
  let out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return out;
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

  let out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

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
  const { error: saveErr } = await supabase.rpc("set_news_item_content", {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500)
  });
  if (saveErr) throw saveErr;
}

async function main() {
  const limit = Math.min(Math.max(BATCH_LIMIT, 1), 500);

  const { data: items, error } = await supabase.rpc(
    "fetch_next_news_items_for_content",
    { p_limit: limit }
  );
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

      let content_text =
        source_id === "ria"
          ? normalizeRia(content_text_raw, url)
          : normalizeGeneric(content_text_raw, url);

      content_text = clampText(content_text, MAX_TEXT_LEN);

      if (!content_text || content_text.length < MIN_TEXT_LEN) {
        await setStatus(id, "error", "", "", "Extracted content too short/empty");
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
  console.error(e);
  process.exit(1);
});
