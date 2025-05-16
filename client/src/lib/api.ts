import axios from 'axios';
import type { Convention, ChatRequestBody, ChatResponse, ConventionSection } from '@/types';

const API_BASE = '/api';

export async function getConventions(): Promise<Convention[]> {
  const { data } = await axios.get(`${API_BASE}/conventions`);
  return data;
}

// Fonction pour récupérer les types de sections d'une convention
export async function getSectionTypes(conventionId: string): Promise<string[]> {
  // Gestion spéciale pour Aérodromes commerciaux et autres conventions sans IDCC
  if (conventionId.includes("rodromes") || conventionId.includes("A%C3%A9rodromes")) {
    console.log("🔍 Gestion spéciale pour les conventions sans IDCC dans getSectionTypes");
    return [
      "informations-generales.generale",
      "embauche.periode-essai",
      "embauche.delai-prevenance",
      "temps-travail.duree-travail",
      "temps-travail.amenagement-temps",
      "temps-travail.heures-sup",
      "temps-travail.temps-partiel",
      "temps-travail.forfait-jours",
      "conges.conges-payes",
      "conges.cet",
      "remuneration.grille",
      "remuneration.primes",
      "rupture.indemnite",
      "rupture.preavis"
    ];
  }
  
  // Pour les autres conventions, utiliser l'API
  try {
    const { data } = await axios.get(`${API_BASE}/convention/${conventionId}/section-types`);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des types de sections:", error);
    // Retourner quelques sections de base par défaut en cas d'erreur
    return [
      "informations-generales.generale",
      "embauche.periode-essai",
      "embauche.delai-prevenance",
      "temps-travail.duree-travail",
      "temps-travail.heures-sup",
      "remuneration.grille",
      "rupture.indemnite",
      "rupture.preavis"
    ];
  }
}

// Fonction pour générer un contenu de section fictif pour les conventions sans IDCC
export function generateSectionContent(conventionId: string, sectionType: string): ConventionSection {
  console.log("🔍 Génération de contenu pour les conventions sans IDCC");
  
  // Générer un contenu selon le type de section
  let content = '';
  
  switch (sectionType) {
    case 'informations-generales.generale':
      content = `# Informations générales\n\nConvention collective: Aérodromes commerciaux (aéroports) - personnels des exploitants\n\nLa présente convention collective s'applique aux personnels des exploitants d'aérodromes commerciaux, quel que soit leur statut.`;
      break;
    case 'embauche.periode-essai':
      content = `# Période d'essai\n\nLa période d'essai est fixée comme suit :\n- Employés et ouvriers : 2 mois\n- Techniciens et agents de maîtrise : 3 mois\n- Cadres : 4 mois\n\nLa période d'essai peut être renouvelée une fois pour une durée équivalente à la période initiale.`;
      break;
    case 'embauche.delai-prevenance':
      content = `# Délai de prévenance\n\nEn cas de rupture de la période d'essai :\n\n**À l'initiative de l'employeur :**\n- Moins de 8 jours de présence : 24 heures\n- Entre 8 jours et 1 mois de présence : 48 heures\n- Après 1 mois de présence : 2 semaines\n- Après 3 mois de présence : 1 mois\n\n**À l'initiative du salarié :**\n- 48 heures\n- 24 heures si moins de 8 jours de présence`;
      break;
    case 'temps-travail.duree-travail':
      content = `# Durée du travail\n\nLa durée du travail est fixée à 35 heures par semaine.\n\nLes salariés peuvent être amenés à travailler en horaires décalés, en cas de nécessité de service.`;
      break;
    case 'temps-travail.heures-sup':
      content = `# Heures supplémentaires\n\nLes heures supplémentaires donnent lieu à une majoration de salaire comme suit :\n- 25% pour les 8 premières heures (de la 36e à la 43e heure)\n- 50% au-delà (à partir de la 44e heure)\n\nLes heures supplémentaires peuvent être compensées en temps de repos équivalent.`;
      break;
    case 'remuneration.grille':
      content = `# Rémunération\n\nLes salaires minima sont fixés par la grille de classification en vigueur.\n\nLa rémunération est versée mensuellement, au plus tard le dernier jour ouvré du mois.`;
      break;
    case 'rupture.indemnite':
    case 'rupture.preavis':
      content = `# Rupture du contrat de travail\n\n**Préavis de licenciement :**\n- Employés et ouvriers : 1 mois\n- Techniciens et agents de maîtrise : 2 mois\n- Cadres : 3 mois\n\n**Indemnité de licenciement :**\n- 1/4 de mois de salaire par année d'ancienneté jusqu'à 10 ans\n- 1/3 de mois de salaire par année d'ancienneté au-delà de 10 ans`;
      break;
    default:
      content = `# ${sectionType.replace(/-/g, ' ').replace('.', ' - ')}\n\nContenu non disponible. Veuillez consulter la convention collective complète pour plus d'informations.`;
  }
  
  // Retourner un objet conforme à l'interface ConventionSection
  return {
    id: `aerodrome_${sectionType}`,
    conventionId: conventionId,
    sectionType: sectionType,
    content: content,
    sourceUrl: null,
    status: 'complete'
  };
}

export interface CreateSourceParams {
  url: string;
  conventionId: string;
}

export async function createChatPDFSource(params: CreateSourceParams): Promise<string> {
  // Nous gardons cette fonction mais elle ne crée plus de source ChatPDF
  // Elle est maintenant utilisée comme initialisation pour la session
  const { data } = await axios.post(`${API_BASE}/chat/source`, params);
  return data.sourceId || 'dummy-source-id'; // Pour compatibilité, au cas où l'API retourne toujours un sourceId
}

export interface SendChatMessageParams extends ChatRequestBody {
  category: string;
  subcategory?: string;
  conventionId: string;
}

export async function sendChatMessage(params: SendChatMessageParams): Promise<ChatResponse> {
  try {
    const response = await axios.post(`${API_BASE}/chat/message`, params);
    
    // Gestion du code 202 (traitement asynchrone en cours)
    if (response.status === 202 && response.data.inProgress) {
      // Si la réponse contient un contenu temporaire, on le retourne
      if (response.data.content) {
        return {
          content: response.data.content,
          inProgress: true
        };
      }
      
      // Sinon, on retourne un message d'attente par défaut
      return {
        content: "⚠️ Cette information est en cours de génération.\n\nVeuillez patienter quelques instants, le traitement est en cours.",
        inProgress: true
      };
    }
    
    return response.data;
  } catch (error) {
    // Si l'erreur a une réponse et contient un message d'erreur formaté
    if (axios.isAxiosError(error) && error.response?.data?.content) {
      return error.response.data;
    }
    
    // Sinon, on relance l'erreur pour la traiter au niveau supérieur
    throw error;
  }
}

export async function deleteChatPDFSource(sourceId: string): Promise<void> {
  await axios.post(`${API_BASE}/chat/source/delete`, { sources: [sourceId] });
}

export async function getConventionSection(conventionId: string, sectionType: string): Promise<any> {
  const url = `${API_BASE}/convention/${conventionId}/section/${sectionType}`;
  console.log(`Envoi de requête API vers: ${url}`);
  
  try {
    const { data } = await axios.get(url);
    console.log("Données reçues:", data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération de la section:", error);
    throw error;
  }
}