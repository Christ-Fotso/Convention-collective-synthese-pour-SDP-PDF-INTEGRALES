import { db } from "../../db";
import { conventionSections } from "../../db/schema";
import { eq } from "drizzle-orm";
import { 
  saveConventionSection
} from "./section-manager";

/**
 * Cache limité avec fonctionnalités de persistance dans la base de données
 */
export class LimitedCache {
  public cache = new Map();
  private maxSize: number;
  private cacheType: string;
  private saveTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;
  private isInitialized: boolean = false;

  /**
   * @param maxSize Nombre maximal d'éléments dans le cache
   * @param cacheType Type de cache pour différencier les caches dans la persistance
   * @param autoSaveInterval Intervalle de sauvegarde automatique en millisecondes (0 pour désactiver)
   */
  constructor(maxSize: number, cacheType: string = 'default', autoSaveInterval: number = 300000) {
    this.maxSize = maxSize;
    this.cacheType = cacheType;
    
    // Démarrer la sauvegarde automatique si un intervalle est spécifié
    if (autoSaveInterval > 0) {
      this.saveTimer = setInterval(() => {
        if (this.isDirty) {
          this.saveToDatabase()
            .then(() => console.log(`Cache ${this.cacheType} sauvegardé automatiquement.`))
            .catch(err => console.error(`Erreur lors de la sauvegarde automatique du cache ${this.cacheType}:`, err));
        }
      }, autoSaveInterval);
    }
  }

  /**
   * Initialise le cache depuis la base de données
   */
  async initFromDatabase(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log(`Initialisation du cache ${this.cacheType} depuis la base de données...`);
      
      // Récupérer les sections de type cache-data
      const sections = await db.select().from(conventionSections)
        .where(eq(conventionSections.sectionType, `cache-data-${this.cacheType}`));
      
      if (sections.length > 0) {
        // Charger le contenu du cache depuis la base de données
        for (const section of sections) {
          try {
            const cacheData = JSON.parse(section.content);
            if (cacheData && typeof cacheData === 'object') {
              // Charger les entrées dans le cache
              for (const [key, value] of Object.entries(cacheData)) {
                this.cache.set(key, value);
              }
              console.log(`${Object.keys(cacheData).length} entrées chargées dans le cache ${this.cacheType}`);
            }
          } catch (parseError) {
            console.error(`Erreur de parsing du cache ${this.cacheType}:`, parseError);
          }
        }
      } else {
        console.log(`Aucune donnée de cache ${this.cacheType} trouvée en base de données.`);
      }
      
      this.isInitialized = true;
      this.isDirty = false;
    } catch (error) {
      console.error(`Erreur lors de l'initialisation du cache ${this.cacheType}:`, error);
      throw error;
    }
  }

  /**
   * Sauvegarde le contenu du cache dans la base de données
   */
  async saveToDatabase(): Promise<void> {
    try {
      if (this.cache.size === 0) {
        console.log(`Cache ${this.cacheType} vide, aucune sauvegarde nécessaire.`);
        return;
      }
      
      console.log(`Sauvegarde du cache ${this.cacheType} (${this.cache.size} entrées) dans la base de données...`);
      
      // Convertir le Map en objet pour la sérialisation
      const cacheObject: Record<string, any> = {};
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      // Sérialiser le cache
      const serializedCache = JSON.stringify(cacheObject);
      
      // Sauvegarder dans la base de données
      await saveConventionSection({
        conventionId: 'system',  // Utiliser un ID spécial pour les données système
        sectionType: `cache-data-${this.cacheType}`,
        content: serializedCache,
        status: 'complete'
      });
      
      this.isDirty = false;
      console.log(`Cache ${this.cacheType} sauvegardé avec succès.`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du cache ${this.cacheType}:`, error);
      throw error;
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
    this.isDirty = true;
  }
  
  clear(): void {
    this.cache.clear();
    this.isDirty = true;
  }
  
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.isDirty = true;
    }
    return result;
  }
  
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Nettoyage des ressources (arrêt du timer de sauvegarde)
   */
  dispose(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }
}