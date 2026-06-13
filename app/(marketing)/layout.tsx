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
      <RevealProvider />
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
