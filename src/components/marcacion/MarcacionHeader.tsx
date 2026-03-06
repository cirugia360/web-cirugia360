import { Menu, X } from "lucide-react";
import { navLinks } from "@/pages/marcacionData";

type MarcacionHeaderProps = {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
};

const MarcacionHeader = ({
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: MarcacionHeaderProps) => (
  <header className="fixed inset-x-0 top-0 z-[60] border-b border-[#E5EAED] bg-white/95 backdrop-blur">
    <nav
      aria-label="Navegación principal de Marcación Nivel Dios"
      className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4 lg:px-8"
    >
      <a href="#inicio" className="font-serif text-2xl font-bold tracking-tight text-[#1A1A2E]">
        Cirugía<span className="text-[#2A7A7B]">360</span>
      </a>

      <div className="hidden items-center gap-8 lg:flex">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4D5562] transition hover:text-[#2A7A7B]"
          >
            {link.label}
          </a>
        ))}
      </div>

      <a
        href="#evaluacion"
        className="hidden items-center justify-center rounded-full bg-[#2A7A7B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#225F60] lg:inline-flex"
      >
        AGENDAR EVALUACIÓN
      </a>

      <button
        type="button"
        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isMenuOpen}
        aria-controls="mnd-mobile-nav"
        className="rounded-full border border-[#DCE2E6] p-2 text-[#1A1A2E] transition hover:border-[#2A7A7B] hover:text-[#2A7A7B] lg:hidden"
        onClick={onToggleMenu}
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </nav>

    {isMenuOpen ? (
      <div id="mnd-mobile-nav" className="border-t border-[#E5EAED] bg-white lg:hidden">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1A1A2E]"
              onClick={onCloseMenu}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#evaluacion"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-[#2A7A7B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
            onClick={onCloseMenu}
          >
            AGENDAR EVALUACIÓN
          </a>
        </div>
      </div>
    ) : null}
  </header>
);

export default MarcacionHeader;
