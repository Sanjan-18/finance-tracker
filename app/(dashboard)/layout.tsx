import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="finance-app-layout">
      <Sidebar />

      <main className="finance-main-content">
        {children}
      </main>
    </div>
  );
}