import { ReactSketchCanvas } from "react-sketch-canvas";
import "../styles/ColoringModal.scss"; // 🧩 importa los estilos del modal

interface ColoringModalProps {
  id: string;
  onClose: () => void;
}

export default function ColoringModal({ id, onClose }: ColoringModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🎨 Actividad para colorear</h2>
        <p>Actividad: {id}</p>

        <ReactSketchCanvas
          style={{
            border: "2px solid #ccc",
            borderRadius: 8,
            marginBottom: "10px",
          }}
          strokeWidth={4}
          strokeColor="#000000"
          width="600px"
          height="400px"
        />

        <button className="modal-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
