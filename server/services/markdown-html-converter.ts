import { marked } from 'marked';

interface ConversionOptions {
  enableTables: boolean;
  enableToc: boolean;
  enableLegalFormatting: boolean;
}

export class MarkdownHtmlConverter {
  private tocItems: Array<{ level: number; text: string; anchor: string }> = [];

  constructor(private options: ConversionOptions = {
    enableTables: true,
    enableToc: true,
    enableLegalFormatting: true
  }) {
    this.setupMarked();
  }

  private setupMarked() {
    // Configuration de base de marked
    marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: true,
      headerPrefix: 'heading-'
    });
  }

  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private getLegalHeadingClass(text: string, level: number): string {
    const baseClass = `legal-heading level-${level}`;
    
    if (text.match(/^(TITRE|CHAPITRE|SECTION)/i)) {
      return `${baseClass} legal-title`;
    }
    if (text.match(/^Art(icle)?/i)) {
      return `${baseClass} legal-article-title`;
    }
    
    return baseClass;
  }

  private generateToc(): string {
    if (!this.options.enableToc || this.tocItems.length === 0) {
      return '';
    }

    let tocHtml = '<div class="table-of-contents"><h3>Sommaire</h3><ul class="toc-list">';
    
    for (const item of this.tocItems) {
      const indent = 'toc-level-' + item.level;
      tocHtml += `<li class="${indent}"><a href="#${item.anchor}">${item.text}</a></li>`;
    }
    
    tocHtml += '</ul></div>';
    return tocHtml;
  }

  public convertToHtml(markdown: string): { html: string; toc: string; stats: any } {
    // Reset TOC for new conversion
    this.tocItems = [];
    
    // Améliorer la typographie française avant conversion
    const enhancedMarkdown = this.enhanceFrenchTypography(markdown);
    
    // Convert markdown to HTML (marked can return Promise<string> or string)
    const rawHtml = marked(enhancedMarkdown) as string;
    
    // Process HTML for legal formatting
    const html = this.enhanceHtmlForLegalContent(rawHtml);
    
    // Extract headings for TOC
    this.extractHeadingsForToc(html);
    
    // Generate TOC
    const toc = this.generateToc();
    
    // Generate statistics
    const stats = {
      characters: markdown.length,
      words: markdown.split(/\s+/).length,
      headings: this.tocItems.length,
      tables: (html.match(/<table/g) || []).length,
      lists: (html.match(/<[ou]l/g) || []).length
    };

    return { html, toc, stats };
  }

  private enhanceFrenchTypography(markdown: string): string {
    return markdown
      // Remplacer les tirets simples en début de ligne par des tirets cadratins
      .replace(/^- /gm, '— ')
      .replace(/\n- /g, '\n— ')
      
      // Améliorer les espaces avant les signes de ponctuation doubles
      .replace(/\s*:\s*/g, ' : ')
      .replace(/\s*;\s*/g, ' ; ')
      .replace(/\s*\?\s*/g, ' ? ')
      .replace(/\s*!\s*/g, ' ! ')
      
      // Guillemets français (attention à ne pas casser le markdown)
      .replace(/"([^"]+)"/g, '« $1 »')
      
      // Améliorer les listes numérotées
      .replace(/^(\d+)\./gm, '$1. ')
      
      // Espaces insécables pour les unités
      .replace(/(\d+)\s*(€|%|euros?|ans?|mois|jours?|heures?)/gi, '$1 $2')
      
      // Tirets d'incise (entre espaces)
      .replace(/\s-\s/g, ' — ');
  }

  private enhanceHtmlForLegalContent(html: string): string {
    if (!this.options.enableLegalFormatting) {
      return html;
    }

    // Add CSS classes to paragraphs based on content
    let enhancedHtml = html;
    
    // Legal articles
    enhancedHtml = enhancedHtml.replace(
      /<p>((Art(icle)?\s*\d+|Article\s*\d+).+?)<\/p>/gi,
      '<p class="legal-article">$1</p>'
    );
    
    // Legal paragraphs
    enhancedHtml = enhancedHtml.replace(
      /<p>(§\s*\d+.+?)<\/p>/gi,
      '<p class="legal-paragraph">$1</p>'
    );
    
    // Legal subsections
    enhancedHtml = enhancedHtml.replace(
      /<p>(\d+°\s*.+?)<\/p>/gi,
      '<p class="legal-subsection">$1</p>'
    );
    
    // Add classes to regular paragraphs
    enhancedHtml = enhancedHtml.replace(
      /<p>(?!class=)/gi,
      '<p class="legal-text">'
    );
    
    // Add classes to tables
    if (this.options.enableTables) {
      enhancedHtml = enhancedHtml.replace(
        /<table>/gi,
        '<div class="table-container"><table class="legal-table">'
      );
      enhancedHtml = enhancedHtml.replace(
        /<\/table>/gi,
        '</table></div>'
      );
    }
    
    // Add classes to lists
    enhancedHtml = enhancedHtml.replace(
      /<ol>/gi,
      '<ol class="legal-ordered-list">'
    );
    enhancedHtml = enhancedHtml.replace(
      /<ul>/gi,
      '<ul class="legal-unordered-list">'
    );
    
    // Add classes to blockquotes
    enhancedHtml = enhancedHtml.replace(
      /<blockquote>/gi,
      '<blockquote class="legal-quote">'
    );
    
    // Add classes to headings
    enhancedHtml = enhancedHtml.replace(
      /<h([1-6])([^>]*)>/gi,
      (match, level, attrs) => {
        const classes = this.getLegalHeadingClass('', parseInt(level));
        return `<h${level}${attrs} class="${classes}">`;
      }
    );
    
    return enhancedHtml;
  }

  private extractHeadingsForToc(html: string): void {
    if (!this.options.enableToc) return;
    
    const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const id = match[2];
      const text = match[3];
      
      if (level <= 3) {
        this.tocItems.push({ level, text, anchor: id });
      }
    }
  }

  public getEnhancedCss(): string {
    return `
      /* Legal Document Styling */
      .legal-document {
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 1.6;
        color: #2c3e50;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 1rem;
        box-sizing: border-box;
      }

      /* Headings */
      .legal-heading {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-weight: 600;
        color: #1a365d;
      }

      .legal-heading.level-1 {
        font-size: 2rem;
        border-bottom: 3px solid #3182ce;
        padding-bottom: 0.5rem;
      }

      .legal-heading.level-2 {
        font-size: 1.5rem;
        color: #2c5282;
      }

      .legal-heading.level-3 {
        font-size: 1.25rem;
        color: #2a69ac;
      }

      .legal-title {
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #1a202c !important;
      }

      .legal-article-title {
        font-weight: 700;
        color: #c53030 !important;
      }

      /* Text Content */
      .legal-text {
        margin-bottom: 1rem;
        text-align: justify;
      }

      .legal-article {
        background-color: #f7fafc;
        border-left: 4px solid #3182ce;
        padding: 1rem;
        margin: 1rem 0;
        font-weight: 500;
      }

      .legal-paragraph {
        padding-left: 1rem;
        border-left: 2px solid #e2e8f0;
        margin: 0.5rem 0;
      }

      .legal-subsection {
        padding-left: 2rem;
        color: #4a5568;
        font-style: italic;
      }

      /* Tables */
      .table-container {
        overflow-x: auto;
        margin: 1.5rem 0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .legal-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }

      .legal-table th {
        background-color: #2d3748;
        color: white;
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #4a5568;
      }

      .legal-table td {
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
      }

      .legal-table tbody tr:nth-child(even) {
        background-color: #f8f9fa;
      }

      .legal-table tbody tr:hover {
        background-color: #e6fffa;
      }

      /* Lists */
      /* Listes avec typographie française améliorée */
      .legal-ordered-list {
        margin: 1rem 0;
        padding-left: 0;
        counter-reset: list-counter;
        list-style: none;
      }

      .legal-ordered-list li {
        counter-increment: list-counter;
        position: relative;
        margin-bottom: 0.5rem;
        padding-left: 2rem;
        line-height: 1.6;
      }

      .legal-ordered-list li::before {
        content: counter(list-counter) ".";
        position: absolute;
        left: 0;
        color: #3182ce;
        font-weight: bold;
        width: 1.5rem;
        text-align: left;
      }

      .legal-unordered-list {
        margin: 1rem 0;
        padding-left: 0;
        list-style: none;
      }

      .legal-unordered-list li {
        position: relative;
        margin-bottom: 0.5rem;
        padding-left: 2rem;
        line-height: 1.6;
      }

      .legal-unordered-list li::before {
        content: "—";
        position: absolute;
        left: 0;
        color: #3182ce;
        font-weight: bold;
        width: 1.5rem;
      }

      /* Typographie française améliorée */
      .legal-text {
        margin-bottom: 1rem;
        text-align: justify;
      }

      .legal-text::before {
        content: "";
      }

      /* Améliorer les tirets dans le texte */
      .legal-text,
      .legal-paragraph,
      .legal-article {
        text-rendering: optimizeLegibility;
        font-feature-settings: "kern" 1, "liga" 1;
      }

      /* Quotes */
      .legal-quote {
        border-left: 4px solid #e53e3e;
        background-color: #fed7d7;
        padding: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #744210;
      }

      /* Table of Contents */
      .table-of-contents {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .table-of-contents h3 {
        margin-top: 0;
        color: #0c4a6e;
        font-size: 1.25rem;
      }

      .toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .toc-list li {
        margin: 0.25rem 0;
      }

      .toc-list a {
        color: #0369a1;
        text-decoration: none;
        display: block;
        padding: 0.25rem 0;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .toc-list a:hover {
        background-color: #dbeafe;
        padding-left: 0.5rem;
      }

      .toc-level-1 { font-weight: 600; }
      .toc-level-2 { padding-left: 1rem; }
      .toc-level-3 { padding-left: 2rem; font-size: 0.9rem; }

      /* Code blocks */
      .hljs {
        background-color: #f8f9fa !important;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .legal-document {
          padding: 1rem;
        }
        
        .legal-heading.level-1 {
          font-size: 1.5rem;
        }
        
        .table-container {
          font-size: 0.9rem;
        }
      }

      /* Print styles */
      @media print {
        .legal-document {
          font-size: 12pt;
          line-height: 1.4;
        }
        
        .legal-heading {
          page-break-after: avoid;
        }
        
        .legal-table {
          page-break-inside: avoid;
        }
      }
    `;
  }
}

// Service singleton
export const markdownHtmlConverter = new MarkdownHtmlConverter();