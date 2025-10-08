import { useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import "../styles/ColoringModal.scss";

interface ColoringModalProps {
  id: string;
  onClose: () => void;
}

export default function ColoringModal({ id, onClose }: ColoringModalProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);


  // 🔹 Ruta fija de la imagen que quieres colorear
  const imageSrc = "/img/cartillas/jardin/1.png";

  // 🧹 Limpiar el dibujo
  const clearDrawing = () => {
    canvasRef.current?.clearCanvas();
  };

  // 💾 (opcional) Guardar dibujo como imagen
  const saveDrawing = async () => {
    const dataUrl = await canvasRef.current?.exportImage("png");
    if (dataUrl) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "mi_dibujo.png";
      link.click();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🎨 Actividad para colorear</h2>
        <p>Haz clic y pinta libremente sobre la imagen</p>

        <div
          style={{
            position: "relative",
            width: "600px",
            height: "400px",
            margin: "0 auto 16px auto",
            backgroundColor: "#fff",
          }}
        >
          {/* Imagen base */}
          <img
            src={imageSrc}
            alt="Para colorear"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 1,
            }}
          />

          {/* Canvas de dibujo encima */}
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            strokeColor="#000000"
            width="600px"
            height="400px"
            style={{
              border: "2px solid #ccc",
              borderRadius: "8px",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 2,
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button className="modal-btn" onClick={clearDrawing}>
            🧹 Limpiar
          </button>
          <button className="modal-btn" onClick={saveDrawing}>
            💾 Guardar
          </button>
          <button className="modal-btn" onClick={onClose}>
            ❌ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
