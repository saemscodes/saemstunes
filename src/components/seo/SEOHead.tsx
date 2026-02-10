import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOHeadProps {
  // Core SEO Properties
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video' | 'music' | 'course' | 'tool' | 'community';

  // Advanced SEO Controls
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  locale?: string;
  alternateLocales?: { lang: string; url: string }[];

  // Content-Specific Properties
  pageType?: 'homepage' | 'tool' | 'lesson' | 'community' | 'artist' | 'course' | 'resource' | 'video' | 'booking' | 'profile';
  courseLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  instrument?: 'piano' | 'guitar' | 'vocals' | 'theory' | 'worship' | 'all';
  targetAudience?: 'children' | 'teens' | 'adults' | 'worship-leaders' | 'music-teachers' | 'all';

  // Structured Data Options
  structuredData?: object;
  courseData?: {
    name: string;
    description: string;
    instructor: string;
    duration: string;
    difficulty: string;
    price?: number;
  };
  toolData?: {
    name: string;
    category: string;
    features: string[];
  };
  articleData?: {
    headline: string;
    datePublished: string;
    dateModified: string;
    author: string;
    wordCount?: number;
  };

  // Social & Engagement
  twitterCardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  facebookAppId?: string;

  // Performance & Technical
  preloadResources?: string[];
  criticalCSS?: string;

  // Location & Business
  businessLocation?: {
    country: string;
    region: string;
    city?: string;
  };

  // Video/Audio Specific
  videoData?: {
    duration: string;
    uploadDate: string;
    contentUrl: string;
    embedUrl?: string;
  };

  // Advanced Features
  breadcrumbData?: { name: string; url: string }[];
  faqData?: { question: string; answer: string }[];
  ratingData?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  // Optimized Defaults for Saem's Tunes
  title = "Saem's Tunes - Christian Music Education Platform | Online Lessons, Tools & Community",
  description = "Comprehensive Christian music education platform offering interactive piano & guitar tools, worship leader training, online lessons, community features, and ministry resources. From tots to adults - everyone's go-to music learning space! 🎵✨",
  keywords = "Christian music education, online music lessons, worship leader training, piano lessons online, guitar tutorials, music theory, vocal training, church music, worship songs, music ministry, Christian musicians community, interactive music tools, metronome, pitch finder, music sheets, biblical music education, contemporary worship, praise team training, church pianist, worship guitar, Christian songwriting, music education app, faith-based learning, kenya music tech, african tech innovation, saem's tunes, saemstunes",
  image = "https://i.imgur.com/ltEen5M.png",
  url = "https://www.saemstunes.com",
  type = "website",

  // Advanced Options
  noIndex = false,
  noFollow = false,
  canonical,
  locale = "en_US",
  alternateLocales = [],

  // Content Classification
  pageType = "homepage",
  courseLevel = "all-levels",
  instrument = "all",
  targetAudience = "all",

  // Structured Data
  structuredData,
  courseData,
  toolData,
  articleData,

  // Social Optimization
  twitterCardType = "summary_large_image",
  facebookAppId,

  // Technical Optimization
  preloadResources = [],
  criticalCSS,

  // Business Context
  businessLocation = {
    country: "Kenya",
    region: "Nairobi",
    city: "Nairobi"
  },

  // Media Specific
  videoData,

  // Enhanced Features
  breadcrumbData,
  faqData,
  ratingData
}) => {

  // Dynamic Title Generation Based on Page Type
  const generateOptimizedTitle = (): string => {
    if (title.includes("Saem's Tunes")) return title;

    const pageTitleMap = {
      homepage: "Saem's Tunes - Christian Music Education Platform | Online Lessons, Tools & Community",
      tool: `${title} | Free Online Music Tools | Saem's Tunes`,
      lesson: `${title} | Christian Music Lessons Online | Saem's Tunes`,
      community: `${title} | Christian Musicians Community | Saem's Tunes`,
      artist: `${title} | Christian Music Artist Profile | Saem's Tunes`,
      course: `${title} | Online Christian Music Course | Saem's Tunes`,
      resource: `${title} | Free Music Resources & Sheets | Saem's Tunes`,
      video: `${title} | Music Video Lessons | Saem's Tunes`,
      booking: `${title} | Book Music Tutors | Saem's Tunes`,
      profile: `${title} | User Profile | Saem's Tunes`
    };

    return pageTitleMap[pageType] || `${title} | Saem's Tunes`;
  };

  // Dynamic Description Enhancement
  const generateOptimizedDescription = (): string => {
    if (description.length > 150) return description;

    const descriptionEnhancers = {
      tool: " Perfect for worship practice, music education, and skill development.",
      lesson: " Learn with Christian values, expert instruction, and community support.",
      community: " Connect with fellow believers, share your musical journey, and grow together.",
      course: " Comprehensive curriculum designed for all skill levels with biblical foundation.",
      video: " High-quality video instruction for Christian musicians and worship leaders."
    };

    const enhancer = descriptionEnhancers[pageType as keyof typeof descriptionEnhancers];
    return enhancer ? description + enhancer : description;
  };

  // Advanced Keyword Generation
  const generateContextualKeywords = (): string => {
    const baseKeywords = keywords;

    const contextualKeywords = {
      tool: ", free music tools, online metronome, digital piano, guitar simulator, pitch finder, music practice tools",
      lesson: ", online music classes, christian music curriculum, worship training, piano tutorials, guitar lessons",
      community: ", christian musicians network, worship team, praise team, church music community, music ministry",
      course: ", music education course, christian music certification, worship leader course, music theory classes",
      video: ", music video tutorials, worship song lessons, performance tips, music education videos"
    };

    const additionalKeywords = contextualKeywords[pageType as keyof typeof contextualKeywords] || "";

    // Add instrument-specific keywords
    const instrumentKeywords = {
      piano: ", piano worship songs, christian piano tutorials, church pianist training",
      guitar: ", worship guitar, christian guitar lessons, acoustic guitar worship",
      vocals: ", worship vocals, christian singing lessons, choir training, vocal worship techniques",
      theory: ", music theory for worship, biblical music education, christian music composition"
    };

    const instrumentKeyword = instrumentKeywords[instrument as keyof typeof instrumentKeywords] || "";

    // Add audience-specific keywords
    const audienceKeywords = {
      children: ", kids music lessons, children's church music, youth worship training",
      teens: ", teen worship, youth music ministry, young musicians",
      adults: ", adult music education, mature learner music, church volunteer training",
      "worship-leaders": ", worship leader training, church music director, praise team leader",
      "music-teachers": ", christian music pedagogy, faith-based music instruction, church music education"
    };

    const audienceKeyword = audienceKeywords[targetAudience as keyof typeof audienceKeywords] || "";

    return baseKeywords + additionalKeywords + instrumentKeyword + audienceKeyword;
  };

  const fullTitle = generateOptimizedTitle();
  const fullDescription = generateOptimizedDescription();
  const fullKeywords = generateContextualKeywords();
  const canonicalUrl = canonical || url;
  const robotsContent = `${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'},max-image-preview:large,max-snippet:-1,max-video-preview:-1`;

  // Generate Enhanced Structured Data
  const generateEnhancedStructuredData = (): Record<string, any> => {
    const baseStructuredData: Record<string, any> = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://www.saemstunes.com/#website",
          "url": "https://www.saemstunes.com",
          "name": "Saem's Tunes",
          "description": "Comprehensive Christian music education platform",
          "publisher": {
            "@id": "https://www.saemstunes.com/#organization"
          },
          "potentialAction": [
            {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.saemstunes.com/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          ],
          "inLanguage": "en-US"
        },
        {
          "@type": "Organization",
          "@id": "https://www.saemstunes.com/#organization",
          "name": "Saem's Tunes",
          "alternateName": "Saem's Tunes Music Ministry",
          "url": "https://www.saemstunes.com",
          "logo": {
            "@type": "ImageObject",
            "inLanguage": "en-US",
            "@id": "https://www.saemstunes.com/#/schema/logo/image/",
            "url": image,
            "contentUrl": image,
            "width": 512,
            "height": 512,
            "caption": "Saem's Tunes Logo"
          },
          "image": {
            "@id": "https://www.saemstunes.com/#/schema/logo/image/"
          },
          "description": "Christian music education platform offering comprehensive online lessons, interactive tools, and community features for musicians of all ages and skill levels.",
          "foundingDate": "2024",
          "foundingLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "KE",
              "addressRegion": "Nairobi County",
              "addressLocality": "Nairobi"
            }
          },
          "areaServed": "Worldwide",
          "contactPoint": [
            {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "saemstunes@gmail.com",
              "availableLanguage": ["English"],
              "areaServed": "Worldwide"
            }
          ],
          "sameAs": [
            "https://instagram.com/saemstunes",
            "https://twitter.com/saemstunes"
          ],
          "knowsAbout": [
            "Christian Music Education",
            "Worship Leadership Training",
            "Online Music Lessons",
            "Interactive Music Tools",
            "Music Ministry",
            "Faith-Based Learning"
          ],
          "slogan": "Making Music, Representing Christ",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Saem's Tunes Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Course",
                  "name": "Christian Music Education"
                },
                "price": "0",
                "priceCurrency": "USD"
              }
            ]
          }
        }
      ]
    };

    // Add Course Data
    if (courseData) {
      baseStructuredData["@graph"].push({
        "@type": "Course",
        "name": courseData.name,
        "description": courseData.description,
        "provider": {
          "@id": "https://www.saemstunes.com/#organization"
        },
        "instructor": {
          "@type": "Person",
          "name": courseData.instructor
        },
        "courseMode": "online",
        "educationalLevel": courseData.difficulty,
        "timeRequired": courseData.duration,
        "offers": courseData.price ? {
          "@type": "Offer",
          "price": courseData.price,
          "priceCurrency": "USD"
        } : {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "hasCourseInstance": {
          "@type": "CourseInstance",
          "courseMode": "online",
          "courseWorkload": courseData.duration
        }
      });
    }

    // Add Tool/Software Application Data
    if (toolData) {
      baseStructuredData["@graph"].push({
        "@type": "SoftwareApplication",
        "name": toolData.name,
        "applicationCategory": "Music Education Tool",
        "applicationSubCategory": toolData.category,
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": toolData.features,
        "creator": {
          "@id": "https://www.saemstunes.com/#organization"
        }
      });
    }

    // Add Article Data
    if (articleData) {
      baseStructuredData["@graph"].push({
        "@type": "Article",
        "headline": articleData.headline,
        "datePublished": articleData.datePublished,
        "dateModified": articleData.dateModified,
        "author": {
          "@type": "Person",
          "name": articleData.author
        },
        "publisher": {
          "@id": "https://www.saemstunes.com/#organization"
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        },
        "image": {
          "@type": "ImageObject",
          "url": image
        },
        "wordCount": articleData.wordCount,
        "inLanguage": "en-US"
      });
    }

    // Add FAQ Data
    if (faqData && faqData.length > 0) {
      baseStructuredData["@graph"].push({
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }

    // Add Breadcrumb Data
    if (breadcrumbData && breadcrumbData.length > 0) {
      baseStructuredData["@graph"].push({
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbData.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      });
    }

    // Add Video Data
    if (videoData) {
      baseStructuredData["@graph"].push({
        "@type": "VideoObject",
        "name": fullTitle,
        "description": fullDescription,
        "thumbnailUrl": image,
        "uploadDate": videoData.uploadDate,
        "duration": videoData.duration,
        "contentUrl": videoData.contentUrl,
        "embedUrl": videoData.embedUrl,
        "publisher": {
          "@id": "https://www.saemstunes.com/#organization"
        }
      });
    }

    // Add Local Business Data for Kenya
    if (pageType === 'homepage' || businessLocation) {
      baseStructuredData["@graph"].push({
        "@type": "LocalBusiness",
        "@id": "https://www.saemstunes.com/#localbusiness",
        "name": "Saem's Tunes",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": businessLocation.country,
          "addressRegion": businessLocation.region,
          "addressLocality": businessLocation.city
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": businessLocation.country === "Kenya" ? -1.2921 : undefined,
          "longitude": businessLocation.country === "Kenya" ? 36.8219 : undefined
        },
        "areaServed": "Worldwide",
        "serviceType": "Online Music Education"
      });
    }

    return structuredData || baseStructuredData;
  };

  return (
    <Helmet>
      {/* Essential Meta Tags */}
      <html lang={locale.split('_')[0]} />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <meta name="author" content="Saem's Tunes Ministry" />
      <meta name="generator" content="Saem's Tunes Platform" />
      <meta name="classification" content="Education, Music, Christian Ministry, Online Learning" />
      <meta name="rating" content="General" />
      <meta name="revisit-after" content="3 days" />
      <meta name="distribution" content="global" />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
      <meta name="bingbot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Language Alternatives */}
      <link rel="alternate" hrefLang={locale.split('_')[0]} href={canonicalUrl} />
      {alternateLocales.map(alt => (
        <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.url} />
      ))}

      {/* Enhanced Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content="Saem's Tunes - Christian Music Education Platform" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Saem's Tunes" />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(alt => (
        <meta key={alt.lang} property="og:locale:alternate" content={alt.lang.replace('-', '_')} />
      ))}
      {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}

      {/* Enhanced Twitter Card */}
      <meta name="twitter:card" content={twitterCardType} />
      <meta name="twitter:site" content="@saemstunes" />
      <meta name="twitter:creator" content="@saemstunes" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="Saem's Tunes - Christian Music Education Platform" />
      <meta name="twitter:domain" content="saemstunes.com" />

      {/* Educational Content Specific */}
      <meta name="educational-level" content={courseLevel} />
      <meta name="target-audience" content={targetAudience} />
      <meta name="content-language" content={locale.split('_')[0]} />
      <meta name="geo.region" content={`${businessLocation.country}-${businessLocation.region}`} />
      <meta name="geo.placename" content={businessLocation.city} />
      <meta name="ICBM" content="-1.2921, 36.8219" />

      {/* Music & Media Specific Meta Tags */}
      {pageType === 'tool' && (
        <>
          <meta property="music:creator" content="Saem's Tunes" />
          <meta property="music:genre" content="Christian Music Education" />
        </>
      )}

      {videoData && (
        <>
          <meta property="video:duration" content={videoData.duration} />
          <meta property="video:release_date" content={videoData.uploadDate} />
        </>
      )}

      {/* Performance & Technical Optimization */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />

      {/* Preload Critical Resources with intelligent 'as' detection */}
      {preloadResources.map(resource => {
        const ext = resource.split('.').pop()?.toLowerCase();
        let asType: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'script';

        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext || '')) asType = 'image';
        else if (ext === 'css') asType = 'style';
        else if (['woff', 'woff2', 'ttf', 'otf'].includes(ext || '')) asType = 'font';
        else if (['json'].includes(ext || '')) asType = 'fetch';

        return (
          <link
            key={resource}
            rel="preload"
            href={resource}
            as={asType}
            crossOrigin={asType === 'font' ? 'anonymous' : undefined}
          />
        );
      })}

      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//i.imgur.com" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />

      {/* Critical CSS Injection */}
      {criticalCSS && (
        <style type="text/css">{criticalCSS}</style>
      )}

      {/* Comprehensive Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateEnhancedStructuredData(), null, 2)}
      </script>

      {/* Additional Schema for Ratings */}
      {ratingData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Rating",
            "ratingValue": ratingData.ratingValue,
            "bestRating": ratingData.bestRating || 5,
            "reviewCount": ratingData.reviewCount
          })}
        </script>
      )}

      {/* App-Specific Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Saem's Tunes" />
      <meta name="application-name" content="Saem's Tunes" />
      <meta name="msapplication-TileColor" content="#C9A66B" />
      <meta name="theme-color" content="#C9A66B" />

      {/* RSS Feed */}
      <link rel="alternate" type="application/rss+xml" title="Saem's Tunes Updates" href="/feed.xml" />

      {/* Security & Verification */}
      <meta name="verify-v1" content="Saem's Tunes Christian Music Education Platform" />

      {/* Copyright */}
      <meta name="copyright" content={`© ${new Date().getFullYear()} Saem's Tunes. All rights reserved.`} />
    </Helmet>
  );
};

export default SEOHead;
