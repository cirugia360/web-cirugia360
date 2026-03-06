import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import MarcacionClosing from "@/components/marcacion/MarcacionClosing";
import MarcacionHero from "@/components/marcacion/MarcacionHero";
import MarcacionSectionsPrimary from "@/components/marcacion/MarcacionSectionsPrimary";
import MarcacionSectionsSecondary from "@/components/marcacion/MarcacionSectionsSecondary";
import Navbar from "@/components/Navbar";
import useMarcacionSeo from "@/hooks/useMarcacionSeo";
import { cn } from "@/lib/utils";
import { defaultWhatsappMessage, whatsappNumber } from "@/pages/marcacionData";

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

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

      <a
        href={buildWhatsAppUrl(defaultWhatsappMessage)}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp a Cirugia 360"
        className={cn(
          "animate-soft-pulse fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_34px_-16px_rgba(42,122,123,0.55)] transition-all duration-300 hover:bg-primary-dark md:h-auto md:w-auto md:gap-2 md:rounded-full md:px-5 md:py-4",
          showMobileStickyCta ? "bottom-24" : "bottom-5",
          "md:bottom-6",
        )}
      >
        <MessageCircle size={22} />
        <span className="hidden text-sm font-medium md:inline">WhatsApp</span>
      </a>

      <Footer />
    </div>
  );
};

export default MarcacionPage;
