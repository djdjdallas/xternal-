import "./globals.css";

export const metadata = {
  title: "Twitter Poster",
  description: "Internal tool for posting tweets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
