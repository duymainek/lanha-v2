import { Helmet } from 'react-helmet-async'

export function Head() {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>Là Nhà Apartment - Căn Hộ Dịch Vụ Cao Cấp Tại Đà Nẵng</title>
      <meta name="title" content="Là Nhà Apartment - Căn Hộ Dịch Vụ Cao Cấp Tại Đà Nẵng" />
      <meta name="description" content="Căn hộ dịch vụ hiện đại, đầy đủ tiện nghi tại trung tâm thành phố Đà Nẵng. An toàn, tiện lợi và cộng đồng văn minh." />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://lanha.vn/" />
      <meta property="og:title" content="Là Nhà Apartment - Căn Hộ Dịch Vụ Cao Cấp Tại Đà Nẵng" />
      <meta property="og:description" content="Căn hộ dịch vụ hiện đại, đầy đủ tiện nghi tại trung tâm thành phố Đà Nẵng. An toàn, tiện lợi và cộng đồng văn minh." />
      <meta property="og:image" content="https://lanha.vn/og-image.jpg" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://lanha.vn/" />
      <meta property="twitter:title" content="Là Nhà Apartment - Căn Hộ Dịch Vụ Cao Cấp Tại Đà Nẵng" />
      <meta property="twitter:description" content="Căn hộ dịch vụ hiện đại, đầy đủ tiện nghi tại trung tâm thành phố Đà Nẵng. An toàn, tiện lợi và cộng đồng văn minh." />
      <meta property="twitter:image" content="https://lanha.vn/og-image.jpg" />

      {/* Additional Meta Tags */}
      <meta name="keywords" content="căn hộ dịch vụ đà nẵng, cho thuê căn hộ, apartment đà nẵng, là nhà, lanha apartment" />
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Vietnamese" />
      <meta name="author" content="Là Nhà Apartment" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect to External Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://maps.googleapis.com" />
    </Helmet>
  )
} 