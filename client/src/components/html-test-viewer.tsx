import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface HtmlTestViewerProps {
  conventionId: string;
  sectionType: string;
  onClose?: () => void;
}

interface ConversionResult {
  html: string;
  css: string;
  markdown: string;
  toc?: string;
  section: {
    id: string;
    title: string;
    content: string;
  };
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
  const { data: conversion, isLoading, error, refetch } = useQuery({
    queryKey: ['html-conversion', conventionId, sectionType],
    queryFn: async (): Promise<ConversionResult> => {
      const response = await axios.get(`/api/test/html-conversion/${conventionId}/${sectionType}`);
      return response.data;
    },
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <span className="ml-2 text-green-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Erreur lors du chargement du contenu. 
          <Button onClick={() => refetch()} size="sm" variant="outline" className="ml-2">
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!conversion) return null;

  return (
    <div className="mb-0">
      <style dangerouslySetInnerHTML={{ __html: conversion.css }} />
      <div 
        className="legal-document w-full border-0"
        style={{ maxWidth: '100%', width: '100%', overflowX: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: conversion.html }} 
      />
    </div>
  );
}