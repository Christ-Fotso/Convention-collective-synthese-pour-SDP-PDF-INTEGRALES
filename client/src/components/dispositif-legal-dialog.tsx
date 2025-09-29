import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from "lucide-react";
import { MarkdownTableWrapper } from '@/components/markdown-table-wrapper';

interface DispositifLegalDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  content: string;
}

export const DispositifLegalDialog: React.FC<DispositifLegalDialogProps> = ({ 
  isOpen, 
  setIsOpen, 
  title,
  content 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-green-600" />
            <span>Dispositif légal : {title}</span>
          </DialogTitle>
          <DialogDescription>
            Comparatif des dispositions légales applicables
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <MarkdownTableWrapper content={content} />
        </div>
      </DialogContent>
    </Dialog>
  );
};