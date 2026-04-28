import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { ContactModalButton } from "@/components/ContactModalProvider";
import { siteStrings } from "@/i18n/strings";

const footerNavigationLinks = siteStrings.nav.links.filter(
  (link) => link.href !== "/" && link.href !== "/procedimientos" && link.href !== "/blog",
);

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container-premium section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-serif text-2xl font-medium text-background mb-4">
              {siteStrings.brand.prefix}
              <span className="text-accent">{siteStrings.brand.suffix}</span>
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              {siteStrings.footer.description}
            </p>
          </div>

          <div>
            <h4
              className="font-sans text-xs tracking-widest uppercase text-accent mb-6"
              style={{ letterSpacing: "0.2em" }}
            >
              {siteStrings.footer.columns.procedures}
            </h4>
            <div className="flex flex-col gap-3">
              {siteStrings.footer.procedures.map((procedure) => (
                <Link
                  key={procedure.href}
                  to={procedure.href}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  {procedure.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="font-sans text-xs tracking-widest uppercase text-accent mb-6"
              style={{ letterSpacing: "0.2em" }}
            >
              {siteStrings.footer.columns.navigation}
            </h4>
            <div className="flex flex-col gap-3">
              {footerNavigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-background/60 hover:text-background transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <ContactModalButton className="text-sm text-background/60 hover:text-background transition-colors">
                {siteStrings.footer.columns.contact}
              </ContactModalButton>
            </div>
          </div>

          <div>
            <h4
              className="font-sans text-xs tracking-widest uppercase text-accent mb-6"
              style={{ letterSpacing: "0.2em" }}
            >
              {siteStrings.footer.columns.contact}
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
          <p className="text-xs text-background/40">{siteStrings.footer.copyright}</p>
          <p className="text-xs text-background/40">{siteStrings.footer.credential}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
