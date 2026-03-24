import { Navbar } from "../components/Navbar";
import { StatsBar } from "../components/StatsBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <StatsBar />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
