import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "MidusaElibrary — Kenya's Best eBook Selling Platform",
  description = "Kenya's best ebook selling platform. Access bestselling digital eBooks in Finance, Psychology, Self-Development, and Christianity with instant M-PESA delivery.",
  keywords = "Kenya's best ebook selling platform, buy ebooks Kenya, M-PESA ebooks, digital bookstore, best finance books, self development ebooks, psychology books, Christian ebooks, instant download",
  ogImage = '/logo.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image'
}) => {
  const siteUrl = window.location.origin;
  const canonicalUrl = window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="MidusaElibrary" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="MidusaElibrary" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "MidusaElibrary",
          "url": siteUrl,
          "description": description,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/library?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
