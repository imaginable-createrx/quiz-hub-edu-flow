
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  pdfUrl, 
  onLoadSuccess,
  onLoadError
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState<Error | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const documentRef = useRef<any>(null);

  useEffect(() => {
    // Reset state when PDF URL changes
    setNumPages(null);
    setPageNumber(1);
    setPdfError(null);
    setLoadingPdf(true);
  }, [pdfUrl]);

  // Handle PDF document loading
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPdfError(null);
    setLoadingPdf(false);
    onLoadSuccess?.();
    toast.success('PDF loaded successfully');
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(error);
    setLoadingPdf(false);
    onLoadError?.(error);
  };

  // Retry loading PDF if it fails
  useEffect(() => {
    if (pdfError && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Retrying PDF load (attempt ${retryCount + 1})...`);
        setRetryCount(prev => prev + 1);
        setPdfError(null);
        setLoadingPdf(true);
        
        // Force reload PDF component
        if (documentRef.current) {
          documentRef.current = null;
        }
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [pdfError, retryCount]);

  // PDF navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => {
    if (numPages) {
      setPageNumber(prev => Math.min(prev + 1, numPages));
    }
  };

  // Memoize options to avoid unnecessary re-renders
  const pdfOptions = React.useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/'
  }), []);

  if (pdfError && retryCount >= 3) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={32} className="mx-auto text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load PDF</p>
        <p className="text-sm text-muted-foreground mb-4">
          {pdfError.message || 'There was an error loading the PDF.'}
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">PDF URL: {pdfUrl}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mx-auto"
          >
            Reload Page
          </Button>
          <div className="mt-4">
            <Button 
              variant="secondary"
              onClick={() => {
                setRetryCount(0);
                setPdfError(null);
                setLoadingPdf(true);
              }}
              className="mx-auto"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <ScrollArea className="h-[600px] w-full rounded-md border bg-white">
        <div className="flex justify-center py-4">
          <Document
            ref={documentRef}
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="text-center py-12">
                <div className="mx-auto mb-4">
                  <Spinner size="lg" />
                </div>
                <p className="text-muted-foreground">Loading PDF...</p>
                <p className="text-xs text-muted-foreground mt-2">Attempt {retryCount + 1}</p>
              </div>
            }
            className="mx-auto"
            options={pdfOptions}
          >
            {!loadingPdf && (
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false} // Disable the text layer that's causing the error
                renderAnnotationLayer={true}
                scale={1.2}
                className="mx-auto shadow-md"
                error={
                  <div className="text-center p-4 bg-muted/20 rounded-md">
                    <AlertTriangle className="mx-auto text-amber-500 mb-2 h-8 w-8" />
                    <p>Error rendering page {pageNumber}</p>
                  </div>
                }
              />
            )}
          </Document>
        </div>
      </ScrollArea>
      
      {numPages && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1}
          >
            Previous Page
          </Button>
          <p className="text-sm">
            Page {pageNumber} of {numPages}
          </p>
          <Button 
            variant="outline" 
            onClick={goToNextPage} 
            disabled={pageNumber >= (numPages || 1)}
          >
            Next Page
          </Button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
