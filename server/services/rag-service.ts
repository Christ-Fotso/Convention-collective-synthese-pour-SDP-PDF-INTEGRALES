import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentChunk {
  content: string;
  filename: string;
  conventionName: string;
  idcc: string;
}

class RAGService {
  private documents: DocumentChunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('Initialisation du service RAG...');
    await this.loadDocuments();
    console.log(`Service RAG initialisé avec ${this.documents.length} documents`);
    this.initialized = true;
  }

  private async loadDocuments() {
    const conventionsDir = path.join(process.cwd(), 'Conventions_Collectives_TXT');
    
    if (!fs.existsSync(conventionsDir)) {
      console.warn('Dossier Conventions_Collectives_TXT non trouvé');
      return;
    }

    const files = fs.readdirSync(conventionsDir);
    console.log(`Chargement de ${files.length} fichiers de conventions...`);

    for (const file of files) {
      if (file.endsWith('.txt')) {
        try {
          const filePath = path.join(conventionsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Extraire le nom de la convention et l'IDCC
          const match = file.match(/^(.+?) - IDCC(\d+)\.txt$/);
          const conventionName = match ? match[1] : file.replace('.txt', '');
          const idcc = match ? match[2] : '';

          // Diviser le contenu en chunks plus petits pour améliorer la recherche
          const chunks = this.splitIntoChunks(content, 2000);
          
          for (let i = 0; i < chunks.length; i++) {
            this.documents.push({
              content: chunks[i],
              filename: file,
              conventionName,
              idcc,
            });
          }
        } catch (error) {
          console.error(`Erreur lors du chargement de ${file}:`, error);
        }
      }
    }
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'embedding:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async searchRelevantDocuments(query: string, limit: number = 5): Promise<DocumentChunk[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Générer l'embedding de la requête
    const queryEmbedding = await this.getEmbedding(query);
    if (queryEmbedding.length === 0) {
      console.error('Impossible de générer l\'embedding pour la requête');
      return [];
    }

    // Recherche par similarité sémantique
    const similarities: { document: DocumentChunk; similarity: number }[] = [];
    
    for (const doc of this.documents) {
      // Utiliser le cache d'embeddings si disponible
      let docEmbedding = this.embeddings.get(doc.content);
      if (!docEmbedding) {
        docEmbedding = await this.getEmbedding(doc.content);
        this.embeddings.set(doc.content, docEmbedding);
      }
      
      if (docEmbedding.length > 0) {
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        similarities.push({ document: doc, similarity });
      }
    }

    // Trier par similarité décroissante et retourner les meilleurs résultats
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, limit).map(item => item.document);
  }

  async generateAnswer(query: string, context: DocumentChunk[]): Promise<string> {
    const contextText = context.map(doc => 
      `[${doc.conventionName} - IDCC ${doc.idcc}]\n${doc.content}`
    ).join('\n\n---\n\n');

    const prompt = `Tu es un expert en droit du travail français. Utilise UNIQUEMENT les informations fournies dans le contexte ci-dessous pour répondre à la question de l'utilisateur.

CONTEXTE (conventions collectives):
${contextText}

QUESTION: ${query}

INSTRUCTIONS:
1. Réponds UNIQUEMENT avec les informations présentes dans le contexte
2. Cite les conventions collectives spécifiques (nom et IDCC) utilisées
3. Sois précis et structuré dans ta réponse
4. Si l'information n'est pas dans le contexte, dis-le clairement
5. Format ta réponse en markdown avec des titres et listes à puces
6. Indique les références légales quand elles sont mentionnées

RÉPONSE:`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'Tu es un expert en droit du travail français qui répond uniquement avec les informations fournies dans le contexte.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      return response.choices[0].message.content || 'Désolé, je n\'ai pas pu générer une réponse.';
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      return 'Erreur lors de la génération de la réponse. Veuillez réessayer.';
    }
  }

  async answerQuestion(query: string): Promise<{
    answer: string;
    sources: { conventionName: string; idcc: string; filename: string }[];
  }> {
    console.log(`Recherche RAG pour: "${query}"`);
    
    const relevantDocs = await this.searchRelevantDocuments(query, 5);
    
    if (relevantDocs.length === 0) {
      return {
        answer: 'Aucun document pertinent trouvé pour cette question.',
        sources: []
      };
    }

    const answer = await this.generateAnswer(query, relevantDocs);
    
    const sources = relevantDocs.map(doc => ({
      conventionName: doc.conventionName,
      idcc: doc.idcc,
      filename: doc.filename
    }));

    console.log(`Réponse générée avec ${sources.length} sources`);
    
    return { answer, sources };
  }
}

export const ragService = new RAGService();