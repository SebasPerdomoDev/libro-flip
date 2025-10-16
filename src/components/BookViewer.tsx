import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import type { ReactNode } from "react";
import HTMLFlipBook from "react-pageflip";
import { Maximize2, Minimize2 } from "lucide-react";
import ColoringModal from "./ColoringModal";

/* ---------- Props ---------- */
interface PagePaperProps {
  children?: ReactNode;
}
interface BookViewerProps {
  totalPages: number;
  basePath: string;
}

/* ---------- Página ---------- */
const PagePaper = memo(
  forwardRef<HTMLDivElement, PagePaperProps>(({ children }, ref) => (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  ))
);
PagePaper.displayName = "PagePaper";

/* ---------- Imagen optimizada ---------- */
const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible(true);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={visible ? src : ""}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.25s ease-out",
        transform: "translateZ(0)",
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
      }}
    />
  );
};

/* ---------- Componente principal ---------- */
export default function BookViewer({ totalPages, basePath }: BookViewerProps) {
  const flipRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const [aspect] = useState(0.7);
  const [pageWidth, setPageWidth] = useState(1100);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [viewMode, setViewMode] = useState<"single" | "double">("double");

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

  /* 📏 Resize */
  const doResize = useCallback(() => {
    if (!shellRef.current) return;
    const shell = shellRef.current.getBoundingClientRect();
    const availW = Math.max(300, shell.width - 220);
    const availH = Math.max(200, shell.height - 160);
    const newWidth = Math.min(availW, Math.round(availH / aspect));
    setPageWidth((prev) => (prev !== newWidth ? newWidth : prev));
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

  /* 📚 Lista de imágenes */
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => `${basePath}${i + 1}.webp`),
    [basePath, totalPages]
  );

  /* 👁️ Control de render */
  const visiblePages = useMemo(() => {
    if (viewMode === "single") return new Set(pages.map((_, i) => i));
    const prev = Math.max(currentPage - 1, 0);
    const next = Math.min(currentPage + 1, totalPages - 1);
    return new Set([prev, currentPage, next]);
  }, [currentPage, totalPages, viewMode, pages]);

  /* 🔄 Precarga siguiente página */
  useEffect(() => {
    const next = Math.min(currentPage + 1, totalPages - 1);
    const img = new Image();
    img.src = pages[next];
  }, [currentPage, pages, totalPages]);

  /* 🔍 Navegación */
  const goPrev = () => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage > 0) api.flipPrev();
  };
  const goNext = () => {
    const api = flipRef.current?.pageFlip?.();
    if (api && currentPage < totalPages - 1) api.flipNext();
  };
  const onFlip = (e: { data: number }) => setCurrentPage(e.data);

  const goToPage = (target: number) => {
    const api = flipRef.current?.pageFlip?.();
    if (!api || isNaN(target)) return;
    const index = Math.min(Math.max(target - 1, 0), totalPages - 1);
    api.turnToPage(index);
    setCurrentPage(index);
  };
  const handleSearch = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) {
      goToPage(num);
      setEditing(false);
    }
  };

  /* ⚙️ Mantener página actual al cambiar vista */
  useEffect(() => {
    const timer = setTimeout(() => {
      const api = flipRef.current?.pageFlip?.();
      if (api && typeof api.turnToPage === "function") {
        api.turnToPage(currentPage);
      }
    }, 200); // pequeño delay tras reconstrucción del flipbook
    return () => clearTimeout(timer);
  }, [viewMode, currentPage]);

  const visualZoom = useMemo(() => {
    if (isMobile) return 0.85;
    return viewMode === "single" ? 1.0 : 0.85;
  }, [isMobile, viewMode]);

  const bookW = Math.round(pageWidth);
  const bookH = Math.round(bookW * aspect);

  /* ---------- Render ---------- */
  return (
    <>
      <div className="book-shell" ref={shellRef}>
        {/* 🔘 Botones de vista */}
        <div className="book-mode-toggle">
          <button
            className={`mode-btn ${viewMode === "double" ? "active" : ""}`}
            onClick={() => setViewMode("double")}
            title="Vista doble página"
          >
            <Maximize2 size={18} />
          </button>
          <button
            className={`mode-btn ${viewMode === "single" ? "active" : ""}`}
            onClick={() => setViewMode("single")}
            title="Vista una sola página"
          >
            <Minimize2 size={18} />
          </button>
        </div>

        {/* 📖 Libro */}
        <div
          className={`flip-wrap ${isPortrait ? "force-landscape" : ""}`}
          style={{
            ["--book-w" as any]: `${bookW}px`,
            ["--book-h" as any]: `${bookH}px`,
            ["--zoom" as any]: visualZoom,
          } as any}
        >
          <HTMLFlipBook
            key={viewMode}
            ref={flipRef}
            className="book shadow"
            width={bookW}
            height={bookH}
            size="fixed"
            usePortrait={viewMode === "single"}
            drawShadow
            maxShadowOpacity={0.4}
            flippingTime={550}
            showPageCorners={false}
            clickEventForward={false}
            mobileScrollSupport={false}
            onFlip={onFlip}
          >
            {pages.map((src, i) => (
              <PagePaper key={i}>
                <div className="page-container">
                  {visiblePages.has(i) ? (
                    <LazyImage src={src} alt={`Página ${i + 1}`} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#f5f5f5",
                      }}
                    />
                  )}
                </div>
              </PagePaper>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Flechas */}
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
          disabled={currentPage >= totalPages - 1}
        >
          →
        </button>

        {/* 📄 Indicador */}
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
            <>Página {currentPage + 1} de {totalPages}</>
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
      </div>

      {showActivity && activityId && (
        <ColoringModal id={activityId} onClose={closeModal} />
      )}
    </>
  );
}
