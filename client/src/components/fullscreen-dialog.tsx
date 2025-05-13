import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Maximize } from "lucide-react";
import { MarkdownTableWrapper } from '@/components/markdown-table-wrapper';

interface FullscreenDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  content: string;
}

export const FullscreenDialog: React.FC<FullscreenDialogProps> = ({ 
  isOpen, 
  setIsOpen, 
  title,
  content 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 h-full overflow-y-auto">
          <MarkdownTableWrapper content={content} />
        </div>
      </DialogContent>
    </Dialog>
  );
};