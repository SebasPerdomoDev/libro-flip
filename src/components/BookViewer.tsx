import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useMemo,
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

/* ---------- Page container ---------- */
const PagePaper = forwardRef<HTMLDivElement, PagePaperProps>(
  ({ children }, ref) => (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  )
);

/* ---------- Main component ---------- */
export default function BookViewer({ file = "/libro.pdf" }: BookViewerProps) {
  const flipRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(0.65);
  const [pageWidth, setPageWidth] = useState(1100);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  //const renderedCache = useRef<Record<number, HTMLCanvasElement>>({});

  /* --- Detect PDF aspect ratio --- */
  const onFirstPageLoad = useCallback((page: PDFPageProxy) => {
    const w = page.view[2] - page.view[0];
    const h = page.view[3] - page.view[1];
    if (w > 0 && h > 0) setAspect(h / w);
  }, []);

  const onDocLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
  };

  /* --- Resize handling --- */
  const doResize = useCallback(() => {
    if (!shellRef.current) return;
    const shell = shellRef.current.getBoundingClientRect();
    const availW = Math.max(220, shell.width - 80);
    const availH = Math.max(180, shell.height - 80);
    const w = Math.min(availW, Math.round(availH / aspect));
    setPageWidth(w);
  }, [aspect]);

  useEffect(() => {
    const mmPortrait = window.matchMedia("(orientation: portrait)");
    const mmMobile = window.matchMedia("(max-width: 600px)");
    const update = () => {
      setIsPortrait(mmPortrait.matches);
      setIsMobile(mmMobile.matches);
      doResize();
    };
    update();
    mmPortrait.addEventListener("change", update);
    mmMobile.addEventListener("change", update);
    window.addEventListener("resize", doResize);
    return () => {
      mmPortrait.removeEventListener("change", update);
      mmMobile.removeEventListener("change", update);
      window.removeEventListener("resize", doResize);
    };
  }, [doResize]);

  // Calcular dimensiones del libro en movil

const mobileZoom = isMobile ? 0.6 : 1; // 0.6 = 60% tamaño original
const bookW = Math.round(pageWidth * mobileZoom);
const bookH = Math.round(bookW * aspect);


  /* ---------- Animación al devolver ---------- */
  const goPrev = useCallback(() => {
    const api = flipRef.current?.pageFlip?.();
    if (!api || currentPage <= 0 || !viewerRef.current) return;

    const prevIndex = currentPage - 1;
    const wrap = viewerRef.current;

    // Crear overlay animado con tu imagen
    const overlay = document.createElement("div");
    overlay.className = "page-overlay";
    overlay.style.width = `${bookW}px`;
    overlay.style.height = `${bookH}px`;
    overlay.style.backgroundImage = "url('/content.png')";
    overlay.style.backgroundSize = "cover";
    overlay.style.backgroundPosition = "center";

    wrap.appendChild(overlay);

    // Forzar render antes de aplicar animación
    void overlay.offsetWidth;

    // Activar la animación
    overlay.classList.add("active");

    // Pasar la página en el punto medio
    setTimeout(() => {
      api.turnToPage(prevIndex);
    }, 800);

    // Quitar la hoja al terminar
    setTimeout(() => {
      overlay.remove();
    }, 1600);
  }, [currentPage, bookW, bookH]);

  /* ---------- Avanzar (motor nativo flip) ---------- */
  const goNext = useCallback(() => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage < numPages - 1) {
      api.flipNext();
    }
  }, [currentPage, numPages]);

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const goToPage = (target: number) => {
    const api = flipRef.current?.pageFlip?.();
    if (api && !isNaN(target)) {
      const index = Math.min(Math.max(target - 1, 0), numPages - 1);
      api.turnToPage(index);
      setCurrentPage(index);
    }
  };

  const handleSearch = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) {
      goToPage(num);
      setEditing(false);
    }
  };

  const pagesToRender = useMemo(() => {
    if (!numPages) return [];
    return [currentPage - 1, currentPage, currentPage + 1].filter(
      (i) => i >= 0 && i < numPages
    );
  }, [currentPage, numPages]);

  return (
    <div className="book-shell" ref={shellRef}>
      <div
        className={`flip-wrap ${isPortrait ? "force-landscape" : ""}`}
        ref={viewerRef}
        style={
          {
            ["--book-w" as any]: `${bookW}px`,
            ["--book-h" as any]: `${bookH}px`,
          } as any
        }
      >
        <div className="book-viewer-pdf">
          <Document
            file={file}
            onLoadSuccess={onDocLoad}
            loading={<div className="p-4 text-center">Cargando PDF…</div>}
          >
            {isLoaded && numPages > 0 && (
              <>
                <button
                  className="nav-arrow nav-arrow-left"
                  onClick={goPrev}
                  disabled={currentPage === 0}
                >
                  ←
                </button>
                <button
                  className="nav-arrow nav-arrow-right"
                  onClick={goNext}
                  disabled={currentPage >= numPages - 1}
                >
                  →
                </button>

                <HTMLFlipBook
                  ref={flipRef}
                  className="book shadow"
                  width={bookW}
                  height={bookH}
                  size="fixed"
                  drawShadow
                  useMouseEvents
                  disableFlipByClick={true}
                  clickEventForward={true}
                  showPageCorners={false}
                  onFlip={onFlip}
                  style={{ margin: "0 auto" }}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <PagePaper key={i}>
                      {pagesToRender.includes(i) && (
                        <Page
                          pageNumber={i + 1}
                          width={bookW}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={i === 0 ? onFirstPageLoad : undefined}
                          className="book-page"
                        />
                      )}
                    </PagePaper>
                  ))}
                </HTMLFlipBook>
              </>
            )}
          </Document>
        </div>
      </div>

      {isLoaded && numPages > 0 && (
        <div
          className="page-indicator page-indicator-top"
          onClick={() => {
            if (!editing) {
              setEditing(true);
              setInputValue("");
            }
          }}
        >
          {!editing ? (
            <>Página {currentPage + 1} de {numPages}</>
          ) : (
            <div className="page-search">
              <input
                className="page-input"
                type="number"
                placeholder="Ir a..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
              />
              <button className="page-search-btn" onClick={handleSearch}>
                🔍
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
