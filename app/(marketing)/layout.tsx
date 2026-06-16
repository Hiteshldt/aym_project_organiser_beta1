import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import RevealProvider from "@/components/marketing/RevealProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Without JS the reveal animation never runs, so force everything
          visible — keeps the page readable for no-JS visitors and crawlers
          that don't execute scripts. (With JS, RevealProvider takes over.) */}
      <noscript>
        <style>{`[data-reveal],[data-reveal-stagger]>*{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <RevealProvider />
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
