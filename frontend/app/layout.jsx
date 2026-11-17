import "./globals.css";
import { AuthProvider } from "./auth-provider";

export const metadata = {
  title: "Casa Clara | Imóveis",
  description: "Encontre casas e apartamentos para comprar ou alugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}