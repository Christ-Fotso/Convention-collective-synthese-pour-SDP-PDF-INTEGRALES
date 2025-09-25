import { multiSectionExtractor, MultiSectionResult } from './multi-section-extractor';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  startTime: number;
  estimatedTimeLeft: number;
  currentConvention?: string;
}

export interface ConventionFile {
  idcc: string;
  name: string;
  filePath: string;
  fileSize: number;
}

export class BatchProcessor {
  private progress: BatchProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    startTime: 0,
    estimatedTimeLeft: 0
  };
  
  private results: Array<{
    convention: ConventionFile;
    bloc1?: MultiSectionResult;
    bloc2?: MultiSectionResult;
    error?: string;
    processingTime: number;
  }> = [];

  /**
   * Scan du dossier PDF pour préparer la liste
   */
  async scanConventions(): Promise<ConventionFile[]> {
    const pdfDir = 'extraction_2025-09-24';
    
    if (!fs.existsSync(pdfDir)) {
      throw new Error(`Dossier PDF introuvable: ${pdfDir}`);
    }
    
    const files = fs.readdirSync(pdfDir)
      .filter(f => f.endsWith('.pdf'))
      .map(filename => {
        const filePath = path.join(pdfDir, filename);
        const stats = fs.statSync(filePath);
        
        // Extraction IDCC et nom depuis le nom de fichier
        const parts = filename.replace('.pdf', '').split('_');
        const idcc = parts[0];
        const name = parts.slice(1).join(' ');
        
        return {
          idcc,
          name,
          filePath,
          fileSize: stats.size
        };
      })
      .sort((a, b) => a.fileSize - b.fileSize); // Commencer par les plus petites
    
    console.log(`📁 ${files.length} conventions trouvées`);
    console.log(`📏 Taille totale: ${(files.reduce((sum, f) => sum + f.fileSize, 0) / 1024 / 1024).toFixed(0)}MB`);
    
    return files;
  }

  /**
   * Traitement par lots avec parallélisation contrôlée
   */
  async processBatch(
    conventions: ConventionFile[], 
    maxParallel: number = 3,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<void> {
    this.progress = {
      total: conventions.length,
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: Date.now(),
      estimatedTimeLeft: 0
    };
    
    console.log(`🚀 Début traitement ${conventions.length} conventions (${maxParallel} parallèles)`);
    
    // Traitement par chunks pour éviter la surcharge
    for (let i = 0; i < conventions.length; i += maxParallel) {
      const chunk = conventions.slice(i, i + maxParallel);
      
      const promises = chunk.map(convention => this.processConvention(convention));
      const chunkResults = await Promise.allSettled(promises);
      
      // Mise à jour des résultats et du progrès
      chunkResults.forEach((result, index) => {
        this.progress.processed++;
        
        if (result.status === 'fulfilled') {
          this.results.push(result.value);
          this.progress.successful++;
          console.log(`✅ ${chunk[index].idcc}: ${result.value.processingTime}ms`);
        } else {
          this.progress.failed++;
          console.error(`❌ ${chunk[index].idcc}: ${result.reason}`);
          this.results.push({
            convention: chunk[index],
            error: result.reason?.message || 'Erreur inconnue',
            processingTime: 0
          });
        }
      });
      
      // Estimation temps restant
      const elapsed = Date.now() - this.progress.startTime;
      const avgTimePerConvention = elapsed / this.progress.processed;
      this.progress.estimatedTimeLeft = avgTimePerConvention * (this.progress.total - this.progress.processed);
      
      // Callback progress
      if (onProgress) {
        onProgress({ ...this.progress });
      }
      
      // Pause entre chunks pour éviter rate limiting
      if (i + maxParallel < conventions.length) {
        await this.sleep(2000); // 2 secondes de pause
      }
    }
    
    console.log(`🎉 Traitement terminé: ${this.progress.successful}/${this.progress.total} réussites`);
  }

  /**
   * Traitement d'une convention complète (Bloc 1 + Bloc 2)
   */
  private async processConvention(convention: ConventionFile): Promise<{
    convention: ConventionFile;
    bloc1: MultiSectionResult;
    bloc2: MultiSectionResult;
    processingTime: number;
  }> {
    const startTime = Date.now();
    this.progress.currentConvention = `${convention.idcc} - ${convention.name}`;
    
    try {
      // Extraction du texte PDF
      const pdfBuffer = fs.readFileSync(convention.filePath);
      const pdfData = await pdfParse(pdfBuffer);
      const conventionText = pdfData.text;
      
      if (!conventionText || conventionText.length < 100) {
        throw new Error('PDF vide ou illisible');
      }
      
      // Traitement parallèle des blocs 1 et 2
      const [bloc1Result, bloc2Result] = await Promise.all([
        multiSectionExtractor.extractSimpleSections(conventionText, convention.idcc, convention.name),
        multiSectionExtractor.extractMediumSections(conventionText, convention.idcc, convention.name)
      ]);
      
      return {
        convention,
        bloc1: bloc1Result,
        bloc2: bloc2Result,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      throw new Error(`Erreur traitement ${convention.idcc}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Sauvegarde des résultats au format JSON
   */
  async saveResults(outputPath: string = 'batch-results.json'): Promise<void> {
    const summary = {
      timestamp: new Date().toISOString(),
      stats: this.progress,
      totalProcessingTime: Date.now() - this.progress.startTime,
      results: this.results
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Résultats sauvegardés: ${outputPath}`);
    
    // Statistiques détaillées
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`⏱️  Temps total: ${(summary.totalProcessingTime / 1000 / 60).toFixed(1)} minutes`);
    console.log(`✅ Succès: ${this.progress.successful}/${this.progress.total}`);
    console.log(`⚡ Moyenne: ${(summary.totalProcessingTime / this.progress.processed / 1000).toFixed(1)}s/convention`);
    
    // Analyse des sections les plus extraites
    const sectionStats = this.analyzeSectionSuccess();
    console.log('\n🎯 SECTIONS LES PLUS RÉUSSIES:');
    sectionStats.slice(0, 10).forEach(stat => {
      console.log(`  ${stat.section}: ${stat.successRate.toFixed(1)}% (${stat.success}/${stat.total})`);
    });
  }

  /**
   * Analyse du taux de succès par section
   */
  private analyzeSectionSuccess(): Array<{
    section: string;
    success: number;
    total: number;
    successRate: number;
  }> {
    const sectionCounts = new Map<string, { success: number; total: number }>();
    
    this.results.forEach(result => {
      if (result.bloc1) {
        result.bloc1.results.forEach(r => {
          const current = sectionCounts.get(r.section) || { success: 0, total: 0 };
          current.total++;
          if (r.status === 'success') current.success++;
          sectionCounts.set(r.section, current);
        });
      }
      
      if (result.bloc2) {
        result.bloc2.results.forEach(r => {
          const current = sectionCounts.get(r.section) || { success: 0, total: 0 };
          current.total++;
          if (r.status === 'success') current.success++;
          sectionCounts.set(r.section, current);
        });
      }
    });
    
    return Array.from(sectionCounts.entries())
      .map(([section, counts]) => ({
        section,
        success: counts.success,
        total: counts.total,
        successRate: (counts.success / counts.total) * 100
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Utilitaire pause
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Getter pour les résultats
   */
  getResults() {
    return this.results;
  }

  /**
   * Getter pour le progrès
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }
}

export const batchProcessor = new BatchProcessor();