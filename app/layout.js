export const metadata = {
  title: "pyodide",
  description: "pyodide",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
