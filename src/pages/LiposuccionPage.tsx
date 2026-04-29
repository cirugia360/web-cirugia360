import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LiposuccionClosing from "@/components/liposuccion/LiposuccionClosing";
import LiposuccionHero from "@/components/liposuccion/LiposuccionHero";
import LiposuccionSectionsPrimary from "@/components/liposuccion/LiposuccionSectionsPrimary";
import LiposuccionSectionsSecondary from "@/components/liposuccion/LiposuccionSectionsSecondary";
import useLiposuccionSeo from "@/hooks/useLiposuccionSeo";

const LiposuccionPage = () => {
  useLiposuccionSeo();

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
        <LiposuccionHero />
        <LiposuccionSectionsPrimary />
        <LiposuccionSectionsSecondary />
        <LiposuccionClosing showMobileStickyCta={showMobileStickyCta} />
      </main>

      <Footer />
    </div>
  );
};

export default LiposuccionPage;
