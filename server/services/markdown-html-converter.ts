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
    
    // Convert markdown to HTML (marked can return Promise<string> or string)
    const rawHtml = marked(markdown) as string;
    
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

  private enhanceHtmlForLegalContent(html: string): string {
    if (!this.options.enableLegalFormatting) {
      return html;
    }

    // Add CSS classes to paragraphs based on content
    let enhancedHtml = html;
    
    // Fix markdown formatting that wasn't properly converted
    // Convert markdown bold and italic formatting
    enhancedHtml = enhancedHtml.replace(/\*\*([^*]+)\*\*/g, '<strong class="legal-bold">$1</strong>');
    enhancedHtml = enhancedHtml.replace(/\*([^*\s][^*]*[^*\s])\*/g, '<em class="legal-italic">$1</em>');
    
    // Clean up any remaining standalone asterisks (but be careful not to remove valid ones)
    enhancedHtml = enhancedHtml.replace(/\*\*\s*:\s*\*\*/g, '');
    enhancedHtml = enhancedHtml.replace(/^\*\*\s*$/gm, '');
    enhancedHtml = enhancedHtml.replace(/\*\*([^*]*?)\*\*/g, '<strong class="legal-bold">$1</strong>');
    
    // Format salary grids (grilles de rémunération) with proper line breaks and ordering
    enhancedHtml = this.formatSalaryGridReferences(enhancedHtml);
    
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
    
    // Add classes to headings and filter out redundant titles
    enhancedHtml = enhancedHtml.replace(
      /<h([1-6])([^>]*?)>(.*?)<\/h[1-6]>/gi,
      (match, level, attrs, content) => {
        // Hide H1 titles that are redundant with section names
        if (parseInt(level) === 1) {
          const normalizedContent = content.toLowerCase().trim();
          
          // Suppress ALL titles that contain "Convention Collective" or "IDCC" 
          // as they are redundant with interface elements
          if (normalizedContent.includes('convention collective') || 
              normalizedContent.includes('idcc')) {
            return ''; // Hide all convention collective titles
          }
          
          // Also hide titles that exactly match section names
          if (normalizedContent.includes('informations générales') ||
              normalizedContent.includes('délai de prévenance') ||
              normalizedContent.includes('période d\'essai') ||
              normalizedContent.includes('durées du travail') ||
              normalizedContent.includes('durée du travail') ||
              normalizedContent.includes('temps partiel') ||
              normalizedContent.includes('classification') ||
              normalizedContent.includes('grille de rémunération') ||
              normalizedContent.includes('rémunération') ||
              normalizedContent.includes('congés payés') ||
              normalizedContent.includes('congés') ||
              normalizedContent.includes('protection sociale')) {
            return ''; // Hide section name titles
          }
        }
        
        const classes = this.getLegalHeadingClass(content, parseInt(level));
        return `<h${level}${attrs} class="${classes}">${content}</h${level}>`;
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

  private formatSalaryGridReferences(html: string): string {
    // Pattern to match salary grid references like "(9) Référence : Avenant n°132..."
    // More flexible pattern to capture the full reference text until the next reference or end
    const referencePattern = /\((\d+)\)\s*Référence\s*:\s*([^(]*?)(?=\s*\(\d+\)\s*Référence|$)/g;
    
    // Find all paragraphs that contain multiple salary references
    const paragraphPattern = /<p([^>]*)>(.*?)<\/p>/gs;
    
    return html.replace(paragraphPattern, (match, attributes, content) => {
      // Check if this paragraph contains multiple salary references
      const referenceMatches = [...content.matchAll(referencePattern)];
      
      if (referenceMatches.length > 1) {
        // Extract and sort references
        const references = referenceMatches.map((match) => {
          const number = parseInt(match[1]);
          const referenceText = match[2].trim();
          return { number, text: referenceText };
        });
        
        // Sort by reference number
        references.sort((a, b) => a.number - b.number);
        
        // Create formatted reference list
        const formattedReferences = references.map((ref) => {
          return `<div class="salary-reference">
            <span class="reference-number">(${ref.number})</span>
            <span class="reference-text">Référence : ${ref.text}</span>
          </div>`;
        }).join('');
        
        // Look for any remaining text that's not part of references
        let remainingText = content;
        references.forEach((ref) => {
          const fullRefPattern = new RegExp(`\\(${ref.number}\\)\\s*Référence\\s*:\\s*${ref.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          remainingText = remainingText.replace(fullRefPattern, '');
        });
        remainingText = remainingText.trim();
        
        return `<div class="salary-grid-container"${attributes}>
          <div class="salary-references">
            ${formattedReferences}
          </div>
          ${remainingText ? `<div class="additional-info">${remainingText}</div>` : ''}
        </div>`;
      }
      
      return match; // Return unchanged if no multiple references found
    });
  }

  public getEnhancedCss(): string {
    return `
      /* Legal Document Styling */
      .legal-document {
        font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.7;
        color: #374151;
        max-width: 1000px;
        margin: 0 auto;
        padding: 1.5rem;
        font-size: 14px;
        background-color: #fefefe;
      }

      /* Headings */
      .legal-heading {
        margin-top: 2.5rem;
        margin-bottom: 1.2rem;
        font-weight: 600;
        color: #059669;
      }

      .legal-heading.level-1 {
        font-size: 1.75rem;
        border-bottom: 3px solid #10b981;
        padding-bottom: 0.75rem;
        color: #047857;
      }

      .legal-heading.level-2 {
        font-size: 1.4rem;
        color: #059669;
        padding-left: 0.5rem;
        border-left: 4px solid #34d399;
      }

      .legal-heading.level-3 {
        font-size: 1.2rem;
        color: #065f46;
        font-weight: 500;
      }

      .legal-title {
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #047857 !important;
        background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        padding: 1rem;
        border-radius: 8px;
        border-left: 5px solid #10b981;
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

      .legal-bold {
        font-weight: 700;
        color: #047857;
      }

      .legal-italic {
        font-style: italic;
        color: #065f46;
      }

      /* Salary Grid References */
      .salary-grid-container {
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        border: 1px solid #a7f3d0;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.5rem 0;
      }

      .salary-references {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .salary-reference {
        display: flex;
        align-items: flex-start;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #10b981;
        box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);
      }

      .reference-number {
        font-weight: 700;
        color: #047857;
        background: #d1fae5;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        margin-right: 1rem;
        flex-shrink: 0;
        font-size: 14px;
      }

      .reference-text {
        flex: 1;
        line-height: 1.6;
        color: #374151;
        font-size: 14px;
      }

      .additional-info {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(16, 185, 129, 0.05);
        border-radius: 8px;
        font-size: 13px;
        color: #065f46;
      }

      @media (max-width: 768px) {
        .salary-reference {
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .reference-number {
          margin-right: 0;
          align-self: flex-start;
        }
      }

      .legal-article {
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        border-left: 4px solid #10b981;
        padding: 1.25rem;
        margin: 1.5rem 0;
        font-weight: 500;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
      }

      .legal-paragraph {
        padding-left: 1.25rem;
        border-left: 3px solid #a7f3d0;
        margin: 1rem 0;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      .legal-subsection {
        padding-left: 2rem;
        color: #065f46;
        font-style: italic;
        background-color: #f0fdf4;
        padding: 0.75rem;
        border-radius: 6px;
        margin: 0.75rem 0;
      }

      /* Tables */
      .table-container {
        overflow-x: auto;
        margin: 2rem 0;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(16, 185, 129, 0.1);
        border: 1px solid #d1fae5;
      }

      .legal-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        font-size: 14px;
      }

      .legal-table th {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 1rem 0.75rem;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.025em;
      }

      .legal-table td {
        padding: 0.875rem 0.75rem;
        border-bottom: 1px solid #d1fae5;
        vertical-align: top;
        font-size: 14px;
      }

      .legal-table tbody tr:nth-child(even) {
        background-color: #f0fdf4;
      }

      .legal-table tbody tr:hover {
        background-color: #ecfdf5;
        transform: translateY(-1px);
        transition: all 0.2s ease;
      }

      /* Lists */
      .legal-ordered-list, .legal-unordered-list {
        margin: 1.5rem 0;
        padding-left: 2rem;
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 1rem 2rem;
      }

      .legal-ordered-list li {
        margin-bottom: 0.75rem;
        padding-left: 0.5rem;
        color: #374151;
      }

      .legal-unordered-list li {
        margin-bottom: 0.75rem;
        padding-left: 0.5rem;
        list-style-type: none;
        position: relative;
      }

      .legal-unordered-list li::before {
        content: "◆";
        color: #10b981;
        font-weight: bold;
        position: absolute;
        left: -1rem;
      }

      /* Quotes */
      .legal-quote {
        border-left: 4px solid #10b981;
        background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        padding: 1.25rem;
        margin: 1.5rem 0;
        font-style: italic;
        color: #065f46;
        border-radius: 8px;
        position: relative;
      }

      .legal-quote::before {
        content: """;
        font-size: 3rem;
        color: #a7f3d0;
        position: absolute;
        top: -0.5rem;
        left: 1rem;
        font-family: Georgia, serif;
      }

      /* Table of Contents */
      .table-of-contents {
        background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        border: 1px solid #a7f3d0;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
      }

      .table-of-contents h3 {
        margin-top: 0;
        color: #047857;
        font-size: 1.25rem;
        border-bottom: 2px solid #10b981;
        padding-bottom: 0.5rem;
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
        color: #059669;
        text-decoration: none;
        display: block;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-weight: 500;
      }

      .toc-list a:hover {
        background-color: #d1fae5;
        color: #047857;
        transform: translateX(0.25rem);
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
          font-size: 13px;
        }
        
        .legal-heading.level-1 {
          font-size: 1.4rem;
        }
        
        .legal-heading.level-2 {
          font-size: 1.2rem;
        }
        
        .table-container {
          font-size: 0.8rem;
        }
        
        .legal-table th, .legal-table td {
          padding: 0.5rem 0.4rem;
          font-size: 12px;
        }
        
        .legal-ordered-list, .legal-unordered-list {
          padding: 0.75rem 1.5rem;
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