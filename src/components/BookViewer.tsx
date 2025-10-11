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
import { Maximize2, Minimize2 } from "lucide-react"; // ✅ Iconos para vista
import ColoringModal from "./ColoringModal"; // 🎨 Modal de colorear

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

/* ---------- Props ---------- */
interface PagePaperProps {
  children?: ReactNode;
}
interface BookViewerProps {
  file?: string;
}

/* ---------- Contenedor de página ---------- */
const PagePaper = forwardRef<HTMLDivElement, PagePaperProps>(
  ({ children }, ref) => (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  )
);

/* ---------- Componente principal ---------- */
export default function BookViewer({
  file = "/libros/JARDIN.pdf",
}: BookViewerProps) {
  const flipRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(0.65);
  const [pageWidth, setPageWidth] = useState(1100);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // ✅ Estado para vista doble / una página
  const [viewMode, setViewMode] = useState<"single" | "double">("double");
  const [reloading, setReloading] = useState(false);

  /* 🎨 Modal */
  const [showActivity, setShowActivity] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);

  const openModal = (id: string) => {
    setActivityId(id);
    setShowActivity(true);
  };

  const closeModal = () => {
    setShowActivity(false);
    setActivityId(null);
  };

  /* --- Detectar proporciones del PDF --- */
  const onFirstPageLoad = useCallback((page: PDFPageProxy) => {
    const w = page.view[2] - page.view[0];
    const h = page.view[3] - page.view[1];
    if (w > 0 && h > 0) setAspect(h / w);
  }, []);

  const onDocLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
  };

  /* --- Resize responsivo --- */
  const doResize = useCallback(() => {
    if (!shellRef.current) return;
    const shell = shellRef.current.getBoundingClientRect();
    const availW = Math.max(300, shell.width - 220);
    const availH = Math.max(200, shell.height - 160);
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

  /* --- Dimensiones visuales del libro --- */
  const renderScale = 1;
  const visualZoom = isMobile ? 0.75 : 0.82;
  const bookW = Math.round(pageWidth * renderScale);
  const bookH = Math.round(bookW * aspect);

  /* ============================
     🧩  Zonas interactivas
  ============================ */
  interface InteractiveZone {
    id: string;
    top: string;
    left: string;
    width: string;
    height: string;
  }

  const interactiveZones: Record<number, InteractiveZone[]> = {
    1: [
      {
        id: "actividad-oso",
        top: "50%",
        left: "50%",
        width: "30%",
        height: "30%",
      },
    ],
  };

  /* ---------- Navegación ---------- */
  const goPrev = useCallback(() => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage > 0) api.flipPrev();
  }, [currentPage]);

  const goNext = useCallback(() => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage < numPages - 1) api.flipNext();
  }, [currentPage, numPages]);

  const onFlip = useCallback((e: { data: number }) => setCurrentPage(e.data), []);

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

  // --- click fuera del buscador ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editing &&
        indicatorRef.current &&
        !indicatorRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing]);

  const pagesToRender = useMemo(() => {
    if (!numPages) return [];
    return [currentPage - 1, currentPage, currentPage + 1].filter(
      (i) => i >= 0 && i < numPages
    );
  }, [currentPage, numPages]);

  /* =========================================================
     💡 Cambiar modo de vista (con reload controlado)
  ========================================================= */
  const toggleToDouble = () => {
    if (viewMode !== "double") {
      setReloading(true);
      setViewMode("double");
    }
  };

  const toggleToSingle = () => {
    if (viewMode !== "single") {
      setReloading(true);
      setViewMode("single");
    }
  };

  // Mantener la misma página tras cambio de modo
  useEffect(() => {
    if (flipRef.current?.pageFlip && numPages > 0) {
      const api = flipRef.current.pageFlip();
      if (api) api.turnToPage(currentPage);
    }
  }, [viewMode]);

  /* =========================================================
     🖼️ Render principal
  ========================================================= */
  return (
    <>
      <div className="book-shell" ref={shellRef}>
        {/* ✅ Botones para cambiar vista */}
        <div className="book-mode-toggle">
          <button
            className={`mode-btn ${viewMode === "double" ? "active" : ""}`}
            onClick={toggleToDouble}
            title="Vista doble página"
          >
            <Maximize2 size={18} />
          </button>
          <button
            className={`mode-btn ${viewMode === "single" ? "active" : ""}`}
            onClick={toggleToSingle}
            title="Vista una sola página"
          >
            <Minimize2 size={18} />
          </button>
        </div>

        {/* 🧾 Contenedor principal */}
        <div
          className={`flip-wrap ${isPortrait ? "force-landscape" : ""}`}
          ref={viewerRef}
          style={
            {
              ["--book-w" as any]: `${bookW}px`,
              ["--book-h" as any]: `${bookH}px`,
              ["--zoom" as any]: visualZoom,
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
                  {reloading && (
                    <div className="book-loading">
                      <p>Cargando vista...</p>
                    </div>
                  )}

                  <HTMLFlipBook
                    key={viewMode}
                    ref={flipRef}
                    className="book shadow"
                    width={bookW}
                    height={bookH}
                    size="fixed"
                    usePortrait={viewMode === "single"}
                    drawShadow
                    useMouseEvents={false}
                    disableFlipByClick={true}
                    clickEventForward={true}
                    showPageCorners={false}
                    onFlip={onFlip}
                    style={{
                      margin: "0 auto",
                      opacity: reloading ? 0 : 1,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {Array.from({ length: numPages }, (_, i) => (
                      <PagePaper key={i}>
                        {pagesToRender.includes(i) && (
                          <div className="page-container">
                            <Page
                              pageNumber={i + 1}
                              width={bookW}
                              scale={1.5}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              onLoadSuccess={() => {
                                // 👇 Espera a que las páginas se dibujen antes de mostrar
                                if (i === currentPage) {
                                  setTimeout(() => {
                                    setReloading(false);
                                    const api = flipRef.current?.pageFlip?.();
                                    if (api) api.turnToPage(currentPage);
                                  }, 200);
                                }
                              }}
                              className="book-page"
                            />
                            {interactiveZones[i + 1]?.map((zone) => (
                              <div
                                key={zone.id}
                                className="click-zone"
                                style={zone}
                                onClick={() => openModal(zone.id)}
                              />
                            ))}
                          </div>
                        )}
                      </PagePaper>
                    ))}
                  </HTMLFlipBook>

                </>
              )}
            </Document>
          </div>
        </div>

        {/* ✅ Flechas fuera del contenedor */}
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

        {/* Indicador de página */}
        {isLoaded && numPages > 0 && (
          <div
            ref={indicatorRef}
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

      {/* 🎨 Modal de colorear */}
      {showActivity && activityId && (
        <ColoringModal id={activityId} onClose={closeModal} />
      )}
    </>
  );
}
