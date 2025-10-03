import AuthProvider from "@/providers/sessionProvider";
import "./globals.css";

export const metadata = {
  title: "Housing Resale Pricing Viewer",
  description: "NTU Lab Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
