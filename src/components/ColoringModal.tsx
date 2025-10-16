import { useEffect, useRef, useState } from "react";
import "../styles/ColoringModal.scss";

interface ColoringModalProps {
  id: string;
  onClose: () => void;
}

export default function ColoringModal({ id, onClose }: ColoringModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [fillColor, setFillColor] = useState("#ff0000");
  const [showFullPalette, setShowFullPalette] = useState(false);

  // 🖼️ Imagen base
  const imageSrc = "/img/cartillas/jardin/1.svg";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      setCtx(context);
    }
  }, []);

  useEffect(() => {
    if (ctx) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
        setImageLoaded(true);
      };
    }
  }, [ctx]);

  // 🎨 Flood fill (relleno tipo Paint)
 const floodFill = (x: number, y: number, fillColor: string) => {
  if (!ctx) return;
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const stack: [number, number][] = [[x, y]];
  const startPos = (y * width + x) * 4;
  const targetColor = data.slice(startPos, startPos + 3);

  const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const [rF, gF, bF] = hexToRgb(fillColor);

  const colorMatch = (pos: number) => {
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const tolerance = 40; // 🔹 margen de tolerancia
    return (
      Math.abs(r - targetColor[0]) < tolerance &&
      Math.abs(g - targetColor[1]) < tolerance &&
      Math.abs(b - targetColor[2]) < tolerance
    );
  };

  let processed = 0;
  const maxPixels = 1000000; // 🔹 evita bloquear el navegador

  while (stack.length && processed < maxPixels) {
    let [px, py] = stack.pop()!;
    let currentPos = (py * width + px) * 4;

    // Sube hasta encontrar límite
    while (py >= 0 && colorMatch(currentPos)) {
      py--;
      currentPos -= width * 4;
    }

    py++;
    currentPos += width * 4;
    let reachLeft = false;
    let reachRight = false;

    while (py < height && colorMatch(currentPos)) {
      // Pinta píxel
      data[currentPos] = rF;
      data[currentPos + 1] = gF;
      data[currentPos + 2] = bF;
      data[currentPos + 3] = 255;
      processed++;

      if (processed > maxPixels) break;

      if (px > 0) {
        if (colorMatch(currentPos - 4)) {
          if (!reachLeft) {
            stack.push([px - 1, py]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (px < width - 1) {
        if (colorMatch(currentPos + 4)) {
          if (!reachRight) {
            stack.push([px + 1, py]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      py++;
      currentPos += width * 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

  // 🖱️ Click en canvas → rellena zona
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx || !imageLoaded) return;
    const rect = ctx.canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * ctx.canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * ctx.canvas.height);
    floodFill(x, y, fillColor);
  };

  // 💾 Descargar imagen
  const downloadDrawing = () => {
    if (!ctx) return;
    const link = document.createElement("a");
    link.download = "mi_coloreo.png";
    link.href = ctx.canvas.toDataURL("image/png");
    link.click();
  };

  // 🧹 Limpiar (recarga imagen)
  const clearDrawing = () => {
    if (!ctx) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };
  };

  const basicColors = [
    "#000000",
    "#ff0000",
    "#00a651",
    "#0072ff",
    "#ff9900",
    "#ffff00",
    "#ff00ff",
    "#a52a2a",
  ];

  const fullPalette = [
    "#000000", "#444444", "#666666", "#999999", "#cccccc", "#ffffff",
    "#ff0000", "#ff6666", "#cc0000", "#990000", "#660000", "#330000",
    "#ff7f00", "#ff9933", "#cc6600", "#ffcc99", "#663300", "#331a00",
    "#ffff00", "#ffea00", "#cccc00", "#999900", "#666600", "#333300",
    "#00ff00", "#00cc00", "#009900", "#006600", "#003300", "#99ff99",
    "#00ffff", "#00cccc", "#009999", "#006666", "#003333", "#ccffff",
    "#0000ff", "#3333ff", "#0000cc", "#000099", "#000066", "#6666ff",
    "#ff00ff", "#cc00cc", "#990099", "#660066", "#330033", "#ff99ff",
  ];

  return (
    <div className="modal-overlay">
      <div className="large-modal">
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2>🎨 Colorea con un clic</h2>
        <p>Selecciona un color y haz clic en la zona que quieras rellenar.</p>

        {/* Paleta */}
        <div className="palette">
          {basicColors.map((color) => (
            <button
              key={color}
              className="color-btn"
              style={{
                backgroundColor: color,
                border: fillColor === color ? "3px solid #333" : "2px solid #ccc",
              }}
              onClick={() => setFillColor(color)}
            />
          ))}

          <button
            className="more-colors-btn"
            onClick={() => setShowFullPalette(!showFullPalette)}
          >
            🎨 Más colores
          </button>
        </div>

        {showFullPalette && (
          <div className="expanded-palette">
            {fullPalette.map((color) => (
              <div
                key={color}
                className="color-square"
                style={{
                  backgroundColor: color,
                  border: fillColor === color ? "2px solid #000" : "1px solid #ccc",
                }}
                onClick={() => {
                  setFillColor(color);
                  setShowFullPalette(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="coloring-area">
          <canvas
            ref={canvasRef}
            className="coloring-canvas"
            width={1100}
            height={500}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Botones */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button className="modal-btn" onClick={clearDrawing}>🧹 Limpiar</button>
          <button className="modal-btn" onClick={downloadDrawing}>💾 Descargar</button>
        </div>
      </div>
    </div>
  );
}
