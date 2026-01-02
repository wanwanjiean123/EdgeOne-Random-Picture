const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size").imageSize;

const imageBaseUrl = "./images";
const apiFilePath = path.join("functions", "api.js");
const indexHtmlPath = path.join("images", "index.html");
const rootDir = path.join(process.cwd(), "images");

const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(filename);

// 递归收集所有图片并分类
const collectImages = (dir) => {
  const pc = [];
  const mobile = [];
  
  const walk = (currentDir) => {
    if (!fs.existsSync(currentDir)) return;
    const list = fs.readdirSync(currentDir);
    list.forEach((file) => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      // 排除 index.html 和其他非图片文件
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (isImage(file) && file !== 'notfound.jpg') {
        try {
          const buffer = fs.readFileSync(filePath);
          const dimensions = sizeOf(buffer);
          const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
          const size = (stat.size / 1024).toFixed(2) + " KB";
          
          const imgData = {
            src: relativePath,
            width: dimensions.width,
            height: dimensions.height,
            size: size
          };

          // 简单的分类逻辑：宽 > 高 为 PC，否则为 Mobile
          if (dimensions.width > dimensions.height) {
            pc.push(imgData);
          } else {
            mobile.push(imgData);
          }
        } catch (err) {
          console.warn(`⚠️ 无法读取图片尺寸: ${filePath}`, err.message);
        }
      }
    });
  };

  walk(dir);
  return { pc, mobile };
};

console.log("🔍 开始扫描图片并按尺寸分类...");
const { pc: pcImages, mobile: mobileImages } = collectImages(rootDir);
console.log(`📊 统计结果: PC(横屏) ${pcImages.length} 张, Mobile(竖屏) ${mobileImages.length} 张`);

// === 1. 生成 functions/api.js ===
// 增加逻辑：支持 URL 参数 ?type=pc 或 ?type=mobile 强制指定
const apiJsContent = `
export function onRequestGet(context) {
  const pc = ${JSON.stringify(pcImages.map(img => img.src))};
  const mobile = ${JSON.stringify(mobileImages.map(img => img.src))};
  
  const url = new URL(context.request.url);
  const typeParam = url.searchParams.get("type");
  
  let list;
  
  if (typeParam === "pc") {
    list = pc;
  } else if (typeParam === "mobile" || typeParam === "phone") {
    list = mobile;
  } else {
    // 自动检测 User-Agent
    const userAgent = context.request.headers.get("user-agent") || "";
    const isMobileDevice = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    list = isMobileDevice ? mobile : pc;
  }

  // 如果某个列表为空，回退到另一个列表
  if (list.length === 0) {
    list = (list === pc) ? mobile : pc;
  }

  if (list.length === 0) {
    return new Response("No images found", { status: 404 });
  }

  const randomImage = list[Math.floor(Math.random() * list.length)];
  const redirectUrl = "${imageBaseUrl}/" + randomImage;
  
  return Response.redirect(redirectUrl, 302);
}
`.trim();

fs.mkdirSync(path.dirname(apiFilePath), { recursive: true });
fs.writeFileSync(apiFilePath, apiJsContent);
console.log("✅ 生成 functions/api.js 成功");

// === 2. 生成 images/index.html (图库预览页) ===
// 使用更现代的 UI
const generateGalleryHtml = () => {
  let allImages = [
    ...pcImages.map(img => ({ ...img, type: 'PC' })), 
    ...mobileImages.map(img => ({ ...img, type: 'Mobile' }))
  ];

  // 打乱顺序，使横竖屏混合均匀
  allImages = allImages.sort(() => Math.random() - 0.5);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PicGallery</title>
  <style>
    :root {
      --bg-color: #0a0a0a;
      --text-color: #ffffff;
      --header-bg: rgba(10, 10, 10, 0.8);
      --card-bg: #1a1a1a;
      --btn-bg: #262626;
      --btn-text: #a1a1aa;
      --btn-hover-bg: #404040;
      --btn-active-bg: #ffffff;
      --btn-active-text: #000000;
    }
    body.light-mode {
      --bg-color: #ffffff;
      --text-color: #000000;
      --header-bg: rgba(255, 255, 255, 0.8);
      --card-bg: #f4f4f5;
      --btn-bg: #e4e4e7;
      --btn-text: #52525b;
      --btn-hover-bg: #d4d4d8;
      --btn-active-bg: #000000;
      --btn-active-text: #ffffff;
    }
    
    * { box-sizing: border-box; }
    
    body {
      margin: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background-color 0.3s, color 0.3s;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: var(--header-bg);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      background: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--btn-hover-bg);
      color: var(--text-color);
    }

    .btn.active {
      background: var(--btn-active-bg);
      color: var(--btn-active-text);
    }

    .theme-toggle {
      background: transparent;
      padding: 0.5rem;
      font-size: 1.2rem;
      color: var(--text-color);
    }
    .theme-toggle:hover { background: rgba(255,255,255,0.1); }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-auto-rows: 150px;
      grid-auto-flow: dense;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      cursor: zoom-in;
      position: relative;
      transition: transform 0.2s;
    }

    /* 横屏图片：宽 2 格，高 1 格 */
    .card[data-type="PC"] {
      grid-column: span 2;
      grid-row: span 1;
    }

    /* 竖屏图片：宽 1 格，高 2 格 */
    .card[data-type="Mobile"] {
      grid-column: span 1;
      grid-row: span 2;
    }
    
    .card:hover {
      transform: scale(1.02);
      z-index: 10;
    }

    .card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      /* 减少解码开销 */
      decoding: async;
    }

    /* 移动端适配：如果屏幕太窄，横屏图片占满全宽 */
    @media (max-width: 480px) {
      .gallery {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        grid-auto-rows: 120px;
      }
    }

    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      z-index: 100;
      display: none;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      backdrop-filter: blur(8px);
    }
    
    .lightbox.active { display: flex; animation: fadeIn 0.2s; }
    
    .lightbox-content {
      display: flex;
      background: var(--card-bg);
      border-radius: 16px;
      overflow: hidden;
      max-width: 95vw;
      max-height: 90vh;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      position: relative;
    }

    .lightbox-img-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      min-width: 0;
    }

    .lightbox-img-container img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
    }

    .lightbox-info {
      width: 300px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      border-left: 1px solid rgba(255,255,255,0.1);
      background: var(--card-bg);
      overflow-y: auto;
    }

    .info-item label {
      display: block;
      font-size: 0.7rem;
      color: var(--btn-text);
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    .info-item span {
      display: block;
      font-size: 0.85rem;
      word-break: break-all;
      font-family: 'SFMono-Regular', Consolas, monospace;
      color: var(--text-color);
      background: rgba(255,255,255,0.03);
      padding: 0.5rem;
      border-radius: 4px;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0,0,0,0.5);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.2); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    @media (max-width: 900px) {
      .lightbox-content { flex-direction: column; width: 95vw; max-height: 95vh; }
      .lightbox-info { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; }
      .lightbox-img-container img { max-height: 60vh; }
    }
  </style>
  <!-- 预加载前 8 张图片 -->
  ${allImages.slice(0, 8).map(img => `<link rel="preload" as="image" href="${imageBaseUrl}/${img.src}">`).join('\n  ')}
</head>
<body>
  <header>
    <div class="logo">PicGallery</div>
    <div class="controls">
      <a href="https://github.com/H2O-ME/EdgeOne-Random-Picture" target="_blank" class="btn" style="text-decoration: none;">GitHub</a>
      <button class="btn theme-toggle" onclick="toggleTheme()">☀</button>
    </div>
  </header>

  <div class="gallery">
    ${allImages.map(img => `
      <div class="card" 
           data-type="${img.type}" 
           data-width="${img.width}" 
           data-height="${img.height}" 
           data-size="${img.size}"
           onclick="openLightbox(this)">
        <img src="${imageBaseUrl}/${img.src}" alt="gallery image">
      </div>
    `).join('')}
  </div>

  <footer style="padding: 2rem; text-align: center; color: var(--btn-text); font-size: 0.875rem; border-top: 1px solid rgba(255,255,255,0.05);">
    <p>© 2024 <a href="https://tianhw.top" target="_blank" style="color: inherit; text-decoration: none;">THW</a>. Powered by <a href="https://github.com/H2O-ME/EdgeOne-Random-Picture" target="_blank" style="color: inherit; text-decoration: none;">EdgeOne-Random-Picture</a></p>
  </footer>

  <div class="lightbox" id="lightbox" onclick="handleLightboxClick(event)">
    <div class="lightbox-content">
      <button class="close-btn" onclick="closeLightbox()">✕</button>
      <div class="lightbox-img-container">
        <img id="lightbox-img" src="" alt="">
      </div>
      <div class="lightbox-info">
        <div class="info-item">
          <label>图片地址</label>
          <span id="info-url"></span>
        </div>
        <div class="info-item">
          <label>分辨率</label>
          <span id="info-dims"></span>
        </div>
        <div class="info-item">
          <label>文件大小</label>
          <span id="info-size"></span>
        </div>
        <div class="info-item">
          <label>图片类型</label>
          <span id="info-type"></span>
        </div>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      document.body.classList.toggle('light-mode');
      const btn = document.querySelector('.theme-toggle');
      btn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀';
    }

    function openLightbox(card) {
      const img = card.querySelector('img');
      const { width, height, size, type } = card.dataset;
      const fullUrl = new URL(img.src, window.location.href).href;
      
      document.getElementById('lightbox-img').src = img.src;
      document.getElementById('info-url').textContent = fullUrl;
      document.getElementById('info-dims').textContent = width + ' × ' + height;
      document.getElementById('info-size').textContent = size;
      document.getElementById('info-type').textContent = type === 'PC' ? '横屏 (Landscape)' : '竖屏 (Portrait)';
      
      document.getElementById('lightbox').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
      document.body.style.overflow = '';
    }

    function handleLightboxClick(e) {
      if (e.target.id === 'lightbox') closeLightbox();
    }
  </script>
</body>
</html>`;
};

fs.mkdirSync(path.dirname(indexHtmlPath), { recursive: true });
fs.writeFileSync(indexHtmlPath, generateGalleryHtml());
console.log("✅ 生成 images/index.html 成功");
