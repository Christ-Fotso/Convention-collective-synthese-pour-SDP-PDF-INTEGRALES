import React from 'react';
import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";

interface LoadingAnimationProps {
  className?: string;
  message?: string;
  subMessage?: string;
}

export function LoadingAnimation({ 
  className, 
  message = "Analyse juridique en cours...", 
  subMessage = "Extraction des dispositions de la convention collective" 
}: LoadingAnimationProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="relative">
        <Spinner size="large" className="text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-primary">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{subMessage}</p>
      </div>
      
      <div className="mt-4 flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="h-2 w-2 rounded-full bg-primary/50"
            style={{ 
              animation: `bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`
            }} 
          />
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1.0);
            }
          }
        `
      }} />
    </div>
  );
}