export default function sitemap() {
  const baseUrl = "https://dyana.app";
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
    },
    {
      url: `${baseUrl}/oroscopo`,
      lastModified,
    },
    {
      url: `${baseUrl}/oroscopo2026`,
      lastModified,
    },
    {
      url: `${baseUrl}/tema`,
      lastModified,
    },
    {
      url: `${baseUrl}/compatibilita`,
      lastModified,
    },
    {
      url: `${baseUrl}/come-funziona`,
      lastModified,
    },
  ];
}
