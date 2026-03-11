import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContactModalProvider } from "@/components/ContactModalProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import DoctorPage from "./pages/DoctorPage";
import ProceduresPage from "./pages/ProceduresPage";
import ResultsPage from "./pages/ResultsPage";
import TechnologyPage from "./pages/TechnologyPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import MarcacionPage from "./pages/MarcacionPage";
import RhinoplastyPage from "./pages/RhinoplastyPage";
import SubcisionPage from "./pages/SubcisionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ContactModalProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/el-doctor" element={<DoctorPage />} />
            <Route path="/procedimientos" element={<ProceduresPage />} />
            <Route path="/resultados" element={<ResultsPage />} />
            <Route path="/tecnologia" element={<TechnologyPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/marcacion-nivel-dios" element={<MarcacionPage />} />
            <Route path="/torres-rhinoplasty" element={<RhinoplastyPage />} />
            <Route path="/subcision-magic" element={<SubcisionPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ContactModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
