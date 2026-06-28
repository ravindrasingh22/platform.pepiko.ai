export const metadata = {
  title: "pepiko.ai Customer Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
