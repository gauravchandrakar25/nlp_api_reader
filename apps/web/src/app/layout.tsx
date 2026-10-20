import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REA | API Playground for Non-Technical Teams',
  description: 'Translate natural language queries into secure API requests without exposing keys to frontend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0c0d12] text-zinc-100 min-h-screen antialiased select-none">
        {children}
      </body>
    </html>
  );
}
