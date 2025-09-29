import {
  useRef,
  useEffect,
  useState,
  forwardRef,
} from "react";
import type { ReactNode } from "react";
import HTMLFlipBook from "react-pageflip";
import type { PageFlip } from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


// ---------- Props ----------
interface PagePaperProps {
  children?: ReactNode; // 👈 aquí lo volvemos opcional
}

interface BookViewerProps {
  file?: string;
}


// ---------- PagePaper ----------
const PagePaper = forwardRef<HTMLDivElement, PagePaperProps>(
  ({ children }, ref) => (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  )
);

// ---------- Componente principal ----------
export default function BookViewer({ file = "/libro.pdf" }: BookViewerProps) {
  // 👇 usamos any para que no falle TS con react-pageflip
  const flipRef = useRef<any>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(1100);
  const [aspect, setAspect] = useState<number>(0.65);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // medir relación real del PDF
  const onFirstPageLoad = (page: PDFPageProxy) => {
    const w = page.view[2] - page.view[0];
    const h = page.view[3] - page.view[1];
    if (w > 0 && h > 0) setAspect(h / w);
  };

  const onDocLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
    setCurrentPage(0);
  };
  

  const doResize = () => {
    if (!shellRef.current || !viewerRef.current) return;
    const shell = shellRef.current.getBoundingClientRect();

    let availW = Math.max(220, Math.floor(shell.width - 128));
    let availH = Math.max(180, Math.floor(shell.height - 80));

    if (isPortrait) {
      [availW, availH] = [availH, availW];
    }

    let width = Math.min(availW, Math.round(availH / aspect));
    let height = Math.round(width * aspect);
    if (height > availH) {
      height = availH;
      width = Math.round(height / aspect);
    }

    setPageWidth(width);
  };

  useEffect(() => {
    const mm = window.matchMedia("(orientation: portrait)");
    const applyOrientation = () => setIsPortrait(mm.matches);
    applyOrientation();
    mm.addEventListener("change", applyOrientation);

    doResize();
    window.addEventListener("resize", doResize);

    return () => {
      mm.removeEventListener("change", applyOrientation);
      window.removeEventListener("resize", doResize);
    };
  }, [aspect]);

  useEffect(() => {
    doResize();
  }, [isPortrait]);

  const pageHeight = Math.round(pageWidth * aspect);

  // Navegación
  const goPrev = () => {
  flipRef.current?.pageFlip().flipPrev();
};

const goNext = () => {
  flipRef.current?.pageFlip().flipNext();
};


  const onFlip = (e: { data: number }) => setCurrentPage(e.data);
  //Girar telefono 
  const [showRotateHint, setShowRotateHint] = useState(false);

  useEffect(() => {
  const mm = window.matchMedia("(orientation: portrait)");
  const applyOrientation = () => {
    if (mm.matches) {
      setShowRotateHint(true);
      // ocultar después de 2 segundos
      setTimeout(() => setShowRotateHint(false), 2000);
    } else {
      setShowRotateHint(false);
    }
    setIsPortrait(mm.matches);
  };

  applyOrientation();
  mm.addEventListener("change", applyOrientation);

  return () => {
    mm.removeEventListener("change", applyOrientation);
  };
}, []);



  return (
    <div className="book-shell" ref={shellRef}>
      {showRotateHint && (
        <div className="rotate-hint">
          <div className="rotate-icon">📱</div>
          <p className="rotate-text">Gira tu teléfono</p>
        </div>
      )}


      <div
        className={`flip-wrap ${isPortrait ? "force-landscape" : ""}`}
        ref={viewerRef}
        style={{
          ["--book-w" as any]: `${pageWidth}px`,
          ["--book-h" as any]: `${pageHeight}px`,
        }}
      >
        {/* Flechas */}
        <button className="nav-arrow nav-arrow-left" onClick={goPrev}>
  ←
</button>
<button className="nav-arrow nav-arrow-right" onClick={goNext}>
  →
</button>


        <div className="book-viewer-pdf">
          <Document
            file={file}
            onLoadSuccess={onDocLoad}
            onLoadError={(e) => console.error("PDF error:", e)}
            loading={<div className="p-4 text-center">Cargando PDF…</div>}
          >
            {isLoaded && numPages && (
              <HTMLFlipBook
                ref={flipRef}
                className="book shadow"
                width={pageWidth}
                height={pageHeight}
                singlePage={true}
                size="fixed"
                drawShadow
                maxShadowOpacity={0.15}
                useMouseEvents
                mobileScrollSupport
                disableFlipByClick={true}
                clickEventForward={true}
                showPageCorners={false}
                onFlip={onFlip}
                //startPage={currentPage}
                style={{ margin: "0 auto" }}
              >
                {Array.from({ length: numPages }, (_, i) => {
                  if (i < currentPage - 2 || i > currentPage + 2) {
                    return <PagePaper key={i} />; // placeholder vacío
                  }
                  return (
                    <PagePaper key={i}>
                      <Page
                        pageNumber={i + 1}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={i === 0 ? onFirstPageLoad : undefined}
                        className="book-page"
                      />
                    </PagePaper>
                  );
                })}

              </HTMLFlipBook>
            )}
          </Document>
        </div>
      </div>

      {isLoaded && numPages && (
        <div className="page-indicator page-indicator-top">
          Página {currentPage + 1} de {numPages}
        </div>
      )}
    </div>
  );
}
