/**
 * API d'administration pour éditer les données JSON
 * Ce fichier contient les routes pour visualiser et modifier les données JSON
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataFilePath = path.join(process.cwd(), 'data.json');

// Interface pour les données JSON
interface ConventionDataJSON {
  [conventionName: string]: {
    libelle: string;
    idcc: string;
    sections: {
      [sectionName: string]: {
        section: string;
        contenu: string;
      }
    }
  }
}

/**
 * Obtenir la structure complète des données JSON
 */
router.get('/json-structure', async (req, res) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }

    // Lire le fichier mais ne pas renvoyer tout le contenu (trop volumineux)
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Créer une structure simplifiée avec les conventions et leurs sections
    const structure: { 
      conventions: Array<{ 
        name: string, 
        id: string, 
        sections: Array<string> 
      }> 
    } = {
      conventions: []
    };
    
    // Parcourir toutes les conventions
    for (const [conventionName, conventionData] of Object.entries(data)) {
      const sectionNames = Object.keys(conventionData.sections);
      
      structure.conventions.push({
        name: conventionData.libelle,
        id: conventionData.idcc,
        sections: sectionNames
      });
    }
    
    // Trier les conventions par ordre alphabétique du nom
    structure.conventions.sort((a, b) => {
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
    
    res.json(structure);
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier JSON:", error);
    res.status(500).json({ error: "Erreur lors de la lecture du fichier JSON" });
  }
});

/**
 * Obtenir les détails d'une convention spécifique
 */
router.get('/convention/:idcc', async (req, res) => {
  try {
    const { idcc } = req.params;
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }
    
    // Lire le fichier
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Trouver la convention par IDCC
    let foundConvention = null;
    let conventionKey = null;
    
    for (const [key, convention] of Object.entries(data)) {
      if (convention.idcc === idcc) {
        foundConvention = convention;
        conventionKey = key;
        break;
      }
    }
    
    if (!foundConvention || !conventionKey) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }
    
    // Créer un objet avec les informations principales (sans le contenu des sections)
    const conventionInfo = {
      key: conventionKey,
      name: foundConvention.libelle,
      idcc: foundConvention.idcc,
      sections: Object.keys(foundConvention.sections).map(sectionName => ({
        name: sectionName,
        title: foundConvention.sections[sectionName].section
      }))
    };
    
    res.json(conventionInfo);
  } catch (error) {
    console.error("Erreur lors de la récupération de la convention:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la convention" });
  }
});

/**
 * Obtenir une section spécifique d'une convention
 */
router.get('/convention/:idcc/section/:sectionName', async (req, res) => {
  try {
    const { idcc, sectionName } = req.params;
    const decodedSectionName = decodeURIComponent(sectionName);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }
    
    // Lire le fichier
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Trouver la convention par IDCC
    let foundConvention = null;
    let conventionKey = null;
    
    for (const [key, convention] of Object.entries(data)) {
      if (convention.idcc === idcc) {
        foundConvention = convention;
        conventionKey = key;
        break;
      }
    }
    
    if (!foundConvention || !conventionKey) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }
    
    // Vérifier si la section existe
    if (!foundConvention.sections[decodedSectionName]) {
      return res.status(404).json({ error: "Section non trouvée" });
    }
    
    const section = foundConvention.sections[decodedSectionName];
    
    res.json({
      conventionId: idcc,
      conventionName: foundConvention.libelle,
      sectionName: decodedSectionName,
      sectionTitle: section.section,
      content: section.contenu
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la section:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la section" });
  }
});

/**
 * Mettre à jour une section spécifique d'une convention
 */
router.put('/convention/:idcc/section/:sectionName', async (req, res) => {
  try {
    const { idcc, sectionName } = req.params;
    const decodedSectionName = decodeURIComponent(sectionName);
    const { content, sectionTitle } = req.body;
    
    // Vérifier si les données requises sont présentes
    if (!content) {
      return res.status(400).json({ error: "Le contenu de la section est requis" });
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }
    
    // Lire le fichier
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Trouver la convention par IDCC
    let conventionKey = null;
    
    for (const [key, convention] of Object.entries(data)) {
      if (convention.idcc === idcc) {
        conventionKey = key;
        break;
      }
    }
    
    if (!conventionKey) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }
    
    // Vérifier si la section existe
    if (!data[conventionKey].sections[decodedSectionName]) {
      return res.status(404).json({ error: "Section non trouvée" });
    }
    
    // Mettre à jour la section
    data[conventionKey].sections[decodedSectionName].contenu = content;
    
    // Mettre à jour le titre de la section si fourni
    if (sectionTitle) {
      data[conventionKey].sections[decodedSectionName].section = sectionTitle;
    }

    // Créer une sauvegarde du fichier avant la modification
    const backupPath = path.join(process.cwd(), 'backup', `data-${Date.now()}.json`);
    
    // S'assurer que le répertoire de sauvegarde existe
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Écrire la sauvegarde
    await fs.promises.writeFile(backupPath, jsonData);
    
    // Écrire les données mises à jour
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: "Section mise à jour avec succès",
      backupPath: backupPath
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la section:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la section" });
  }
});

/**
 * Ajouter une nouvelle section à une convention
 */
router.post('/convention/:idcc/section', async (req, res) => {
  try {
    const { idcc } = req.params;
    const { sectionName, sectionTitle, content } = req.body;
    
    // Vérifier si les données requises sont présentes
    if (!sectionName || !content || !sectionTitle) {
      return res.status(400).json({ error: "Le nom, le titre et le contenu de la section sont requis" });
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }
    
    // Lire le fichier
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Trouver la convention par IDCC
    let conventionKey = null;
    
    for (const [key, convention] of Object.entries(data)) {
      if (convention.idcc === idcc) {
        conventionKey = key;
        break;
      }
    }
    
    if (!conventionKey) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }
    
    // Vérifier si la section existe déjà
    if (data[conventionKey].sections[sectionName]) {
      return res.status(400).json({ error: "Une section avec ce nom existe déjà" });
    }
    
    // Créer une sauvegarde du fichier avant la modification
    const backupPath = path.join(process.cwd(), 'backup', `data-${Date.now()}.json`);
    
    // S'assurer que le répertoire de sauvegarde existe
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Écrire la sauvegarde
    await fs.promises.writeFile(backupPath, jsonData);
    
    // Ajouter la nouvelle section
    data[conventionKey].sections[sectionName] = {
      section: sectionTitle,
      contenu: content
    };
    
    // Écrire les données mises à jour
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: "Section ajoutée avec succès",
      backupPath: backupPath
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la section:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout de la section" });
  }
});

/**
 * Supprimer une section d'une convention
 */
router.delete('/convention/:idcc/section/:sectionName', async (req, res) => {
  try {
    const { idcc, sectionName } = req.params;
    const decodedSectionName = decodeURIComponent(sectionName);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ error: "Le fichier data.json n'existe pas" });
    }
    
    // Lire le fichier
    const jsonData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(jsonData) as ConventionDataJSON;
    
    // Trouver la convention par IDCC
    let conventionKey = null;
    
    for (const [key, convention] of Object.entries(data)) {
      if (convention.idcc === idcc) {
        conventionKey = key;
        break;
      }
    }
    
    if (!conventionKey) {
      return res.status(404).json({ error: "Convention non trouvée" });
    }
    
    // Vérifier si la section existe
    if (!data[conventionKey].sections[decodedSectionName]) {
      return res.status(404).json({ error: "Section non trouvée" });
    }
    
    // Créer une sauvegarde du fichier avant la modification
    const backupPath = path.join(process.cwd(), 'backup', `data-${Date.now()}.json`);
    
    // S'assurer que le répertoire de sauvegarde existe
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Écrire la sauvegarde
    await fs.promises.writeFile(backupPath, jsonData);
    
    // Supprimer la section
    delete data[conventionKey].sections[decodedSectionName];
    
    // Écrire les données mises à jour
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: "Section supprimée avec succès",
      backupPath: backupPath
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la section:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de la section" });
  }
});

/**
 * Endpoint pour vider le cache d'une section spécifique (régénération forcée)
 */
router.delete('/cache/clear', async (req, res) => {
  try {
    const { conventionId, sectionType } = req.body;
    
    if (!conventionId || !sectionType) {
      return res.status(400).json({ 
        error: "Les paramètres conventionId et sectionType sont requis" 
      });
    }
    
    console.log(`Suppression du cache pour la convention ${conventionId}, section ${sectionType}`);
    
    // Importer le service OpenAI pour accéder au cache
    const openaiModule = await import('../services/openai');
    
    // Vider le cache OpenAI pour cette section
    if (typeof openaiModule.clearCacheForSection === 'function') {
      await openaiModule.clearCacheForSection(conventionId, sectionType);
    }
    
    // Supprimer aussi de la base de données si nécessaire
    try {
      const { db } = await import('../../db');
      const { conventionSections } = await import('../../db/schema');
      const { eq, and } = await import('drizzle-orm');
      
      await db.delete(conventionSections)
        .where(and(
          eq(conventionSections.conventionId, conventionId),
          eq(conventionSections.sectionType, sectionType)
        ));
      
      console.log(`Cache BDD supprimé pour convention ${conventionId}, section ${sectionType}`);
    } catch (dbError) {
      console.log("Pas de suppression BDD nécessaire:", dbError);
    }
    
    res.json({ 
      success: true, 
      message: `Cache vidé pour la convention ${conventionId}, section ${sectionType}` 
    });
    
  } catch (error) {
    console.error("Erreur lors de la suppression du cache:", error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression du cache",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;