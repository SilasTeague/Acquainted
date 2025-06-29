// app/layout.tsx
import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Acquainted - Relationship Intelligence Assistant',
  description: 'Manage your relationships and never miss important dates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
