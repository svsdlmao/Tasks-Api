import * as fs from 'fs';
import * as path from 'path';

interface LLMOutput {
  response: string;
  modelUsed?: string;
  cached?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlPreservingQuotes(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseInlineMarkdown(text: string): string {
  let out = escapeHtmlPreservingQuotes(text);

  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return out.replace(/ {2,}\n/g, '<br />');
}

function isTableDivider(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
  const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}

function tableAlignment(cell: string): string {
  const trimmed = cell.trim();
  if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
  if (trimmed.endsWith(':')) return 'right';
  if (trimmed.startsWith(':')) return 'left';
  return 'left';
}

function isBulletListItem(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedListItem(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line);
}

function isBlockQuote(line: string): boolean {
  return /^\s*>\s?/.test(line);
}

export function renderMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const html: string[] = [];

  let i = 0;
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];
  let blockQuoteLines: string[] = [];

  const flushParagraph = (): void => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(' ').trim();
    if (text) html.push(`<p>${parseInlineMarkdown(text)}</p>`);
    paragraphLines = [];
  };

  const flushList = (): void => {
    if (!listType || !listItems.length) return;
    const items = listItems.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('');
    html.push(`<${listType}>${items}</${listType}>`);
    listType = null;
    listItems = [];
  };

  const flushBlockQuote = (): void => {
    if (!blockQuoteLines.length) return;
    html.push(`<blockquote><p>${parseInlineMarkdown(blockQuoteLines.join(' '))}</p></blockquote>`);
    blockQuoteLines = [];
  };

  const flushAll = (): void => {
    flushParagraph();
    flushList();
    flushBlockQuote();
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inCodeBlock) {
      if (trimmed.startsWith('```')) {
        const classAttr = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        html.push(`<pre><code${classAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeLanguage = '';
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      i += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      flushAll();
      inCodeBlock = true;
      codeLanguage = trimmed.slice(3).trim();
      i += 1;
      continue;
    }

    if (!trimmed) {
      flushAll();
      i += 1;
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      flushAll();
      const header = splitTableRow(line);
      const divider = splitTableRow(lines[i + 1]);
      const aligns = divider.map(tableAlignment);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }

      const thead =
        '<thead><tr>' +
        header
          .map(
            (cell, idx) =>
              `<th style="text-align:${aligns[idx] || 'left'}">${parseInlineMarkdown(cell)}</th>`
          )
          .join('') +
        '</tr></thead>';

      const tbody =
        '<tbody>' +
        rows
          .map(
            row =>
              '<tr>' +
              row
                .map(
                  (cell, idx) =>
                    `<td style="text-align:${aligns[idx] || 'left'}">${parseInlineMarkdown(cell)}</td>`
                )
                .join('') +
              '</tr>'
          )
          .join('') +
        '</tbody>';

      html.push(`<div class="table-wrapper"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${parseInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (isBlockQuote(line)) {
      flushParagraph();
      flushList();
      blockQuoteLines.push(trimmed.replace(/^>\s?/, ''));
      i += 1;
      continue;
    }
    flushBlockQuote();

    if (isBulletListItem(line)) {
      flushParagraph();
      const item = trimmed.replace(/^[-*+]\s+/, '').replace(/^\[\s\]\s+/, '');
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(item);
      i += 1;
      continue;
    }

    if (isOrderedListItem(line)) {
      flushParagraph();
      const item = trimmed.replace(/^\d+\.\s+/, '');
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(item);
      i += 1;
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
    i += 1;
  }

  if (inCodeBlock) {
    const classAttr = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${classAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  flushAll();

  let finalHtml = html.join('\n');
  finalHtml = buildHtmlDocument('LLM Output', finalHtml);
  finalHtml = finalHtml.replaceAll('<p>---</p>', '<hr />');
  return finalHtml;
}

function buildHtmlDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #ffffff !important;
      --text: #1f2937 !important;
      --muted: #6b7280 !important;
      --border: #d1d5db !important;
      --surface: #f8fafc !important;
      --code: #111827 !important;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b1220 !important;
        --text: #e5e7eb !important;
        --muted: #9ca3af !important;
        --border: #334155 !important;
        --surface: #111827 !important;
        --code: #020617 !important;
      }
    }
    
    /* CSS Reset for isolation */
    html, body, main {
      all: revert !important;
      box-sizing: border-box !important;
    }
    
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      font: inherit !important;
      color: inherit !important;
      background: transparent !important;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      background: var(--bg) !important;
      color: var(--text) !important;
      line-height: 1.7 !important;
    }
    
    main {
      max-width: 900px !important;
      margin: 0 auto !important;
      padding: 40px 20px 64px !important;
      background: var(--bg) !important;
      color: var(--text) !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
      line-height: 1.25 !important;
      margin: 1.6em 0 0.7em !important;
      color: var(--text) !important;
    }
    
    p, ul, ol, blockquote, pre, .table-wrapper {
      margin: 0 0 1rem !important;
      color: var(--text) !important;
    }
    
    ul, ol {
      padding-left: 1.5rem !important;
      margin: 0 0 1rem !important;
    }
    
    li + li {
      margin-top: 0.35rem !important;
    }
    
    a {
      color: #2563eb !important;
      text-decoration: underline !important;
      cursor: pointer !important;
    }
    
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
      background: color-mix(in srgb, var(--surface) 85%, transparent) !important;
      padding: 0.12rem 0.35rem !important;
      border-radius: 6px !important;
      color: var(--text) !important;
    }
    
    pre {
      background: var(--code) !important;
      color: #e5e7eb !important;
      padding: 1rem !important;
      border-radius: 12px !important;
      overflow-x: auto !important;
      margin: 0 0 1rem !important;
    }
    
    pre code {
      background: transparent !important;
      padding: 0 !important;
      color: #e5e7eb !important;
    }
    
    blockquote {
      border-left: 4px solid var(--border) !important;
      padding: 0.1rem 0 0.1rem 1rem !important;
      color: var(--muted) !important;
      margin: 0 0 1rem !important;
    }
    
    .table-wrapper {
      overflow-x: auto !important;
      margin: 0 0 1rem !important;
    }
    
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      min-width: 520px !important;
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    
    th, td {
      border: 1px solid var(--border) !important;
      padding: 0.75rem 0.9rem !important;
      vertical-align: top !important;
      color: var(--text) !important;
    }
    
    th {
      background: color-mix(in srgb, var(--surface) 60%, var(--border)) !important;
      font-weight: 700 !important;
    }
    
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
    }
    
    hr {
      border: none !important;
      border-top: 1px solid var(--border) !important;
      margin: 1.5rem 0 !important;
      height: 0 !important;
    }
  </style>
</head>
<body>
  <main>
    ${bodyHtml}
  </main>
</body>
</html>`;
}

// function main(): void {
//   const inputFile = process.argv[2] || 'rand-2.json';
//   const outputFile = process.argv[3] || 'llm-output-fixed.html';
//   const inputPath = path.resolve(process.cwd(), inputFile);
//   const outputPath = path.resolve(process.cwd(), outputFile);

//   const raw = fs.readFileSync(inputPath, 'utf8');
//   const data = JSON.parse(raw) as LLMOutput;

//   if (!data.response || typeof data.response !== 'string') {
//     throw new Error('Input JSON must contain a string "response" field.');
//   }

//   const bodyHtml = renderMarkdown(data.response);
//   const title = data.modelUsed ? `LLM Output - ${data.modelUsed}` : 'LLM Output';
//   const finalHtml = buildHtmlDocument(title, bodyHtml);

//   fs.writeFileSync(outputPath, finalHtml, 'utf8');
//   console.log(`HTML generated: ${outputPath}`);
// }

// main();