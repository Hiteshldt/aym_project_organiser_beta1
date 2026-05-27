export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-paper text-ink">{children}</div>;
}
