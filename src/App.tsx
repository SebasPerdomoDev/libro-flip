import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.scss";
import BookViewer from "./components/BookViewer";

export default function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* ✅ Libro basado en imágenes */}
      <BookViewer totalPages={154} basePath="/img/cartillas/jardin/page-" />
    </div>
  );
}
