import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Hash, Tag } from "lucide-react";
import axios from "axios";
import { useLocation } from "wouter";

interface NafEntry {
  conventionId: string;
  conventionName: string;
  idcc: string;
  nafCodes: string[];
  sectors: string[];
}

interface NafSearchProps {
  onConventionSelect: (conventionId: string) => void;
}

export function NafSearch({ onConventionSelect }: NafSearchProps) {
  const [activeTab, setActiveTab] = useState("code");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<NafEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, navigate] = useLocation();

  // Récupérer les codes NAF disponibles
  const { data: nafCodes = [] } = useQuery({
    queryKey: ['/api/naf/codes'],
    queryFn: async () => {
      const response = await axios.get('/api/naf/codes');
      return response.data.codes;
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  // Récupérer les secteurs disponibles
  const { data: sectors = [] } = useQuery({
    queryKey: ['/api/naf/sectors'],
    queryFn: async () => {
      const response = await axios.get('/api/naf/sectors');
      return response.data.sectors;
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      let endpoint = '/api/naf/search?';
      
      switch (activeTab) {
        case 'code':
          endpoint += `code=${encodeURIComponent(searchTerm)}`;
          break;
        case 'sector':
          endpoint += `sector=${encodeURIComponent(searchTerm)}`;
          break;
        case 'keyword':
          endpoint += `keyword=${encodeURIComponent(searchTerm)}`;
          break;
      }

      const response = await axios.get(endpoint);
      setResults(response.data.results);
    } catch (error) {
      console.error('Erreur lors de la recherche NAF:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleConventionClick = (entry: NafEntry) => {
    // Naviguer vers la convention
    navigate(`/convention/${entry.conventionId}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Recherche par Code NAF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Code NAF
            </TabsTrigger>
            <TabsTrigger value="sector" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Secteur
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Mot-clé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 01.11A, 47.11F, 4711F..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchTerm.trim()}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {nafCodes.length > 0 && (
                <p>Codes NAF disponibles : {nafCodes.slice(0, 10).join(', ')}
                  {nafCodes.length > 10 && ` ... (+${nafCodes.length - 10} autres)`}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sector" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: agriculture, industrie, commerce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchTerm.trim()}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {sectors.length > 0 && (
                <div className="space-y-1">
                  <p>Secteurs disponibles :</p>
                  <div className="flex flex-wrap gap-1">
                    {sectors.map((sector: string) => (
                      <Badge
                        key={sector}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => setSearchTerm(sector)}
                      >
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="keyword" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: transport, bâtiment, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchTerm.trim()}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p>Recherche dans les noms de conventions et leurs contenus</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Résultats de recherche */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-lg">
              {results.length} convention{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((entry) => (
                <Card 
                  key={entry.conventionId}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => handleConventionClick(entry)}
                >
                  <div className="space-y-2">
                    <div className="font-medium text-green-600">
                      {entry.conventionName}
                    </div>
                    <div className="text-sm text-gray-600">
                      IDCC {entry.idcc}
                    </div>
                    {entry.nafCodes.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">Codes NAF:</span>
                        {entry.nafCodes.slice(0, 5).map((code) => (
                          <Badge key={code} variant="secondary" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                        {entry.nafCodes.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.nafCodes.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                    {entry.sectors.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">Secteurs:</span>
                        {entry.sectors.map((sector) => (
                          <Badge key={sector} variant="outline" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Recherche en cours...</p>
          </div>
        )}

        {!isSearching && results.length === 0 && searchTerm && (
          <div className="text-center py-4 text-gray-500">
            <p>Aucune convention trouvée pour "{searchTerm}"</p>
            <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}