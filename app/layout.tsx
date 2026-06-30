import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
export default function RootLayout({
  children,
  login,
}: {
  children: React.ReactNode;
  login: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* {login} */}
        {children}
      </body>
    </html>
  );
}
