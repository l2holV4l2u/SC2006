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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <main>{children}</main>
      </body>
    </html>
  );
}
