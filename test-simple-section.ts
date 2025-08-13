import { multiSectionExtractor } from './server/services/multi-section-extractor';
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function quickTest() {
  console.log('🔬 TEST RAPIDE D\'UNE SECTION SIMPLE');
  
  // Test avec une convention plus petite
  const smallPdf = 'resultats_telechargements/complet_20250813_102543/1007_Métallurgie _ Thiers (Région de).pdf';
  
  if (!fs.existsSync(smallPdf)) {
    console.error('❌ PDF test introuvable');
    return;
  }
  
  try {
    const pdfBuffer = fs.readFileSync(smallPdf);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    console.log(`📄 Convention: IDCC 1007 - Métallurgie Thiers`);
    console.log(`📏 Taille: ${text.length} caractères (~${Math.ceil(text.length/4)} tokens)`);
    
    // Test rapide avec prompt simple pour informations générales seulement
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const simplePrompt = `# EXTRACTION SECTION TEST - INFORMATIONS GÉNÉRALES

Analysez cette convention collective et extrayez UNIQUEMENT les informations générales.
Répondez avec un JSON valide au format strict :

{
  "informations-generales": {
    "contenu": "[Informations extraites ou RAS]",
    "idcc": "[IDCC si trouvé]",
    "nom": "[Nom de la convention]",
    "champ-application": "[Champ d'application si trouvé]"
  }
}

RÈGLES:
- JSON valide uniquement
- Si aucune info : "RAS"
- Terminologie exacte`;

    console.log('🚀 Appel Gemini 2.5 Pro...');
    const startTime = Date.now();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { text: simplePrompt },
            { text: "\n\n=== TEXTE DE LA CONVENTION ===\n\n" + text }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 5000,
        responseMimeType: "application/json"
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ Réponse reçue en ${processingTime}ms`);
    
    if (response.text) {
      console.log('📋 Réponse Gemini:');
      console.log(response.text);
      
      try {
        const parsed = JSON.parse(response.text);
        console.log('✅ JSON valide reçu');
        console.log('📊 Structure:', Object.keys(parsed));
        
        if (parsed['informations-generales']) {
          const info = parsed['informations-generales'];
          console.log('🎯 Informations extraites:');
          console.log(`   IDCC: ${info.idcc || 'Non trouvé'}`);
          console.log(`   Nom: ${info.nom || 'Non trouvé'}`);
          console.log(`   Contenu: ${info.contenu?.substring(0, 100) || 'RAS'}...`);
        }
        
      } catch (e) {
        console.error('❌ Erreur parsing JSON:', e.message);
      }
    } else {
      console.error('❌ Pas de réponse de Gemini');
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

quickTest()
  .then(() => {
    console.log('\n✅ Test rapide terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });