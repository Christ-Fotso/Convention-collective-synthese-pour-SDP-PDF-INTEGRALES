import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface EnhancedTableWrapperProps {
  children: React.ReactNode;
}

export const EnhancedTableWrapper: React.FC<EnhancedTableWrapperProps> = ({ children }) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Vérifier si le tableau est plus large que son conteneur
  useEffect(() => {
    const checkTableWidth = () => {
      if (tableContainerRef.current) {
        const containerWidth = tableContainerRef.current.clientWidth;
        const table = tableContainerRef.current.querySelector('table');
        
        if (table) {
          const tableWidth = table.offsetWidth;
          setIsWide(tableWidth > containerWidth);
          setShowScrollIndicator(tableWidth > containerWidth);
        }
      }
    };

    // Exécuter la vérification après le rendu
    checkTableWidth();
    
    // Ré-vérifier quand la fenêtre est redimensionnée
    window.addEventListener('resize', checkTableWidth);
    
    return () => {
      window.removeEventListener('resize', checkTableWidth);
    };
  }, []);

  // Gérer le défilement pour masquer l'indicateur
  const handleScroll = () => {
    if (tableContainerRef.current && isWide) {
      const container = tableContainerRef.current;
      const scrollPercentage = container.scrollLeft / (container.scrollWidth - container.clientWidth);
      
      // Masquer l'indicateur quand on approche de la fin du défilement
      if (scrollPercentage > 0.8) {
        setShowScrollIndicator(false);
      } else if (!showScrollIndicator && scrollPercentage < 0.8) {
        setShowScrollIndicator(true);
      }
    }
  };
  
  return (
    <div className="relative mb-4 group">
      {/* Message pour les tableaux larges */}
      {isWide && (
        <div className="text-orange-600 text-xs mb-1 flex items-center">
          <span>👉 Tableau large - faites défiler horizontalement pour voir tout le contenu</span>
        </div>
      )}
      
      {/* Conteneur de tableau avec défilement horizontal amélioré */}
      <div 
        ref={tableContainerRef}
        className="overflow-x-auto pb-2 relative enhanced-table-scroll"
        onScroll={handleScroll}
        style={{
          // Style pour rendre la barre de défilement plus visible
          scrollbarWidth: 'thin',
          scrollbarColor: '#f97316 #feedc0',
        }}
      >
        {children}

        {/* Ombre pour indiquer du contenu caché à droite */}
        {isWide && (
          <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Indicateur de défilement */}
      {showScrollIndicator && isWide && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-orange-100 text-orange-800 p-1 rounded-l-md shadow-md animate-pulse pointer-events-none">
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};