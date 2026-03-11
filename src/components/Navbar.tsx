import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ContactModalButton } from "@/components/ContactModalProvider";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "El Doctor", href: "/el-doctor" },
  { label: "Procedimientos", href: "/procedimientos" },
  { label: "Resultados", href: "/resultados" },
  { label: "Tecnologia", href: "/tecnologia" },
  { label: "Blog", href: "/blog" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm transition-all duration-500">
      <nav className="container-premium flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Cirugia<span className="text-primary">360</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`font-sans text-xs uppercase tracking-widest transition-colors duration-300 ${
                location.pathname === link.href ||
                (link.href === "/blog" && location.pathname.startsWith("/blog/"))
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ letterSpacing: "0.15em" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <ContactModalButton className="btn-premium px-6 py-3 text-xs">
            Agendar Evaluacion
          </ContactModalButton>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground lg:hidden" type="button">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`py-2 font-sans text-sm uppercase tracking-wider ${
                    location.pathname === link.href ||
                    (link.href === "/blog" && location.pathname.startsWith("/blog/"))
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <ContactModalButton
                className="btn-premium mt-4 px-6 py-3 text-center text-xs"
                onClick={() => setIsOpen(false)}
              >
                Agendar Evaluacion
              </ContactModalButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
