import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { siteStrings } from "@/i18n/strings";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="section-padding flex min-h-screen items-center bg-background pt-32">
        <div className="container-premium">
          <div className="mx-auto max-w-3xl text-center">
            <p className="subtitle-premium mb-5">{siteStrings.notFound.eyebrow}</p>
            <h1 className="heading-display mb-6 text-foreground">{siteStrings.notFound.title}</h1>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {siteStrings.notFound.description}
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/blog" className="btn-outline-premium inline-flex items-center justify-center gap-2">
                {siteStrings.notFound.blogCta}
                <ArrowRight size={16} />
              </Link>
              <Link to="/procedimientos" className="btn-premium inline-flex items-center justify-center gap-2">
                {siteStrings.notFound.proceduresCta}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
