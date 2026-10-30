import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Compass,
  Lightbulb,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Layers,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Sparkles,
  BookMarked,
  ArrowRight,
  Award,
} from 'lucide-react';

/**
 * Parses raw lesson markdown into clean, structured pages.
 * Splits on horizontal dividers (---) or major section breaks.
 */
const parseContentIntoPages = (rawContent) => {
  if (!rawContent || !rawContent.trim()) {
    return [{ id: 1, pageNumber: 1, title: 'Overview', readingTime: 1, content: '' }];
  }

  // Split by markdown horizontal rules: \n---\n or \n---\r?\n
  const rawPages = rawContent.split(/\n\s*---+\s*\n/);
  const cleanPages = rawPages.map((p) => p.trim()).filter(Boolean);

  if (cleanPages.length === 0) {
    return [{ id: 1, pageNumber: 1, title: 'Lesson Material', readingTime: 1, content: rawContent }];
  }

  return cleanPages.map((pageText, index) => {
    // Find the first heading to use as the page title
    const lines = pageText.split('\n');
    let title = `Page ${index + 1}`;
    for (const line of lines) {
      const match = line.trim().match(/^#{1,3}\s+(.*)$/);
      if (match) {
        // Strip emojis and markdown bolding from title for a clean tab label
        title = match[1]
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .replace(/\*\*/g, '')
          .trim();
        break;
      }
    }

    const wordCount = pageText.split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 160));

    return {
      id: index + 1,
      pageNumber: index + 1,
      title: title || `Part ${index + 1}`,
      readingTime,
      content: pageText,
    };
  });
};

/**
 * Robust Markdown & Course Content Renderer with Page Structure.
 * Features:
 * - Interactive Page Stepper / Tab Bar (Page 1, 2, 3...)
 * - Markdown Table Parsing to Responsive HTML Tables
 * - Alert & Callout Box Parsing (Note, Tip, Warning, Security)
 * - Visual Architecture Roadmap & Code Blocks with Copy
 * - Page-by-page Navigation Controls (Previous, Next, Complete)
 */
const LessonContentRenderer = ({
  content = '',
  lessonTitle = '',
  isCompleted = false,
  onToggleComplete = null,
  onNextLesson = null,
  nextLessonTitle = '',
  quizId = null,
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('paged'); // 'paged' or 'continuous'
  const [visitedPages, setVisitedPages] = useState(new Set([0]));

  // Reset to first page whenever the lesson content changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setVisitedPages(new Set([0]));
  }, [content]);

  // Track visited pages
  useEffect(() => {
    setVisitedPages((prev) => new Set([...prev, currentPageIndex]));
  }, [currentPageIndex]);

  if (!content) {
    return <p style={{ color: 'var(--text-muted)' }}>No lesson content available.</p>;
  }

  const pages = parseContentIntoPages(content);
  const activePage = pages[currentPageIndex] || pages[0];

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePageChange = (index) => {
    setCurrentPageIndex(index);
    // Smooth scroll to top of lesson content
    const el = document.getElementById('lesson-page-viewport');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to render inline markdown (bold, code, links)
  const renderInline = (text) => {
    if (!text) return null;
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for link [text](url)
      const linkMatch = remaining.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--primary)',
              textDecoration: 'underline',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            {linkMatch[1]}
            <ExternalLink size={12} />
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Check for **bold**
      const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for `inline code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            style={{
              background: '#f1f5f9',
              color: '#0f172a',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              fontSize: '0.875em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
            }}
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Plain character
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return parts;
  };

  const groupLinesIntoElements = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentGroup = [];
    let groupType = null; // 'heading', 'table', 'quote', 'list', 'p'

    const flush = () => {
      if (currentGroup.length > 0) {
        elements.push({ type: groupType, text: currentGroup.join('\n').trim() });
        currentGroup = [];
        groupType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flush();
        continue;
      }

      if (trimmed.startsWith('#')) {
        flush();
        elements.push({ type: 'heading', text: trimmed });
        continue;
      }

      if (trimmed.startsWith('|')) {
        if (groupType !== 'table') {
          flush();
          groupType = 'table';
        }
        currentGroup.push(trimmed);
        continue;
      }

      if (trimmed.startsWith('>')) {
        if (groupType !== 'quote') {
          flush();
          groupType = 'quote';
        }
        currentGroup.push(line);
        continue;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s+/.test(trimmed)) {
        if (groupType !== 'list') {
          flush();
          groupType = 'list';
        }
        currentGroup.push(line);
        continue;
      }

      // Normal paragraph line
      if (groupType !== 'p') {
        flush();
        groupType = 'p';
      }
      currentGroup.push(line);
    }

    flush();
    return elements;
  };

  /**
   * Helper to parse a page's markdown text into blocks:
   * - code blocks
   * - markdown tables
   * - alert callouts (> [!NOTE], etc.)
   * - headings (h1, h2, h3, h4)
   * - bullet/numbered lists
   * - standard paragraphs
   */
  const renderPageBlocks = (pageMarkdown, pageOffsetKey = 0) => {
    const lines = pageMarkdown.split('\n');
    const rawBlocks = [];
    let currentBlock = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          rawBlocks.push({
            type: 'code',
            language: codeLanguage,
            content: currentBlock.join('\n'),
          });
          currentBlock = [];
          inCodeBlock = false;
          codeLanguage = '';
        } else {
          if (currentBlock.length > 0) {
            rawBlocks.push({ type: 'text', content: currentBlock.join('\n') });
            currentBlock = [];
          }
          inCodeBlock = true;
          codeLanguage = line.trim().replace('```', '') || 'plaintext';
        }
        continue;
      }

      currentBlock.push(line);
    }

    if (currentBlock.length > 0) {
      rawBlocks.push({
        type: inCodeBlock ? 'code' : 'text',
        language: codeLanguage,
        content: currentBlock.join('\n'),
      });
    }

    // Now render each raw block
    return rawBlocks.map((block, bIdx) => {
      const uniqueBlockKey = `${pageOffsetKey}-${bIdx}`;

      // 1. Code / ASCII Diagram block
      if (block.type === 'code') {
        const isAsciiDiagram =
          block.language === 'roadmap' ||
          block.language === 'diagram' ||
          block.content.includes('──>') ||
          block.content.includes('┌─') ||
          block.content.includes('[1.') ||
          block.content.includes('│');

        return (
          <div
            key={uniqueBlockKey}
            style={{
              position: 'relative',
              margin: '1.75rem 0',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: isAsciiDiagram ? '#090d16' : '#0f172a',
              border: isAsciiDiagram ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #1e293b',
              boxShadow: isAsciiDiagram
                ? '0 10px 25px -5px rgba(14, 165, 233, 0.2)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Code header bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.55rem 1rem',
                background: isAsciiDiagram ? 'rgba(14, 165, 233, 0.12)' : '#1e293b',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.75rem',
                color: isAsciiDiagram ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isAsciiDiagram ? <Compass size={15} color="#38bdf8" /> : <Layers size={15} color="#94a3b8" />}
                {isAsciiDiagram ? '🗺️ Visual Engineering Blueprint' : `${block.language} Snippet`}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(block.content, uniqueBlockKey)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                }}
                title="Copy Code"
              >
                {copiedIndex === uniqueBlockKey ? (
                  <>
                    <Check size={14} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code / ASCII body */}
            <pre
              style={{
                margin: 0,
                padding: '1.25rem',
                overflowX: 'auto',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.875rem',
                lineHeight: 1.65,
                color: isAsciiDiagram ? '#7dd3fc' : '#e2e8f0',
                whiteSpace: 'pre',
              }}
            >
              <code>{block.content}</code>
            </pre>
          </div>
        );
      }

      // 2. Parse text blocks using line-grouping
      const elements = groupLinesIntoElements(block.content);

      return (
        <React.Fragment key={uniqueBlockKey}>
          {elements.map((elem, elemIdx) => {
            const itemKey = `${uniqueBlockKey}-${elemIdx}`;

            // Check for Markdown Table
            if (elem.type === 'table') {
              const tableLines = elem.text.split('\n').map((l) => l.trim());
              if (tableLines.length >= 2 && tableLines[0].startsWith('|') && tableLines[1].includes('-')) {
                const headers = tableLines[0].split('|').slice(1, -1).map((c) => c.trim());
                const alignments = tableLines[1]
                  .split('|')
                  .slice(1, -1)
                  .map((c) => {
                    const col = c.trim();
                    if (col.startsWith(':') && col.endsWith(':')) return 'center';
                    if (col.endsWith(':')) return 'right';
                    return 'left';
                  });
                const rows = tableLines
                  .slice(2)
                  .filter((l) => l.startsWith('|'))
                  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));

                return (
                  <div key={itemKey} className="lesson-table-wrapper">
                    <table className="lesson-table">
                      <thead>
                        <tr>
                          {headers.map((h, hIdx) => (
                            <th key={hIdx} style={{ textAlign: alignments[hIdx] || 'left' }}>
                              {renderInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{ textAlign: alignments[cIdx] || 'left' }}>
                                {renderInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
            }

            // Headings
            if (elem.type === 'heading') {
              const trimmed = elem.text;
              if (trimmed.startsWith('# ')) {
                return (
                  <h1
                    key={itemKey}
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      marginTop: '2rem',
                      marginBottom: '1rem',
                      color: 'var(--text-main)',
                      borderBottom: '2px solid var(--border-color)',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    {renderInline(trimmed.replace(/^#\s+/, ''))}
                  </h1>
                );
              }

              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={itemKey}
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      marginTop: '1.75rem',
                      marginBottom: '0.85rem',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {renderInline(trimmed.replace(/^##\s+/, ''))}
                  </h2>
                );
              }

              if (trimmed.startsWith('### ')) {
                const headingText = trimmed.replace(/^###\s+/, '');
                const isDocsHeading =
                  headingText.toLowerCase().includes('documentation') ||
                  headingText.toLowerCase().includes('reference');
                const isRoadmapHeading =
                  headingText.toLowerCase().includes('roadmap') ||
                  headingText.toLowerCase().includes('pathway') ||
                  headingText.toLowerCase().includes('milestone');

                return (
                  <h3
                    key={itemKey}
                    style={{
                      fontSize: '1.18rem',
                      fontWeight: 700,
                      marginTop: '1.5rem',
                      marginBottom: '0.75rem',
                      color: isDocsHeading ? 'var(--primary)' : isRoadmapHeading ? '#0284c7' : 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isDocsHeading && <BookOpen size={18} color="var(--primary)" />}
                    {isRoadmapHeading && <Compass size={18} color="#0284c7" />}
                    {renderInline(headingText)}
                  </h3>
                );
              }

              if (trimmed.startsWith('#### ')) {
                return (
                  <h4
                    key={itemKey}
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      marginTop: '1.25rem',
                      marginBottom: '0.5rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    {renderInline(trimmed.replace(/^####\s+/, ''))}
                  </h4>
                );
              }
            }

            // Blockquotes / Callout Alerts with structured badge styling
            if (elem.type === 'quote') {
              const quoteLines = elem.text.split('\n').map((l) => l.replace(/^>\s?/, ''));
              let cleanQuote = quoteLines.join('\n').trim();

              let alertType = 'note';
              let alertTitle = 'Academic Specification Note';
              let alertIcon = <Info size={18} color="var(--primary)" />;
              let borderColor = 'var(--primary)';
              let bgColor = '#eff6ff';
              let badgeBg = '#dbeafe';
              let badgeColor = '#1d4ed8';

              if (cleanQuote.startsWith('[!NOTE]') || cleanQuote.startsWith('[!INFO]')) {
                alertType = 'note';
                alertTitle = 'Academic Specification Note';
                alertIcon = <Info size={18} color="var(--primary)" />;
                borderColor = 'var(--primary)';
                bgColor = '#eff6ff';
                badgeBg = '#dbeafe';
                badgeColor = '#1d4ed8';
                cleanQuote = cleanQuote.replace(/^\[!(NOTE|INFO)\]\s*/i, '');
              } else if (
                cleanQuote.startsWith('[!TIP]') ||
                /^[💡\s]*\**tip\**/i.test(cleanQuote) ||
                cleanQuote.toLowerCase().includes('tip:') ||
                cleanQuote.toLowerCase().includes('engineering tip')
              ) {
                alertType = 'tip';
                alertTitle = 'Pro Engineering Tip';
                alertIcon = <Lightbulb size={18} color="#059669" />;
                borderColor = '#10b981';
                bgColor = '#f0fdf4';
                badgeBg = '#dcfce7';
                badgeColor = '#15803d';
                cleanQuote = cleanQuote
                  .replace(/^\[!TIP\]\s*/i, '')
                  .replace(/^[💡\s]*\*\*(?:Engineering\s+)?Tip\*\*:\s*/i, '');
              } else if (
                cleanQuote.startsWith('[!WARNING]') ||
                cleanQuote.startsWith('[!CAUTION]') ||
                /^[⚠️\s]*\**warning\**/i.test(cleanQuote) ||
                cleanQuote.toLowerCase().includes('pitfall')
              ) {
                alertType = 'warning';
                alertTitle = 'Architectural Pitfall & Warning';
                alertIcon = <AlertTriangle size={18} color="#d97706" />;
                borderColor = '#f59e0b';
                bgColor = '#fffbeb';
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
                cleanQuote = cleanQuote
                  .replace(/^\[!(WARNING|CAUTION)\]\s*/i, '')
                  .replace(/^[⚠️\s]*\*\*(?:Common\s+)?Pitfall\*\*:\s*/i, '');
              } else if (cleanQuote.startsWith('[!IMPORTANT]') || cleanQuote.toLowerCase().includes('security')) {
                alertType = 'security';
                alertTitle = 'Critical Requirement & Best Practice';
                alertIcon = <ShieldCheck size={18} color="#7c3aed" />;
                borderColor = '#8b5cf6';
                bgColor = '#f5f3ff';
                badgeBg = '#ede9fe';
                badgeColor = '#6d28d9';
                cleanQuote = cleanQuote.replace(/^\[!IMPORTANT\]\s*/i, '');
              }

              return (
                <div
                  key={itemKey}
                  className={`lesson-callout lesson-callout-${alertType}`}
                  style={{
                    background: bgColor,
                    borderLeft: `4px solid ${borderColor}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    {alertIcon}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: badgeColor,
                        background: badgeBg,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {alertTitle}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.925rem', lineHeight: 1.65, color: '#1e293b' }}>
                    {renderInline(cleanQuote)}
                  </div>
                </div>
              );
            }

            // Bullet points and lists
            if (elem.type === 'list') {
              const lineList = elem.text.split('\n');
              const isNumbered = lineList.every((l) => /^\d+\.\s+/.test(l.trim()));

              if (isNumbered) {
                return (
                  <ol key={itemKey} style={{ margin: '1rem 0 1.25rem 1.5rem', paddingLeft: '0.5rem' }}>
                    {lineList.map((li, lIdx) => (
                      <li key={lIdx} style={{ marginBottom: '0.45rem', lineHeight: 1.65 }}>
                        {renderInline(li.trim().replace(/^\d+\.\s+/, ''))}
                      </li>
                    ))}
                  </ol>
                );
              }

              return (
                <ul key={itemKey} style={{ margin: '1rem 0 1.25rem 1.5rem', paddingLeft: '0.5rem' }}>
                  {lineList.map((li, lIdx) => (
                    <li key={lIdx} style={{ marginBottom: '0.45rem', lineHeight: 1.65 }}>
                      {renderInline(li.trim().replace(/^[-*]\s+/, ''))}
                    </li>
                  ))}
                </ul>
              );
            }

            // Standard Paragraph
            return (
              <p key={itemKey} style={{ marginBottom: '1.25rem', lineHeight: 1.75, color: 'var(--text-main)' }}>
                {renderInline(elem.text)}
              </p>
            );
          })}
        </React.Fragment>
      );
    });
  };

  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === pages.length - 1;
  const progressPercent = Math.round(((currentPageIndex + 1) / pages.length) * 100);

  return (
    <div id="lesson-page-viewport" className="lesson-content-body" style={{ color: 'var(--text-main)' }}>
      {/* Top Page Header Bar & Stepper */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.75rem',
        }}
      >
        {/* Upper bar: Page count, progress text, and View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <BookMarked size={13} /> {pages.length} Structured {pages.length === 1 ? 'Page' : 'Pages'}
            </span>

            {viewMode === 'paged' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Page <strong>{currentPageIndex + 1}</strong> of <strong>{pages.length}</strong> (
                {progressPercent}% completed)
              </span>
            )}
          </div>

          {/* Toggle between Paged Mode and Continuous Mode */}
          <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('paged')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '4px',
                background: viewMode === 'paged' ? '#ffffff' : 'transparent',
                color: viewMode === 'paged' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'paged' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              📑 Paginated View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '4px',
                background: viewMode === 'continuous' ? '#ffffff' : 'transparent',
                color: viewMode === 'continuous' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'continuous' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              📜 Full Document
            </button>
          </div>
        </div>

        {/* Interactive Page Tabs Stepper (Only shown in Paged View) */}
        {viewMode === 'paged' && pages.length > 1 && (
          <div className="lesson-page-stepper">
            {pages.map((p, pIdx) => {
              const isActive = pIdx === currentPageIndex;
              const isVisited = visitedPages.has(pIdx);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePageChange(pIdx)}
                  className={`lesson-page-tab ${isActive ? 'active' : ''}`}
                >
                  <span className="lesson-page-tab-badge">
                    {isVisited && !isActive ? '✓' : `0${pIdx + 1}`}
                  </span>
                  <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thin Page Progress Bar */}
        {viewMode === 'paged' && pages.length > 1 && (
          <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* Render Main Content: Either Single Active Page (Paged View) or All Pages (Continuous View) */}
      {viewMode === 'paged' ? (
        <div className="lesson-page-card">
          {/* Page Top Title Card */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem',
                }}
              >
                Page {activePage.pageNumber} of {pages.length} • ~{activePage.readingTime} min read
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {activePage.title}
              </h3>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: '#ffffff',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={13} color="var(--primary)" /> Section {activePage.pageNumber}
            </div>
          </div>

          {/* Active Page Content Body */}
          <div style={{ lineHeight: 1.8, fontSize: '1rem' }}>
            {renderPageBlocks(activePage.content, currentPageIndex)}
          </div>

          {/* Bottom Page Navigation Controls */}
          {pages.length > 1 && (
            <div className="lesson-page-footer">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPageIndex - 1)}
                disabled={isFirstPage}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: isFirstPage ? 0.4 : 1,
                  cursor: isFirstPage ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} /> Previous Page
              </button>

              {/* Page Dots Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {pages.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => handlePageChange(dotIdx)}
                    style={{
                      width: dotIdx === currentPageIndex ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: dotIdx === currentPageIndex ? 'var(--primary)' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                    title={`Go to page ${dotIdx + 1}`}
                  />
                ))}
              </div>

              {/* Next Page Button */}
              {!isLastPage ? (
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPageIndex + 1)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Next Page <ChevronRight size={16} />
                </button>
              ) : (
                /* Last Page Finish Banner */
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {onToggleComplete && (
                    <button
                      type="button"
                      onClick={onToggleComplete}
                      className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <CheckCircle2 size={16} color={isCompleted ? '#10b981' : '#ffffff'} />
                      {isCompleted ? 'Completed' : 'Mark Completed'}
                    </button>
                  )}
                  {onNextLesson && (
                    <button
                      type="button"
                      onClick={onNextLesson}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      Next Lesson <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Continuous View: All Pages Stacked with Clean Section Banners */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {pages.map((p, pIdx) => (
            <div
              key={p.id}
              style={{
                borderBottom: pIdx < pages.length - 1 ? '2px dashed var(--border-color)' : 'none',
                paddingBottom: '2.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  padding: '0.5rem 0.85rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  width: 'fit-content',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Page {p.pageNumber} of {pages.length}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{p.title}</strong>
              </div>

              <div style={{ lineHeight: 1.8, fontSize: '1rem' }}>
                {renderPageBlocks(p.content, pIdx)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonContentRenderer;
