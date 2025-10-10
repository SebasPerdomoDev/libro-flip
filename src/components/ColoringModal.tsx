import { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";
import "../styles/ColoringModal.scss";

interface ColoringModalProps {
  id: string;
  onClose: () => void;
}

export default function ColoringModal({ id, onClose }: ColoringModalProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showFullPalette, setShowFullPalette] = useState(false);

  // 🖼️ Imagen base
  const imageSrc = "/img/cartillas/jardin/1.png";

  // 🧹 Limpiar
  const clearDrawing = () => canvasRef.current?.clearCanvas();

  // 🩹 Borrar (color blanco)
  const activateEraser = () => setStrokeColor("#ffffff");

  // 💾 Descargar imagen combinada (fondo + dibujo)
  const downloadDrawing = async () => {
  if (!canvasRef.current) return;

  // 1️⃣ Obtiene la imagen combinada del canvas (solo los trazos)
  const drawing = await canvasRef.current.exportImage("png");

  // 2️⃣ Mide el tamaño real del área visible en el modal
  const area = document.querySelector(".coloring-area") as HTMLElement;
  if (!area) return;

  const rect = area.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  // 3️⃣ Crea un canvas del tamaño visible actual
  const base = document.createElement("canvas");
  base.width = width;
  base.height = height;

  const ctx = base.getContext("2d");
  if (!ctx) return;

  // 4️⃣ Dibuja la imagen base
  const img = new Image();
  img.src = imageSrc;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);

    // 5️⃣ Dibuja los trazos encima
    const drawingImg = new Image();
    drawingImg.src = drawing!;
    drawingImg.onload = () => {
      ctx.drawImage(drawingImg, 0, 0, width, height);

      // 6️⃣ Exporta al tamaño correcto (igual que el modal)
      const finalImage = base.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = finalImage;
      link.download = "mi_dibujo.png";
      link.click();
    };
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

        <h2>🎨 Actividad para colorear</h2>
        <p>Pinta, elige colores, borra y descarga tu dibujo</p>

        {/* Paleta */}
        <div className="palette">
          {basicColors.map((color) => (
            <button
              key={color}
              className="color-btn"
              style={{
                backgroundColor: color,
                border: strokeColor === color ? "3px solid #333" : "2px solid #ccc",
              }}
              onClick={() => setStrokeColor(color)}
            />
          ))}

          <button
            className="more-colors-btn"
            onClick={() => setShowFullPalette(!showFullPalette)}
          >
            🎨 Más colores
          </button>

          <input
            type="range"
            min="1"
            max="25"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="thickness-slider"
          />
        </div>

        {showFullPalette && (
          <div className="expanded-palette">
            {fullPalette.map((color) => (
              <div
                key={color}
                className="color-square"
                style={{
                  backgroundColor: color,
                  border: strokeColor === color ? "2px solid #000" : "1px solid #ccc",
                }}
                onClick={() => {
                  setStrokeColor(color);
                  setShowFullPalette(false);
                }}
              />
            ))}
          </div>
        )}

        {/* 🖼️ Imagen + Canvas */}
        <div className="coloring-area">
          <img
            src={imageSrc}
            alt="Para colorear"
            className="coloring-image"
          />

          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            canvasColor="transparent"
            className="coloring-canvas"
          />
        </div>

        {/* 🔘 Botones inferiores */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button className="modal-btn" onClick={clearDrawing}>🧹 Limpiar</button>
          <button className="modal-btn" onClick={activateEraser}>🩹 Borrar</button>
          <button className="modal-btn" onClick={downloadDrawing}>💾 Descargar</button>
          
        </div>
      </div>
    </div>
  );
}
