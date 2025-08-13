import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-4o Mini - le modèle le moins cher et rapide
const MODEL = "gpt-4o-mini";

export class PDFAnalysisService {
  private pdfDirectory = './resultats_telechargements/complet_20250813_102543';

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
      console.log(`Analyse sections pour IDCC ${idcc}`);
      
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

      // Trouver et analyser le PDF complet
      const pdfPath = this.findPDFByIDCC(idcc);
      if (!pdfPath) {
        throw new Error(`PDF introuvable pour IDCC ${idcc}`);
      }

      console.log(`Lecture complète du PDF: ${path.basename(pdfPath)}`);
      
      // Extraire TOUT le texte du PDF (pas juste les sections)
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(pdfBuffer);
      const fullPdfText = pdfData.text;
      
      if (!fullPdfText || fullPdfText.trim().length < 100) {
        throw new Error('PDF vide ou illisible');
      }
      
      console.log(`PDF analysé: ${fullPdfText.length} caractères extraits`);
      
      // Recherche intelligente dans le PDF complet
      // Étape 1: Chercher des sections pertinentes basées sur la question
      const searchTerms = this.extractSearchTerms(question);
      const relevantSections = this.findRelevantSections(fullPdfText, searchTerms, question);
      
      // Étape 2: Si on trouve des sections pertinentes, les utiliser
      // Sinon, prendre le début du document + résumé
      let pdfText: string;
      if (relevantSections.length > 0) {
        pdfText = `=== SECTIONS PERTINENTES TROUVÉES ===\n\n${relevantSections.join('\n\n=== SECTION SUIVANTE ===\n\n')}`;
        console.log(`${relevantSections.length} sections pertinentes trouvées (${pdfText.length} caractères)`);
      } else {
        // Fallback: premiers 300k caractères + fin du document
        const startChunk = fullPdfText.substring(0, 250000);
        const endChunk = fullPdfText.length > 300000 
          ? fullPdfText.substring(fullPdfText.length - 50000) 
          : '';
        pdfText = startChunk + (endChunk ? '\n\n=== FIN DU DOCUMENT ===\n\n' + endChunk : '');
        console.log(`Analyse par chunks (début + fin): ${pdfText.length} caractères`);
      }

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
            content: `${userPrompt}\n\n=== CONTENU DE LA CONVENTION COLLECTIVE ===\n\n${pdfText}`
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
        source: `PDF complet analysé (${Math.round(pdfText.length/1000)}k caractères)`,
        cost: totalCost
      };

    } catch (error) {
      console.error('Erreur analyse PDF:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur lors de l'analyse: ${errorMessage}`);
    }
  }

  /**
   * Extrait les mots-clés de recherche d'une question
   */
  private extractSearchTerms(question: string): string[] {
    const cleanQuestion = question.toLowerCase()
      .replace(/[^\wàâäéèêëïîôöùûüÿç\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'à', 'en', 'pour', 'sur', 'avec', 'par', 'est', 'sont', 'que', 'qui', 'dans', 'ce', 'cette', 'ces', 'son', 'sa', 'ses'];
    const words = cleanQuestion.split(' ').filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    return words;
  }

  /**
   * Trouve les sections pertinentes dans le texte complet
   */
  private findRelevantSections(fullText: string, searchTerms: string[], question: string): string[] {
    const sections: string[] = [];
    const chunkSize = 3000; // Chunks de 3000 caractères
    const questionLower = question.toLowerCase();
    
    // Découper le texte en chunks
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.substring(i, i + chunkSize);
      const chunkLower = chunk.toLowerCase();
      
      // Calculer un score de pertinence
      let score = 0;
      
      // Points pour les mots-clés exacts de la question
      for (const term of searchTerms) {
        const termOccurrences = (chunkLower.match(new RegExp(term, 'g')) || []).length;
        score += termOccurrences * 10;
      }
      
      // Points bonus pour les mots liés aux conventions collectives
      const contextWords = ['prime', 'indemnité', 'salaire', 'congé', 'clause', 'article', 'modalité', 'conditions', 'droit', 'obligation'];
      for (const word of contextWords) {
        if (chunkLower.includes(word)) {
          score += 5;
        }
      }
      
      // Ajouter si score suffisant
      if (score >= 15) {
        sections.push(`[Score: ${score}] ${chunk}`);
      }
    }
    
    // Trier par score et limiter à 8 sections max
    return sections
      .sort((a, b) => {
        const scoreA = parseInt(a.match(/\[Score: (\d+)\]/)?.[1] || '0');
        const scoreB = parseInt(b.match(/\[Score: (\d+)\]/)?.[1] || '0');
        return scoreB - scoreA;
      })
      .slice(0, 8)
      .map(s => s.replace(/\[Score: \d+\] /, ''));
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