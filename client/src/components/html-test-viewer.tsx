import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Code, FileText, RotateCcw } from "lucide-react";
import axios from "axios";

interface HtmlTestViewerProps {
  conventionId: string;
  sectionType: string;
  onClose?: () => void;
}

interface ConversionResult {
  success: boolean;
  section: {
    id: string;
    title: string;
    conventionId: string;
    sectionType: string;
  };
  markdown: string;
  html: string;
  toc: string;
  css: string;
  stats: {
    characters: number;
    words: number;
    headings: number;
    tables: number;
    lists: number;
  };
  timestamp: string;
}

export function HtmlTestViewer({ conventionId, sectionType, onClose }: HtmlTestViewerProps) {
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Debug log pour vérifier que le composant est rendu
  console.log("HtmlTestViewer rendu avec:", { conventionId, sectionType });

  const { data: conversion, isLoading, error, refetch } = useQuery({
    queryKey: ['html-conversion', conventionId, sectionType],
    queryFn: async (): Promise<ConversionResult> => {
      const response = await axios.get(`/api/test/html-conversion/${conventionId}/${sectionType}`);
      return response.data;
    },
    enabled: isTestMode
  });

  const handleStartTest = () => {
    setIsTestMode(true);
  };

  const handleStopTest = () => {
    setIsTestMode(false);
    onClose?.();
  };

  if (!isTestMode) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Eye className="h-5 w-5" />
            Test de rendu HTML
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-3">
            Testez le nouveau rendu HTML enrichi pour cette section (mode test seulement).
          </p>
          <Button 
            onClick={handleStartTest} 
            size="sm" 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Eye className="h-4 w-4 mr-2" />
            Activer le test HTML
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-4 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-600">Conversion en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Erreur lors de la conversion HTML : {error instanceof Error ? error.message : 'Erreur inconnue'}
          <Button onClick={() => refetch()} size="sm" variant="outline" className="ml-2">
            <RotateCcw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!conversion) return null;

  return (
    <Card className="mb-4 border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Eye className="h-5 w-5" />
            Test HTML - {conversion.section.title}
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RotateCcw className="h-3 w-3 mr-1" />
              Recharger
            </Button>
            <Button onClick={handleStopTest} size="sm" variant="outline">
              Fermer le test
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">
            {conversion.stats.words} mots
          </Badge>
          <Badge variant="secondary">
            {conversion.stats.headings} titres
          </Badge>
          <Badge variant="secondary">
            {conversion.stats.tables} tableaux
          </Badge>
          <Badge variant="secondary">
            {conversion.stats.lists} listes
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="html" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Rendu HTML
            </TabsTrigger>
            <TabsTrigger value="markdown" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Markdown original
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <style dangerouslySetInnerHTML={{ __html: conversion.css }} />
              <div className="bg-white p-6 legal-document">
                {conversion.toc && (
                  <div dangerouslySetInnerHTML={{ __html: conversion.toc }} />
                )}
                <div dangerouslySetInnerHTML={{ __html: conversion.html }} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="markdown" className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {conversion.markdown}
            </pre>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96">
              <code>{conversion.html}</code>
            </pre>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note :</strong> Ceci est un mode test. Le rendu HTML n'affecte pas le système principal. 
            Vous pouvez revenir au rendu Markdown normal à tout moment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}