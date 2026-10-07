
let allNews = [];
let currentPage = 1;
const PAGE_SIZE = 15;

// 加载新闻
async function loadNews(force = false) {
  const list = document.getElementById('newsList');
  const btn = document.querySelector('.news-refresh-btn');
  const timeEl = document.getElementById('updateTime');

  btn.classList.add('loading');
  list.innerHTML = `
    <div class="news-loading">
      <p>正在加载新闻...</p>
      <div class="dots"><span></span><span></span><span></span></div>
    </div>`;

  try {
    // 纯静态站点：直接读取仓库内的静态数据（由 GitHub Actions 定时更新）
    const url = force ? `news.json?t=${Date.now()}` : 'news.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // 处理错误响应
    if (data.error) {
      allNews = data.fallback || [];
      if (allNews.length === 0) {
        list.innerHTML = `
          <div class="news-empty">
            <div class="news-empty-icon">📡</div>
            <p>新闻源暂时不可用</p>
            <p style="font-size:0.8rem;margin-top:0.5rem;">所有RSS源均无法访问，请稍后重试</p>
          </div>`;
        timeEl.textContent = '新闻源不可用';
        btn.classList.remove('loading');
        return;
      }
    } else {
      allNews = data;
    }

    if (allNews.length === 0) {
      list.innerHTML = `
        <div class="news-empty">
          <div class="news-empty-icon">📡</div>
          <p>暂无新闻数据</p>
          <p style="font-size:0.8rem;margin-top:0.5rem;">请点击刷新按钮重试</p>
        </div>`;
      timeEl.textContent = '暂无数据';
    } else {
      currentPage = 1;
      renderPage();
      timeEl.textContent = `共 ${allNews.length} 条新闻 · 每10分钟自动更新`;
    }

    // 显示缓存时间
    const now = new Date();
    document.getElementById('cacheInfo').textContent = `更新时间：${now.toLocaleString('zh-CN')}`;

  } catch (e) {
    list.innerHTML = `
      <div class="news-empty">
        <div class="news-empty-icon">⚠️</div>
        <p>加载失败</p>
        <p style="font-size:0.8rem;margin-top:0.5rem;">请检查网络连接或刷新重试</p>
      </div>`;
    timeEl.textContent = '加载失败';
  } finally {
    btn.classList.remove('loading');
  }
}

// 渲染当前页
function renderPage() {
  const list = document.getElementById('newsList');
  const totalPages = Math.ceil(allNews.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageNews = allNews.slice(start, start + PAGE_SIZE);

  list.innerHTML = pageNews.map(item => {
    const sourceClass = getSourceClass(item.source);
    return `
      <a href="${item.url}" target="_blank" rel="noopener" class="news-item">
        <span class="news-item-source ${sourceClass}">${item.source}</span>
        <div class="news-item-body">
          <div class="news-item-title">${item.title}</div>
          ${item.summary !== item.title ? `<div class="news-item-summary">${item.summary}</div>` : ''}
          <div class="news-item-meta">
            <span>🕐 ${item.date}</span>
          </div>
        </div>
      </a>`;
  }).join('');

  // 渲染分页
  renderPagination(totalPages);
}

// 渲染分页
function renderPagination(totalPages) {
  const pag = document.getElementById('newsPagination');
  if (totalPages <= 1) {
    pag.innerHTML = '';
    return;
  }

  let html = `<button class="news-page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← 上一页</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button class="news-page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="color:var(--text-secondary);padding:8px 4px;">...</span>`;
    }
  }

  html += `<button class="news-page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页 →</button>`;

  pag.innerHTML = html;
}

// 翻页
function goPage(page) {
  const totalPages = Math.ceil(allNews.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  document.getElementById('newsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderPage();
}

// 刷新
function refreshNews() {
  loadNews(true);
}

// 获取来源样式
function getSourceClass(source) {
  if (source.includes('人民')) return 'people';
  if (source.includes('新华')) return 'xinhua';
  if (source.includes('山西')) return 'shanxi';
  if (source.includes('政府') || source.includes('政务') || source.includes('长治')) return 'gov';
  return 'default';
}

// 初始化
loadNews();
