import './globals.css';

export const metadata = {
  title: 'TubePilot AI',
  description: 'Autonomous YouTube channel operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
