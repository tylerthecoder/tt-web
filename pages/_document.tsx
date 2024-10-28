import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

const analyticsId = "G-B5KCWMNFJE";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="/pi.png" sizes="any" />
        </Head>
        <body>
          <Script
            id="google-anal2"
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
          />

          <Script id="google-anal3" strategy="lazyOnload">
            {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${analyticsId}', {
                    page_path: window.location.pathname,
                    });
                `}
          </Script>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
