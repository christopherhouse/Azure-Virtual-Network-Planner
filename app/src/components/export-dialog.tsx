'use client';

import { useState } from 'react';
import { Project, ExportFormat } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Download, Check } from 'lucide-react';
import { generateARMTemplate } from '@/lib/export-arm';
import { generateBicepTemplate } from '@/lib/export-bicep';
import { generateTerraformTemplate } from '@/lib/export-terraform';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function ExportDialog({ open, onOpenChange, project }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('bicep');
  const [copied, setCopied] = useState(false);

  const getTemplate = () => {
    switch (format) {
      case 'arm':
        return generateARMTemplate(project);
      case 'bicep':
        return generateBicepTemplate(project);
      case 'terraform':
        return generateTerraformTemplate(project);
      default:
        return '';
    }
  };

  const getFileExtension = () => {
    switch (format) {
      case 'arm':
        return 'json';
      case 'bicep':
        return 'bicep';
      case 'terraform':
        return 'tf';
    }
  };

  const getFileName = () => {
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${safeName}-vnet.${getFileExtension()}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTemplate());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const template = getTemplate();
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const template = getTemplate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Export Templates</DialogTitle>
          <DialogDescription>
            Export your VNet configuration as infrastructure-as-code templates.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={format}
          onValueChange={value => setFormat(value as ExportFormat)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="bicep">Bicep</TabsTrigger>
            <TabsTrigger value="arm">ARM (JSON)</TabsTrigger>
            <TabsTrigger value="terraform">Terraform</TabsTrigger>
          </TabsList>

          <TabsContent value={format} className="mt-4 flex-1 min-h-0 overflow-hidden">
            <div className="relative h-full">
              <pre className="p-4 bg-muted rounded-lg overflow-auto h-full max-h-[50vh] text-sm">
                <code>{template}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download {getFileName()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
