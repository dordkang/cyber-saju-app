const fs = require('fs');
const path = require('path');

const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const manifestSrc = path.join(__dirname, '..', 'public', 'manifest.json');
const manifestDest = path.join(__dirname, '..', 'dist', 'manifest.json');

if (fs.existsSync(distHtmlPath)) {
  let html = fs.readFileSync(distHtmlPath, 'utf8');

  // Replace Title
  html = html.replace(
    /<title>.*?<\/title>/,
    '<title>CYBER SAJU · 옥동자 천기(天氣) 해단 | 8대 대운 & 영혼의 공명</title>'
  );

  // Meta Tags block
  const metaTags = `
    <meta name="description" content="정통 명리학 알고리즘과 네오 사이버펑크의 결합. 10년 주기 재물 변곡선부터 레전드 셀럽 영혼의 공명 매칭까지, 당신만의 천기를 즉시 확인하세요." />

    <!-- Open Graph / KakaoTalk / LINE / Instagram -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="CYBER SAJU · 사이버 사주" />
    <meta property="og:url" content="https://cyber-saju-app.pages.dev" />
    <meta property="og:title" content="CYBER SAJU · 옥동자 천기(天氣) 해단 | 8대 대운 & 영혼의 공명" />
    <meta property="og:description" content="정통 명리학 알고리즘과 네오 사이버펑크의 결합. 10년 주기 재물 변곡선부터 레전드 셀럽 영혼의 공명 매칭까지, 당신만의 천기를 즉시 확인하세요." />
    <meta property="og:image" content="https://cyber-saju-app.pages.dev/favicon.ico" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:locale:alternate" content="ja_JP" />

    <!-- Twitter Cards / X Viral -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://cyber-saju-app.pages.dev" />
    <meta name="twitter:title" content="CYBER SAJU · 옥동자 천기(天氣) 해단" />
    <meta name="twitter:description" content="정통 명리학 알고리즘과 네오 사이버펑크의 결합. 10년 주기 재물선 및 1:1 밀실 신탁 해단." />
    <meta name="twitter:image" content="https://cyber-saju-app.pages.dev/favicon.ico" />

    <!-- Mobile Web App & PWA Standalone -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="CYBER SAJU" />
    <meta name="application-name" content="CYBER SAJU" />
    <meta name="theme-color" content="#0a0507" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
  `;

  html = html.replace('</head>', `${metaTags}\n  </head>`);
  fs.writeFileSync(distHtmlPath, html, 'utf8');
  console.log('✅ Successfully injected OG & PWA metadata into dist/index.html');
}

// Ensure manifest.json is in dist
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('✅ Successfully copied manifest.json to dist/manifest.json');
}
