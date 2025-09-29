import {
  useRef,
  useEffect,
  useState,
  forwardRef,
} from "react";
import type { ReactNode } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/* ---------- Props ---------- */
interface PagePaperProps {
  children?: ReactNode;
}
interface BookViewerProps {
  file?: string;
}

/* ---------- PagePaper ---------- */
const PagePaper = forwardRef<HTMLDivElement, PagePaperProps>(
  ({ children }, ref) => (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  )
);

/* ---------- Componente principal ---------- */
export default function BookViewer({ file = "/libro.pdf" }: BookViewerProps) {
  const flipRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(1100);
  const [aspect, setAspect] = useState<number>(0.65);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  // detectar orientación y móvil
  useEffect(() => {
    const mmPortrait = window.matchMedia("(orientation: portrait)");
    const mmMobile = window.matchMedia("(max-width: 600px)");

    const applyOrientation = () => setIsPortrait(mmPortrait.matches);
    const applyMobile = () => setIsMobile(mmMobile.matches);

    applyOrientation();
    applyMobile();

    mmPortrait.addEventListener("change", applyOrientation);
    mmMobile.addEventListener("change", applyMobile);

    doResize();
    window.addEventListener("resize", doResize);

    return () => {
      mmPortrait.removeEventListener("change", applyOrientation);
      mmMobile.removeEventListener("change", applyMobile);
      window.removeEventListener("resize", doResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  useEffect(() => {
    doResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPortrait]);

  // dimensiones base
  const pageHeightRaw = Math.round(pageWidth * aspect);
  const mobileScale = isMobile ? 0.8 : 1;
  const bookW = Math.round(pageWidth * mobileScale);
  const bookH = Math.round(pageHeightRaw * mobileScale);

  // Navegación
  const goPrev = () => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage > 0) api.flipPrev();
  };
  const goNext = () => {
    const api = flipRef.current?.pageFlip?.();
    if (api && numPages && currentPage < numPages - 1) api.flipNext();
  };

  const onFlip = (e: { data: number }) => setCurrentPage(e.data);

  // estado de flechas
  const canGoPrev = currentPage > 0;
  const canGoNext = numPages ? currentPage < numPages - 1 : false;

  // Girar teléfono
  const [showRotateHint, setShowRotateHint] = useState(false);
  useEffect(() => {
    const mm = window.matchMedia("(orientation: portrait)");
    const applyOrientation = () => {
      if (mm.matches) {
        setShowRotateHint(true);
        setTimeout(() => setShowRotateHint(false), 1600);
      } else {
        setShowRotateHint(false);
      }
      setIsPortrait(mm.matches);
    };
    applyOrientation();
    mm.addEventListener("change", applyOrientation);
    return () => mm.removeEventListener("change", applyOrientation);
  }, []);

  // 👇 Forzar siempre modo single page centrado
  useEffect(() => {
    if (isLoaded && flipRef.current) {
      const api = flipRef.current.pageFlip();
      if (api) {
        api.setOrientation("portrait"); // truco: fuerza single page
      }
    }
  }, [isLoaded]);
  

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
          ["--book-w" as any]: `${bookW}px`,
          ["--book-h" as any]: `${bookH}px`,
        }}
      >
        <div className="book-viewer-pdf">
          <Document
            file={file}
            onLoadSuccess={onDocLoad}
            onLoadError={(e) => console.error("PDF error:", e)}
            loading={<div className="p-4 text-center">Cargando PDF…</div>}
          >
            {isLoaded && numPages && (
              <>
                {numPages > 1 && (
                  <>
                    <button
                      className="nav-arrow nav-arrow-left"
                      onClick={goPrev}
                      disabled={!canGoPrev}
                    >
                      ←
                    </button>
                    <button
                      className="nav-arrow nav-arrow-right"
                      onClick={goNext}
                      disabled={!canGoNext}
                    >
                      →
                    </button>
                  </>
                )}

                <HTMLFlipBook
                  ref={flipRef}
                  className="book shadow"
                  width={bookW}
                  height={bookH}
                  singlePage={true}
                  usePortrait={false}
                  size="fixed"
                  drawShadow
                  maxShadowOpacity={0.15}
                  useMouseEvents
                  mobileScrollSupport
                  disableFlipByClick={true}
                  clickEventForward={true}
                  showPageCorners={false}
                  onFlip={onFlip}
                  style={{ margin: "0 auto" }}
                >
                  {Array.from({ length: numPages }, (_, i) => {
                    if (i < currentPage - 2 || i > currentPage + 2) {
                      return <PagePaper key={i} />;
                    }
                    return (
                      <PagePaper key={i}>
                        <Page
                          pageNumber={i + 1}
                          width={bookW}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={i === 0 ? onFirstPageLoad : undefined}
                          className="book-page"
                        />
                      </PagePaper>
                    );
                  })}
                </HTMLFlipBook>
              </>
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
