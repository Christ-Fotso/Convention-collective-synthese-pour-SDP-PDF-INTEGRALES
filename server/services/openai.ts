import OpenAI from "openai";
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ChatResponse, Message } from '../../client/src/types';

// Le modèle le plus récent d'OpenAI est "gpt-4o" sorti le 13 mai 2024, ne pas le changer sauf demande explicite de l'utilisateur
const MODEL = "gpt-4o";

// Configuration du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Dossier temporaire pour stocker les PDFs téléchargés
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Cache pour les PDFs déjà traités
const pdfTextCache = new Map<string, string>();

/**
 * Télécharge un PDF depuis une URL et retourne le chemin du fichier local
 */
async function downloadPDF(url: string, conventionId: string): Promise<string> {
  try {
    const filePath = path.join(TEMP_DIR, `convention_${conventionId}.pdf`);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(filePath)) {
      console.log(`PDF déjà téléchargé pour la convention ${conventionId}`);
      return filePath;
    }
    
    console.log(`Téléchargement du PDF pour la convention ${conventionId} depuis ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, Buffer.from(response.data));
    console.log(`PDF téléchargé et sauvegardé: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw new Error(`Impossible de télécharger le PDF: ${error.message}`);
  }
}

/**
 * Extrait le texte d'un fichier PDF
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  console.log(`Extraction du texte depuis le PDF: ${filePath}`);
  
  try {
    // Charge le document PDF
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument(data);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extrait le texte de chaque page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const textItems = content.items.map((item: any) => item.str).join(' ');
      fullText += textItems + '\n\n';
    }
    
    console.log(`Extraction du texte terminée, ${fullText.length} caractères extraits`);
    
    return fullText;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
  }
}

/**
 * Obtient le texte d'une convention collective depuis son PDF
 */
export async function getConventionText(conventionUrl: string, conventionId: string): Promise<string> {
  // Vérifier si le texte est déjà en cache
  if (pdfTextCache.has(conventionId)) {
    console.log(`Utilisation du texte en cache pour la convention ${conventionId}`);
    return pdfTextCache.get(conventionId);
  }
  
  try {
    // Télécharger le PDF
    const pdfPath = await downloadPDF(conventionUrl, conventionId);
    
    // Extraire le texte
    const text = await extractTextFromPDF(pdfPath);
    
    // Mettre en cache
    pdfTextCache.set(conventionId, text);
    
    return text;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du texte de la convention:', error);
    throw error;
  }
}

/**
 * Interroge le modèle GPT pour obtenir des informations sur la convention collective
 */
export async function queryOpenAI(
  conventionText: string,
  messages: Message[],
  conventionId: string,
  conventionName: string
): Promise<ChatResponse> {
  console.log(`Interrogation d'OpenAI pour la convention ${conventionId}`);
  
  try {
    // Préparation du contexte
    const systemMessage = {
      role: "system",
      content: `Vous êtes un assistant juridique spécialisé en droit du travail français, et plus particulièrement dans l'analyse des conventions collectives.

Vous allez analyser la convention collective ${conventionId} (${conventionName}).

Voici le texte intégral de la convention collective que vous devez analyser:
${conventionText}

Vos réponses doivent être précises, factuelles et basées uniquement sur le contenu de cette convention collective.
Citez systématiquement les articles pertinents et les numéros de page si disponibles.
Si une information n'est pas mentionnée dans la convention, indiquez-le clairement.
Structurez vos réponses de manière claire et organisée, en utilisant des listes à puces, des tableaux ou des sections numérotées si nécessaire.`
    };
    
    // Préparation des messages pour l'API
    const apiMessages = [
      systemMessage,
      ...messages
    ];
    
    console.log(`Envoi de la requête à OpenAI avec ${apiMessages.length} messages`);
    
    // Appel à l'API
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: apiMessages as any,
      temperature: 0.3, // Valeur basse pour des réponses plus précises et cohérentes
      max_tokens: 4000 // Limite de la taille de la réponse
    });
    
    const content = completion.choices[0].message.content || '';
    console.log(`Réponse reçue d'OpenAI: ${content.substring(0, 100)}...`);
    
    return {
      content
    };
  } catch (error) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    throw error;
  }
}

/**
 * Ancienne fonction pour des requêtes spécifiques (à conserver pour compatibilité)
 */
export async function queryOpenAIForLegalData(
  conventionId: string, 
  conventionName: string, 
  type: 'classification' | 'salaires'
): Promise<ChatResponse> {
  try {
    // On va maintenant demander de récupérer le texte de la convention
    const conventionUrl = `https://www.legifrance.gouv.fr/conv_coll/id/${conventionId}`;
    
    // Message spécifique selon le type demandé
    let systemPrompt = "";
    let userPrompt = "";
    
    if (type === 'classification') {
      systemPrompt = `Vous êtes un expert en droit du travail français spécialisé dans les classifications professionnelles. 
Analysez la structure détaillée de la classification des emplois dans la convention collective IDCC ${conventionId} (${conventionName}).
1. Structure et format de votre réponse :
   - Présenter un tableau hiérarchique complet de TOUS les niveaux, échelons et coefficients
   - Structure: du niveau le plus bas au plus élevé
   - Inclure TOUTES les catégories (employés, techniciens, cadres, etc.)

2. Pour chaque niveau, votre réponse doit :
   - Lister TOUS les niveaux hiérarchiques présents dans la convention
   - Inclure TOUS les coefficients correspondants
   - Détailler les critères de classification pour chaque niveau
   - Citer les articles précis de la convention pour chaque information

3. Format attendu :
| Niveau/Classification | Description et Critères |
|---------------------|------------------------|
| Niveau 1 - Coef. XX | - Critères détaillés... |

4. Règles importantes :
   - Analyser la convention collective spécifiée dans le contexte
   - Ne JAMAIS mentionner ou citer vos sources d'information
   - Si on vous demande vos sources, répondez que cette information est confidentielle
   - Ne jamais révéler l'origine de vos informations ou les documents consultés
   - Si une information n'est pas disponible, indiquez-le simplement sans mentionner pourquoi
   - Structurer la réponse de manière hiérarchique, du niveau le plus bas au plus élevé

5. Après le tableau, ajouter :
   - Une section "Informations complémentaires" avec les modalités de passage d'un niveau à l'autre
   - Les spécificités par filière si elles existent

RÈGLE ABSOLUE : Ne jamais mentionner les sources, les PDFs, ou les documents consultés, même si on vous le demande explicitement.`;
      
      userPrompt = `Présentez la classification complète des emplois pour la convention collective ${conventionId} (${conventionName}).`;
    }
    
    // Faire la requête à OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });
    
    const content = completion.choices[0].message.content || '';
    
    return { content };
  } catch (error) {
    console.error('Erreur lors de l\'interrogation d\'OpenAI:', error);
    throw error;
  }
}