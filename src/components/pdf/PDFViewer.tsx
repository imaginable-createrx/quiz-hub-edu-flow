
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileX, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Create a stable reference to the Document component
  const documentRef = useRef<any>(null);
  
  // Direct download link for the PDF
  const handleDownloadPdf = () => {
    if (pdfUrl && !isPlaceholder) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfUrl.split('/').pop() || 'test-document.pdf';
      link.target = '_blank';
      link.click();
    }
  };

  // Reset component when PDF URL changes
  useEffect(() => {
    console.log('PDF URL changed:', pdfUrl);
    
    // Check if the URL is a placeholder or empty
    if (!pdfUrl || pdfUrl === '/placeholder.svg' || pdfUrl.includes('placeholder')) {
      setIsPlaceholder(true);
      setPdfError(new Error('No PDF file has been uploaded yet'));
      setLoadingPdf(false);
      onLoadError?.(new Error('No PDF file has been uploaded yet'));
      return;
    }

    // Reset state when PDF URL changes
    setNumPages(null);
    setPageNumber(1);
    setPdfError(null);
    setLoadingPdf(true);
    setIsPlaceholder(false);
    setShowFallback(false);
    setRetryCount(0);
    
    // Force reload PDF component
    if (documentRef.current) {
      documentRef.current = null;
    }
    
    console.log('Attempting to load PDF from:', pdfUrl);
  }, [pdfUrl, onLoadError]);

  // Handle PDF document loading
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPdfError(null);
    setLoadingPdf(false);
    setShowFallback(false);
    onLoadSuccess?.();
    toast.success('PDF loaded successfully');
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(error);
    setLoadingPdf(false);
    
    // Only trigger external error handler if we've exceeded retry attempts
    if (retryCount >= 2) {
      onLoadError?.(error);
    }
  };

  // Retry loading PDF if it fails
  useEffect(() => {
    if (pdfError && retryCount < 3 && !isPlaceholder && !showFallback) {
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
    } else if (pdfError && retryCount >= 3 && !showFallback) {
      setShowFallback(true);
    }
  }, [pdfError, retryCount, isPlaceholder, showFallback]);

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

  // Open the PDF in a new tab
  const openPdfInNewTab = () => {
    if (pdfUrl && !isPlaceholder) {
      window.open(pdfUrl, '_blank');
    }
  };

  // Manual retry function for user interaction
  const manualRetry = () => {
    setRetryCount(0);
    setPdfError(null);
    setLoadingPdf(true);
    setShowFallback(false);
    
    // Force document reload
    if (documentRef.current) {
      documentRef.current = null;
    }
    
    toast.info('Trying to load PDF again...');
  };

  // Render fallback for placeholder or error
  if (isPlaceholder) {
    return (
      <div className="bg-white rounded-md p-8 text-center">
        <FileX size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No PDF Available</h3>
        <p className="text-muted-foreground mb-6">
          The test PDF has not been uploaded yet or is unavailable.
        </p>
      </div>
    );
  }

  if (showFallback) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={32} className="mx-auto text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load PDF</p>
        <p className="text-sm text-muted-foreground mb-4">
          {pdfError?.message || 'There was an error loading the PDF. Try viewing it directly in your browser.'}
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground break-all max-w-full px-4">PDF URL: {pdfUrl}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={manualRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Retry Loading
            </Button>
            {!isPlaceholder && (
              <Button 
                variant="secondary"
                onClick={openPdfInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Open in Browser
              </Button>
            )}
            {!isPlaceholder && (
              <Button 
                variant="secondary"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </Button>
            )}
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
            {!loadingPdf && numPages !== null && (
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                scale={1.2}
                className="mx-auto shadow-md"
                error={
                  <div className="text-center p-4 bg-muted/20 rounded-md">
                    <AlertTriangle className="mx-auto text-amber-500 mb-2 h-8 w-8" />
                    <p>Error rendering page {pageNumber}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={manualRetry}
                    >
                      Retry
                    </Button>
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
          <div className="flex gap-2">
            <p className="text-sm">
              Page {pageNumber} of {numPages}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={openPdfInNewTab}
              title="Open PDF in new tab"
            >
              <ExternalLink size={16} />
            </Button>
          </div>
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
