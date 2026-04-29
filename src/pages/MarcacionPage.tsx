import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import MarcacionClosing from "@/components/marcacion/MarcacionClosing";
import MarcacionHero from "@/components/marcacion/MarcacionHero";
import MarcacionSectionsPrimary from "@/components/marcacion/MarcacionSectionsPrimary";
import MarcacionSectionsSecondary from "@/components/marcacion/MarcacionSectionsSecondary";
import Navbar from "@/components/Navbar";
import useMarcacionSeo from "@/hooks/useMarcacionSeo";

const MarcacionPage = () => {
  useMarcacionSeo();

  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      setShowMobileStickyCta(isMobile && window.scrollY > 360);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <a
        href="#contenido-principal"
        className="skip-link fixed left-4 top-4 z-[70] -translate-y-24 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido-principal" className="overflow-hidden">
        <MarcacionHero />
        <MarcacionSectionsPrimary />
        <MarcacionSectionsSecondary />
        <MarcacionClosing showMobileStickyCta={showMobileStickyCta} />
      </main>

      <Footer />
    </div>
  );
};

export default MarcacionPage;
