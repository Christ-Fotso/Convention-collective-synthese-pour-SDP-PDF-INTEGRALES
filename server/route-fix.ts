// Route pour récupérer les types de sections disponibles pour une convention
apiRouter.get("/convention/:conventionId/section-types", async (req, res) => {
  try {
    const { conventionId } = req.params;
    
    if (!conventionId) {
      return res.status(400).json({
        message: "conventionId est requis"
      });
    }
    
    const existingConventions = getConventions();
    let convention = null;
    
    // Vérifier si on utilise un nom encodé comme identifiant
    if (conventionId.includes('%')) {
      try {
        // Décoder le nom de la convention
        const decodedName = decodeURIComponent(conventionId);
        console.log(`[routes] Recherche de convention par nom: "${decodedName}"`);
        
        // Rechercher la convention par son nom
        convention = existingConventions.find(conv => conv.name === decodedName);
        
        if (convention) {
          console.log(`[routes] Convention trouvée par nom: "${decodedName}"`);
        } else {
          console.log(`[routes] Convention non trouvée avec le nom: "${decodedName}"`);
          return res.status(404).json({
            message: "Convention non trouvée"
          });
        }
      } catch (decodeError) {
        console.error("[routes] Erreur de décodage du nom de convention:", decodeError);
        return res.status(400).json({
          message: "Identifiant de convention invalide"
        });
      }
    } else {
      // Rechercher par IDCC
      convention = existingConventions.find(conv => conv.id === conventionId);
      
      if (!convention) {
        return res.status(404).json({
          message: "Convention non trouvée"
        });
      }
    }
    
    // À ce stade, nous avons trouvé la convention, soit par son nom, soit par son IDCC
    // Récupérer les types de sections disponibles
    const sectionTypes = getSectionTypesByConvention(convention.id || conventionId);
    
    res.json(sectionTypes);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des types de sections:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des types de sections",
      error: error.message
    });
  }
});