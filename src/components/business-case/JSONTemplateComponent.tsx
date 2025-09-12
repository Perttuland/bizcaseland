import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import the JSON template string
import { JSONTemplate as JSONTemplateString } from './JSONTemplate';

export function JSONTemplateComponent() {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSONTemplateString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Template Copied",
        description: "JSON template has been copied to clipboard.",
        variant: "default",
      });
    } catch (err) {
      console.error('Failed to copy template:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy template to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className="flex items-center gap-2"
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Template Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Template
        </>
      )}
    </Button>
  );
}

// Also export a function to get the template string for download
export const downloadTemplate = () => {
  const blob = new Blob([JSONTemplateString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business-case-template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getTemplateString = () => JSONTemplateString;
