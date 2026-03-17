import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SoftBackdrop from "./components/SoftBackdrop";
import Footer from "./components/Footer";
import LenisScroll from "./components/lenis";
import { Route, Routes } from "react-router-dom";
import Generator from "./pages/Generator";
import Result from "./pages/Result";
import MyGeneration from "./pages/MyGeneration";

function App() {
  return (
    <>
      <SoftBackdrop />
      <LenisScroll />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/result/:projectId" element={<Result />} />
        <Route path="/my-generation"  element={<MyGeneration/>} />
        <Route path="/my-generation"  element={<MyGeneration/>} />
      </Routes>

      <Footer />
    </>
  );
}
export default App;
