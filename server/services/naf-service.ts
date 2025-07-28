import { readFileSync } from 'fs';
import path from 'path';

interface NafEntry {
  conventionId: string;
  conventionName: string;
  idcc: string;
  nafCodes: string[];
  sectors: string[];
}

class NafService {
  private nafIndex: Map<string, NafEntry[]> = new Map();
  private conventionIndex: Map<string, NafEntry> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;

    try {
      const dataPath = path.join(process.cwd(), 'data.json');
      const rawData = readFileSync(dataPath, 'utf-8');
      const conventionsData = JSON.parse(rawData);

      for (const [conventionName, conventionData] of Object.entries(conventionsData)) {
        if (typeof conventionData !== 'object' || !conventionData) continue;
        
        const data = conventionData as any;
        const informationsSection = data.sections?.Informations_générales?.contenu;
        
        if (informationsSection) {
          const nafCodes = this.extractNafCodes(informationsSection);
          const sectors = this.extractSectors(informationsSection);
          
          const entry: NafEntry = {
            conventionId: data.idcc || 'unknown',
            conventionName: conventionName,
            idcc: data.idcc || 'unknown',
            nafCodes: nafCodes,
            sectors: sectors
          };

          // Indexer par convention
          this.conventionIndex.set(data.idcc || conventionName, entry);

          // Indexer par codes NAF
          nafCodes.forEach(code => {
            if (!this.nafIndex.has(code)) {
              this.nafIndex.set(code, []);
            }
            this.nafIndex.get(code)!.push(entry);
          });

          // Indexer par secteurs
          sectors.forEach(sector => {
            const sectorKey = `sector:${sector.toLowerCase()}`;
            if (!this.nafIndex.has(sectorKey)) {
              this.nafIndex.set(sectorKey, []);
            }
            this.nafIndex.get(sectorKey)!.push(entry);
          });
        }
      }

      this.isInitialized = true;
      console.log(`[NAF Service] Indexé ${this.conventionIndex.size} conventions avec ${this.nafIndex.size} codes NAF/secteurs`);
    } catch (error) {
      console.error('[NAF Service] Erreur lors de l\'initialisation:', error);
    }
  }

  private extractNafCodes(content: string): string[] {
    const nafCodes: string[] = [];
    
    // Patterns pour codes NAF
    const nafPatterns = [
      /(?:codes?\s*NAF|NAF\/APE|codes?\s*APE)[:\s]*([0-9A-Z\s,\-\.;]+)/gi,
      /(\d{2}\.?\d{2}[A-Z]?)/g, // Format standard NAF (ex: 01.11A, 4711F)
      /(\d{4}[A-Z])/g // Format condensé (ex: 0111A, 4711F)
    ];

    nafPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Nettoyer et extraire les codes
          const codes = match.replace(/(?:codes?\s*NAF|NAF\/APE|codes?\s*APE)[:\s]*/gi, '')
                            .split(/[,;\s]+/)
                            .map(code => code.trim())
                            .filter(code => /^\d{2}\.?\d{2}[A-Z]?$|^\d{4}[A-Z]$/.test(code));
          
          nafCodes.push(...codes);
        });
      }
    });

    // Déduplication et normalisation
    return Array.from(new Set(nafCodes.map(code => this.normalizeNafCode(code))));
  }

  private extractSectors(content: string): string[] {
    const sectors: string[] = [];
    
    // Patterns pour secteurs d'activité
    const sectorPatterns = [
      /(?:champ d'application professionnel|secteur|activité|domaine)[:\s]*([^.\n]+)/gi,
      /(?:entreprises?|établissements?)[:\s]*([^.\n]+)/gi
    ];

    sectorPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extraire les mots clés du secteur
          const sectorText = match.replace(/(?:champ d'application professionnel|secteur|activité|domaine|entreprises?|établissements?)[:\s]*/gi, '')
                                 .toLowerCase()
                                 .trim();
          
          // Mots clés sectoriels
          const keywords = ['agriculture', 'industrie', 'commerce', 'transport', 'bâtiment', 'santé', 'services', 'alimentation', 'textile', 'métallurgie', 'informatique', 'banque', 'assurance', 'immobilier', 'hôtellerie', 'restauration'];
          
          keywords.forEach(keyword => {
            if (sectorText.includes(keyword)) {
              sectors.push(keyword);
            }
          });
        });
      }
    });

    return Array.from(new Set(sectors));
  }

  private normalizeNafCode(code: string): string {
    // Normalise les codes NAF au format XX.XXX
    return code.replace(/(\d{2})\.?(\d{2})([A-Z]?)/, '$1.$2$3');
  }

  public searchByNafCode(nafCode: string): NafEntry[] {
    const normalizedCode = this.normalizeNafCode(nafCode);
    return this.nafIndex.get(normalizedCode) || [];
  }

  public searchBySector(sector: string): NafEntry[] {
    const sectorKey = `sector:${sector.toLowerCase()}`;
    return this.nafIndex.get(sectorKey) || [];
  }

  public searchByKeyword(keyword: string): NafEntry[] {
    const results: NafEntry[] = [];
    const keywordLower = keyword.toLowerCase();

    // Recherche dans les codes NAF
    Array.from(this.nafIndex.entries()).forEach(([code, entries]) => {
      if (code.toLowerCase().includes(keywordLower)) {
        results.push(...entries);
      }
    });

    // Recherche dans les noms de conventions
    Array.from(this.conventionIndex.values()).forEach(entry => {
      if (entry.conventionName.toLowerCase().includes(keywordLower) ||
          entry.idcc.includes(keywordLower)) {
        results.push(entry);
      }
    });

    // Déduplication
    const uniqueResults = new Map<string, NafEntry>();
    results.forEach(entry => {
      uniqueResults.set(entry.conventionId, entry);
    });

    return Array.from(uniqueResults.values());
  }

  public getAllNafCodes(): string[] {
    return Array.from(this.nafIndex.keys()).filter(key => !key.startsWith('sector:'));
  }

  public getAllSectors(): string[] {
    return Array.from(this.nafIndex.keys())
                   .filter(key => key.startsWith('sector:'))
                   .map(key => key.replace('sector:', ''));
  }

  public getConventionInfo(conventionId: string): NafEntry | undefined {
    return this.conventionIndex.get(conventionId);
  }

  public getStatistics() {
    const conventionsWithNaf = Array.from(this.conventionIndex.values()).filter(entry => entry.nafCodes.length > 0);
    const totalNafCodes = this.getAllNafCodes().length;
    const totalSectors = this.getAllSectors().length;

    return {
      totalConventions: this.conventionIndex.size,
      conventionsWithNaf: conventionsWithNaf.length,
      totalNafCodes,
      totalSectors,
      averageNafCodesPerConvention: conventionsWithNaf.length > 0 
        ? (conventionsWithNaf.reduce((sum, entry) => sum + entry.nafCodes.length, 0) / conventionsWithNaf.length).toFixed(2)
        : 0
    };
  }
}

// Instance singleton
export const nafService = new NafService();