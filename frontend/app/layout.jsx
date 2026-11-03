import "./globals.css";

export const metadata = {
  title: "Casa Clara | Imóveis",
  description: "Encontre casas e apartamentos para comprar ou alugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}