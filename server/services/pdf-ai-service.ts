import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-4o Mini - le modèle le moins cher et rapide
const MODEL = "gpt-4o-mini";

export class PDFAnalysisService {
  private pdfDirectory = 'resultats_telechargements/complet_20250813_102543';

  /**
   * Trouve le fichier PDF d'une convention par IDCC
   */
  private findPDFByIDCC(idcc: string): string | null {
    try {
      const files = fs.readdirSync(this.pdfDirectory);
      const pdfFile = files.find(file => 
        file.startsWith(`${idcc}_`) && file.endsWith('.pdf')
      );
      return pdfFile ? path.join(this.pdfDirectory, pdfFile) : null;
    } catch (error) {
      console.error(`Erreur recherche PDF IDCC ${idcc}:`, error);
      return null;
    }
  }

  /**
   * Convertit un PDF en base64
   */
  private pdfToBase64(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  }

  /**
   * Analyse une convention avec GPT-4o Mini en envoyant le PDF complet
   */
  async analyzeConventionPDF(idcc: string, question: string): Promise<{
    response: string;
    source: string;
    cost: number;
  }> {
    try {
      // Trouver le PDF
      const pdfPath = this.findPDFByIDCC(idcc);
      if (!pdfPath) {
        throw new Error(`PDF introuvable pour IDCC ${idcc}`);
      }

      // Convertir en base64
      console.log(`Analyse PDF: ${path.basename(pdfPath)}`);
      const pdfBase64 = this.pdfToBase64(pdfPath);
      
      // Préparer le prompt optimisé pour GPT-4o Mini
      const systemPrompt = `Tu es un expert en droit du travail français. Tu analyseras le PDF de convention collective fourni pour répondre précisément aux questions.

INSTRUCTIONS:
- Réponds uniquement en te basant sur le contenu exact du PDF
- Cite les articles/paragraphes pertinents
- Si l'information n'est pas dans le PDF, dis-le clairement
- Sois concis et précis
- Formate ta réponse en markdown`;

      const userPrompt = `Question sur la convention collective IDCC ${idcc}: ${question}

Analyse le PDF joint et réponds en te basant uniquement sur son contenu.`;

      // GPT-4o Mini ne supporte pas les PDFs directement
      // On doit d'abord extraire le texte, puis l'envoyer
      const pdfParse = await import('pdf-parse');
      const buffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse.default(buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 100) {
        throw new Error('PDF vide ou illisible');
      }

      // Limiter le texte pour éviter de dépasser les tokens (chunks longs)
      const maxChars = 50000; // ~15k tokens environ
      const limitedText = pdfText.length > maxChars 
        ? pdfText.substring(0, maxChars) + '\n\n[...document tronqué...]'
        : pdfText;

      console.log(`Texte PDF extrait: ${limitedText.length} caractères`);

      // Appel à GPT-4o Mini avec le texte extrait
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${userPrompt}\n\n=== CONTENU DE LA CONVENTION COLLECTIVE ===\n\n${limitedText}`
          }
        ],
        max_tokens: 2000, // Chunks longs comme demandé
        temperature: 0.1, // Précision maximale
      });

      const answer = response.choices[0]?.message?.content || "Pas de réponse générée";
      
      // Calcul du coût approximatif (GPT-4o Mini très bon marché)
      const usage = response.usage;
      const inputCost = (usage?.prompt_tokens || 0) * 0.000000150; // $0.000150 per 1K tokens
      const outputCost = (usage?.completion_tokens || 0) * 0.000000600; // $0.000600 per 1K tokens
      const totalCost = inputCost + outputCost;

      console.log(`Analyse terminée - Tokens: ${usage?.total_tokens} - Coût: $${totalCost.toFixed(6)}`);

      return {
        response: answer,
        source: `Convention collective IDCC ${idcc} - ${path.basename(pdfPath)}`,
        cost: totalCost
      };

    } catch (error) {
      console.error('Erreur analyse PDF:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur lors de l'analyse: ${errorMessage}`);
    }
  }

  /**
   * Recherche de convention par nom approximatif
   */
  findConventionByName(searchName: string): string | null {
    try {
      const files = fs.readdirSync(this.pdfDirectory);
      const searchLower = searchName.toLowerCase();
      
      const match = files.find(file => 
        file.toLowerCase().includes(searchLower) && file.endsWith('.pdf')
      );

      if (match) {
        // Extraire l'IDCC du nom de fichier
        const idccMatch = match.match(/^(\d+)_/);
        return idccMatch ? idccMatch[1] : null;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur recherche convention:', error);
      return null;
    }
  }

  /**
   * Liste toutes les conventions disponibles
   */
  getAvailableConventions(): Array<{ idcc: string; name: string; size: number }> {
    try {
      const files = fs.readdirSync(this.pdfDirectory);
      const conventions = files
        .filter(file => file.endsWith('.pdf'))
        .map(file => {
          const filePath = path.join(this.pdfDirectory, file);
          const stats = fs.statSync(filePath);
          const match = file.match(/^(\d+)_(.+)\.pdf$/);
          
          return {
            idcc: match ? match[1] : 'unknown',
            name: match ? match[2].replace(/_/g, ' ') : file,
            size: stats.size
          };
        })
        .sort((a, b) => parseInt(a.idcc) - parseInt(b.idcc));

      return conventions;
    } catch (error) {
      console.error('Erreur liste conventions:', error);
      return [];
    }
  }
}

export const pdfAnalysisService = new PDFAnalysisService();