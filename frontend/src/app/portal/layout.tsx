import { PortalNav } from "@/components/PortalNav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PortalNav />
      <main className="flex-1 dot-bg overflow-y-auto scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
