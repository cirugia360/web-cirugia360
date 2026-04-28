import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContactModalProvider } from "@/components/ContactModalProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import Index from "./pages/Index";
import DoctorPage from "./pages/DoctorPage";
import ProceduresPage from "./pages/ProceduresPage";
import ResultsPage from "./pages/ResultsPage";
import TechnologyPage from "./pages/TechnologyPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlefaroplastiaPage from "./pages/BlefaroplastiaPage";
import LiftingPage from "./pages/LiftingPage";
import LiposuccionPage from "./pages/LiposuccionPage";
import MarcacionPage from "./pages/MarcacionPage";
import RhinoplastyPage from "./pages/RhinoplastyPage";
import SubcisionPage from "./pages/SubcisionPage";
import GenericProcedurePage from "./pages/GenericProcedurePage";
import Cirugia360Dashboard from "./pages/Cirugia360Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const scrollPositions = new Map<string, { x: number; y: number }>();

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollKey = location.key || `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) {
      return undefined;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    if (navigationType === "POP") {
      const position = scrollPositions.get(scrollKey) || { x: 0, y: 0 };

      window.requestAnimationFrame(() => {
        window.scrollTo(position.x, position.y);
      });

      window.setTimeout(() => {
        window.scrollTo(position.x, position.y);
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      scrollPositions.set(scrollKey, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };
  }, [navigationType, scrollKey]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <ContactModalProvider>
          <ScrollRestoration />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/el-doctor" element={<DoctorPage />} />
            <Route path="/procedimientos" element={<ProceduresPage />} />
            <Route path="/resultados" element={<ResultsPage />} />
            <Route path="/tecnologia" element={<TechnologyPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/dashboard" element={<Cirugia360Dashboard />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/marcacion-nivel-dios" element={<MarcacionPage />} />
            <Route path="/torres-rhinoplasty" element={<RhinoplastyPage />} />
            <Route path="/subcision-magic" element={<SubcisionPage />} />
            <Route path="/procedimientos/blefaroplastia" element={<BlefaroplastiaPage />} />
            <Route path="/procedimientos/lifting-facial" element={<LiftingPage />} />
            <Route path="/procedimientos/liposuccion" element={<LiposuccionPage />} />
            <Route
              path="/procedimientos/abdominoplastia"
              element={<GenericProcedurePage procedureId="abdomino" />}
            />
            <Route
              path="/procedimientos/implantes-mamarios"
              element={<GenericProcedurePage procedureId="implantes-mamarios" />}
            />
            <Route
              path="/procedimientos/lipofilling"
              element={<GenericProcedurePage procedureId="lipofilling" />}
            />
            <Route
              path="/procedimientos/lipopapada"
              element={<GenericProcedurePage procedureId="lipopapada" />}
            />
            <Route
              path="/procedimientos/armtite-renuvion"
              element={<GenericProcedurePage procedureId="armtite-renuvion" />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ContactModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
