import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.scss";
import BookViewer from "./components/BookViewer.jsx";

export default function App() {
  return <BookViewer file="/libros/PRE-JARDIN.pdf" />;
}
