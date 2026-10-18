import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App";
import AppLayout from "./layouts/AppLayout";
import Menu from "./pages/MenuPage";
import AboutUsPage from "./pages/AboutUs";
import NotFoundPage from "./pages/NotFound";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<App />} />
          <Route path="/mesa/:tableId" element={<App />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
