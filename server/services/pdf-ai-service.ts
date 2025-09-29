import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Utilisation de Gemini 1.5 Flash - plus économique et context window 1M tokens
const geminiApi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-2.5-flash";

export class PDFAnalysisService {
  private pdfDirectory = './extraction_2025-09-24';

  /**
   * Trouve le fichier PDF d'une convention par IDCC ou nom de convention
   */
  private findPDFByIDCC(idcc: string): string | null {
    try {
      const files = fs.readdirSync(this.pdfDirectory);
      
      // D'abord, chercher par IDCC (format: {IDCC}_{nom}.pdf)
      let pdfFile = files.find(file => 
        file.startsWith(`${idcc}_`) && file.endsWith('.pdf')
      );
      
      // Si pas trouvé et que idcc contient des caractères non-numériques,
      // chercher par nom de convention (format: {nom}.pdf pour conventions sans IDCC)
      if (!pdfFile && !/^\d+$/.test(idcc)) {
        console.log(`Recherche par nom de convention: ${idcc}`);
        // Nettoyer le nom pour la recherche (remplacer espaces par underscores, etc.)
        const cleanName = idcc.replace(/\s+/g, '_')
                             .replace(/[<>:"/\\|?*]/g, '_')
                             .replace(/[()]/g, '_')
                             .replace(/_+/g, '_')
                             .replace(/^_|_$/g, '');
        
        // Chercher un fichier qui correspond au nom nettoyé
        pdfFile = files.find(file => {
          const fileName = file.replace('.pdf', '');
          return fileName.toLowerCase().includes(cleanName.toLowerCase()) && file.endsWith('.pdf');
        });
        
        // Si toujours pas trouvé, essayer une recherche plus large
        if (!pdfFile) {
          const searchTerms = idcc.toLowerCase().split(/\s+|_/).filter(term => term.length > 2);
          pdfFile = files.find(file => {
            const fileLower = file.toLowerCase();
            return searchTerms.some(term => fileLower.includes(term)) && file.endsWith('.pdf');
          });
        }
      }
      
      if (pdfFile) {
        console.log(`PDF trouvé: ${pdfFile} pour convention: ${idcc}`);
        return path.join(this.pdfDirectory, pdfFile);
      }
      
      console.log(`Aucun PDF trouvé pour: ${idcc}`);
      return null;
    } catch (error) {
      console.error(`Erreur recherche PDF ${idcc}:`, error);
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
   * Analyse une convention avec Gemini 1.5 Flash avec chunks étendus et historique
   */
  async analyzeConventionPDF(idcc: string, question: string, chatHistory: Array<{question: string, answer: string}> = []): Promise<{
    response: string;
    source: string;
    cost: number;
    isExtended: boolean;
  }> {
    try {
      console.log(`Analyse sections pour IDCC ${idcc}`);
      
      // Préparer le prompt optimisé pour Gemini 1.5 Flash avec historique
      const systemPrompt = `Tu analyseras le contenu de convention collective fourni pour répondre avec précision et clarté.

INSTRUCTIONS PRIORITAIRES:
- Réponds EXCLUSIVEMENT en te basant sur le contenu fourni de la convention collective
- PRIVILÉGIE TOUJOURS LES INFORMATIONS LES PLUS RÉCENTES : si plusieurs dispositions/versions/dates existent, présente en priorité les plus récentes
- Pour les salaires, grilles, montants : donne systématiquement les valeurs les plus récentes en premier
- Cite PRÉCISÉMENT les articles, paragraphes, ou sections avec leurs numéros exacts
- Explique clairement les implications pratiques
- Structure ta réponse de manière hiérarchique avec des titres clairs
- Utilise le format markdown pour la lisibilité
- Si l'information n'existe pas dans le contenu fourni, dis clairement "Cette information n'est pas présente dans la convention collective"

HISTORIQUE DE CONVERSATION:
- Tiens compte des questions et réponses précédentes pour éviter les répétitions
- Si la question actuelle fait référence à une réponse précédente, utilise ce contexte pour compléter ta réponse`;

      // Construire le contexte avec l'historique
      let contextHistory = '';
      if (chatHistory.length > 0) {
        contextHistory = '\n\n=== HISTORIQUE DE LA CONVERSATION ===\n';
        chatHistory.forEach((exchange, index) => {
          contextHistory += `\nÉchange ${index + 1}:\nQ: ${exchange.question}\nR: ${exchange.answer}\n`;
        });
      }

      const userPrompt = `Question sur la convention collective IDCC ${idcc}: ${question}${contextHistory}

Analyse le contenu fourni et réponds en te basant uniquement sur celui-ci.`;

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
        // Fallback: chunks plus larges pour Gemini 1.5 Flash (800k caractères au lieu de 300k)
        const startChunk = fullPdfText.substring(0, 700000);
        const endChunk = fullPdfText.length > 800000 
          ? fullPdfText.substring(fullPdfText.length - 100000) 
          : '';
        pdfText = startChunk + (endChunk ? '\n\n=== FIN DU DOCUMENT ===\n\n' + endChunk : '');
        console.log(`Analyse par chunks étendus (début + fin): ${pdfText.length} caractères`);
      }

      // Détecter si le contenu est tronqué (pour indiquer à l'utilisateur)
      const isTruncated = fullPdfText.length > 800000 || relevantSections.length > 0;
      const isExtended = !isTruncated;
      
      // Appel à Gemini 1.5 Flash avec le texte extrait
      const model = geminiApi.getGenerativeModel({ model: MODEL });
      const finalPrompt = `${systemPrompt}

${userPrompt}

=== CONTENU DE LA CONVENTION COLLECTIVE ===

${pdfText}

${isTruncated ? '\n\n[IMPORTANT: Ce contenu représente une partie sélectionnée du document complet. Des informations pourraient manquer dans d\'autres sections.]' : ''}`;

      const result = await model.generateContent(finalPrompt);
      const response = await result.response;

      const answer = response.text() || "Pas de réponse générée";
      
      // Calcul du coût approximatif (Gemini 1.5 Flash très économique)
      const estimatedInputTokens = Math.ceil(finalPrompt.length / 4); // ~4 chars par token
      const estimatedOutputTokens = Math.ceil(answer.length / 4);
      const inputCost = (estimatedInputTokens / 1000000) * 0.075; // $0.075 per 1M tokens
      const outputCost = (estimatedOutputTokens / 1000000) * 0.30; // $0.30 per 1M tokens
      const totalCost = inputCost + outputCost;

      console.log(`Analyse terminée - Tokens estimés: ~${estimatedInputTokens + estimatedOutputTokens} - Coût: $${totalCost.toFixed(6)}`);

      return {
        response: answer,
        source: `Analyse ${isExtended ? 'étendue' : 'non étendue'} (${Math.round(pdfText.length/1000)}k caractères)`,
        cost: totalCost,
        isExtended: isExtended
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
    const chunkSize = 8000; // Chunks de 8000 caractères pour plus de contexte
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
      
      // Ajouter si score suffisant (seuil réduit pour capturer plus de contenu)
      if (score >= 10) {
        sections.push(`[Score: ${score}] ${chunk}`);
      }
    }
    
    // Trier par score et limiter à 30 sections max pour couvrir ~20% du document
    return sections
      .sort((a, b) => {
        const scoreA = parseInt(a.match(/\[Score: (\d+)\]/)?.[1] || '0');
        const scoreB = parseInt(b.match(/\[Score: (\d+)\]/)?.[1] || '0');
        return scoreB - scoreA;
      })
      .slice(0, 30)
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
        // Extraire l'IDCC du nom de fichier s'il y en a un
        const idccMatch = match.match(/^(\d+)_/);
        if (idccMatch) {
          return idccMatch[1];
        } else {
          // Pour les conventions sans IDCC, retourner le nom du fichier sans .pdf
          return match.replace('.pdf', '');
        }
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
          
          if (match) {
            // Convention avec IDCC
            return {
              idcc: match[1],
              name: match[2].replace(/_/g, ' '),
              size: stats.size
            };
          } else {
            // Convention sans IDCC - utiliser le nom de fichier
            const fileName = file.replace('.pdf', '');
            return {
              idcc: fileName, // Utiliser le nom de fichier comme identifiant
              name: fileName.replace(/_/g, ' ').replace(/,/g, ' : '),
              size: stats.size
            };
          }
        })
        .sort((a, b) => {
          // Trier par IDCC numérique d'abord, puis par nom pour les conventions sans IDCC
          const aIsNumeric = /^\d+$/.test(a.idcc);
          const bIsNumeric = /^\d+$/.test(b.idcc);
          
          if (aIsNumeric && bIsNumeric) {
            return parseInt(a.idcc) - parseInt(b.idcc);
          } else if (aIsNumeric && !bIsNumeric) {
            return -1; // Les conventions avec IDCC d'abord
          } else if (!aIsNumeric && bIsNumeric) {
            return 1; // Les conventions avec IDCC d'abord
          } else {
            return a.name.localeCompare(b.name); // Tri alphabétique pour les conventions sans IDCC
          }
        });

      return conventions;
    } catch (error) {
      console.error('Erreur liste conventions:', error);
      return [];
    }
  }
}

export const pdfAnalysisService = new PDFAnalysisService();