import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
      }}
    >
      <Sidebar />

      <main
        className="finance-main-content"
        style={{
          marginLeft: 250,
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}