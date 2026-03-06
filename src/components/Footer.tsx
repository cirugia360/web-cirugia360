import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container-premium section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-serif text-2xl font-medium text-background mb-4">
              Cirugia<span className="text-accent">360</span>
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              Cirugía estética de precisión internacional. Resultados naturales con tecnología avanzada.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase text-accent mb-6" style={{letterSpacing:"0.2em"}}>
              Procedimientos
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/marcacion-nivel-dios" className="text-sm text-background/60 hover:text-background transition-colors">Marcación Nivel Dios</Link>
              <Link to="/torres-rhinoplasty" className="text-sm text-background/60 hover:text-background transition-colors">Torres Rhinoplasty</Link>
              <Link to="/subcision-magic" className="text-sm text-background/60 hover:text-background transition-colors">Subcision Magic</Link>
            </div>
          </div>

          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase text-accent mb-6" style={{letterSpacing:"0.2em"}}>
              Navegación
            </h4>
            <div className="flex flex-col gap-3">
              <Link to="/el-doctor" className="text-sm text-background/60 hover:text-background transition-colors">El Doctor</Link>
              <Link to="/resultados" className="text-sm text-background/60 hover:text-background transition-colors">Resultados</Link>
              <Link to="/tecnologia" className="text-sm text-background/60 hover:text-background transition-colors">Tecnología</Link>
              <ContactModalButton className="text-sm text-background/60 hover:text-background transition-colors">
                Contacto
              </ContactModalButton>
            </div>
          </div>

          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase text-accent mb-6" style={{letterSpacing:"0.2em"}}>
              Contacto
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-background/60">
                <Phone size={14} /> +56 9 1234 5678
              </div>
              <div className="flex items-center gap-3 text-sm text-background/60">
                <Mail size={14} /> contacto@cirugia360.cl
              </div>
              <div className="flex items-center gap-3 text-sm text-background/60">
                <MapPin size={14} /> Santiago, Chile
              </div>
              <div className="flex items-center gap-3 text-sm text-background/60">
                <Instagram size={14} /> @cirugia360
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">© 2026 Cirugia360. Todos los derechos reservados.</p>
          <p className="text-xs text-background/40">Dr. Sebastián Torres · RCM 40135-8</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
