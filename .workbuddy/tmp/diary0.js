
// ======================== 日记本逻辑 ========================
let diaries = [];
let currentId = null;
let uploadedFiles = [];

// 纯静态站点：没有服务端写入接口
function staticReadOnlyTip() {
  alert('本站已切换为纯静态托管（GitHub Pages）。\n\n'
      + '新增或修改日记：请在 GitHub 仓库里编辑 diary/diaries.json 并提交，网站会自动更新。');
}


// 加载日记列表
async function loadDiaries() {
  try {
    const res = await fetch('diaries.json');
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    diaries = await res.json();
    renderDiaryList();
  } catch (e) {
    console.error('加载失败:', e);
    diaries = [];
    const emptyText = document.querySelector('#emptyState .empty-state-text');
    if (emptyText && location.protocol === 'file:') {
      emptyText.innerHTML = '本地直接双击打开页面时，浏览器会拦截数据读取（file:// 协议限制）。<br>请通过网站地址访问，或在项目目录里启动本地服务：'
        + '<br><code>python -m http.server 8000</code> 然后打开 http://localhost:8000/diary/';
    } else if (emptyText) {
      emptyText.textContent = '日记加载失败，请检查网络或稍后重试。';
    }
    renderDiaryList();
  }
}

// 渲染日记列表
function renderDiaryList() {
  const grid = document.getElementById('diaryGrid');
  const empty = document.getElementById('emptyState');

  if (diaries.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';

  grid.innerHTML = diaries.map(d => {
    const hasImage = d.images && d.images.length > 0;
    const cover = hasImage ? `<img src="${d.images[0]}" class="diary-card-image" style="display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : '';
    const placeholder = `<div class="diary-card-image" style="${hasImage ? 'display:none;' : ''}">📖</div>`;
    return `
      <div class="diary-card" data-id="${d.id}">
        ${cover}${placeholder}
        <div class="diary-card-body">
          <div class="diary-card-date">${d.date}</div>
          <div class="diary-card-title">${d.title || '无标题'}</div>
          <div class="diary-card-summary">${d.summary || ''}</div>
        </div>
      </div>
    `;
  }).join('');

  // 点击卡片阅读
  grid.querySelectorAll('.diary-card').forEach(card => {
    card.addEventListener('click', () => readDiary(card.dataset.id));
  });
}



// 阅读日记
function readDiary(id) {
  const d = diaries.find(x => x.id === id);
  if (!d) return;

  document.getElementById('readerTitle').textContent = d.title || '无标题';
  document.getElementById('readerDate').textContent = d.date;

  let body = d.content || '';
  (d.images || []).forEach(src => {
    body += `\n\n<img src="${src}" style="max-width:100%;border-radius:16px;margin:1.5rem 0;">`;
  });
  (d.videos || []).forEach(src => {
    body += `\n\n<video src="${src}" controls preload="metadata" style="max-width:100%;border-radius:16px;margin:1.5rem 0;"></video>`;
  });
  (d.videoLinks || []).forEach(embed => {
    body += `\n\n${embed}`;
  });

  document.getElementById('readerBody').innerHTML = body.replace(/\n/g, '<br>');

  document.getElementById('diaryList').style.display = 'none';
  document.getElementById('editorContainer').classList.remove('active');
  document.getElementById('readerContainer').classList.add('active');


  currentId = id;
}




// 返回列表
function backToList() {
  document.getElementById('diaryList').style.display = 'block';
  document.getElementById('editorContainer').classList.remove('active');
  document.getElementById('readerContainer').classList.remove('active');
  currentId = null;
}




// 富文本格式
function formatText(cmd) {
  const textarea = document.getElementById('editorContent');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let wrapped = selected;
  if (cmd === 'bold') wrapped = `**${selected}**`;
  if (cmd === 'italic') wrapped = `*${selected}*`;

  textarea.value = text.substring(0, start) + wrapped + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + wrapped.length, start + wrapped.length);
}

// ======================== 视频链接功能 ========================
function showVideoLinkDialog() {
  document.getElementById('videoLinkDialog').style.display = 'block';
  document.getElementById('videoLinkInput').value = '';
  setTimeout(() => document.getElementById('videoLinkInput').focus(), 100);
}

function closeVideoLinkDialog() {
  document.getElementById('videoLinkDialog').style.display = 'none';
}

// 将视频链接转为嵌入HTML
function videoUrlToEmbed(url) {
  url = url.trim();

  // 哔哩哔哩: https://www.bilibili.com/video/BVxxxxx 或 b23.tv短链
  let bvMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/i);
  if (bvMatch) {
    return `<iframe src="//player.bilibili.com/player.html?bvid=${bvMatch[1]}&high_quality=1" 
      style="width:100%;max-width:640px;height:360px;border:none;border-radius:16px;margin:1.5rem 0;" 
      allowfullscreen="true" scrolling="no"></iframe>`;
  }
  // BV号直接输入
  let bvDirect = url.match(/^(BV[\w]+)$/i);
  if (bvDirect) {
    return `<iframe src="//player.bilibili.com/player.html?bvid=${bvDirect[1]}&high_quality=1" 
      style="width:100%;max-width:640px;height:360px;border:none;border-radius:16px;margin:1.5rem 0;" 
      allowfullscreen="true" scrolling="no"></iframe>`;
  }
  // b23.tv 短链（无法直接转换，提示用户）
  if (url.includes('b23.tv')) {
    return null; // 返回null让用户知道需要用完整链接
  }

  // 优酷: https://v.youku.com/v_show/id_XMTxxxx.html
  let youkuMatch = url.match(/youku\.com\/.*id_([a-zA-Z0-9=]+)/i);
  if (youkuMatch) {
    return `<iframe src="//player.youku.com/embed/${youkuMatch[1]}" 
      style="width:100%;max-width:640px;height:360px;border:none;border-radius:16px;margin:1.5rem 0;" 
      allowfullscreen="true"></iframe>`;
  }

  // YouTube: https://www.youtube.com/watch?v=xxx 或 youtu.be/xxx
  let ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  if (ytMatch) {
    return `<iframe src="//www.youtube.com/embed/${ytMatch[1]}" 
      style="width:100%;max-width:640px;height:360px;border:none;border-radius:16px;margin:1.5rem 0;" 
      allowfullscreen="true"></iframe>`;
  }

  return null;
}

function insertVideoLink() {
  const url = document.getElementById('videoLinkInput').value.trim();
  if (!url) {
    alert('请输入视频链接');
    return;
  }

  const embed = videoUrlToEmbed(url);
  if (!embed) {
    alert('无法识别该视频链接。\n\n支持：\n· 哔哩哔哩（bilibili.com/video/BVxxx）\n· 优酷（v.youku.com）\n· YouTube（youtube.com）\n\n注意：b23.tv短链请先在浏览器打开，复制完整链接后再粘贴。');
    return;
  }

  // 将嵌入代码保存为视频链接类型
  const idx = uploadedFiles.length;
  uploadedFiles.push({ type: 'videoLink', src: url, embed: embed });

  // 在预览区显示
  const preview = document.getElementById('uploadPreview');
  preview.innerHTML += `
    <div class="upload-preview-item" id="file-${idx}" style="width:200px;height:120px;background:rgba(0,240,255,0.05);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;">
      <div style="font-size:1.5rem;">🔗</div>
      <div style="font-size:0.7rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;padding:0 8px;">${url}</div>
      <button class="remove-btn" onclick="removeFile(${idx})">×</button>
    </div>
  `;

  closeVideoLinkDialog();
}


// 事件绑定
// 纯静态站点：写操作入口已移除，绑定做空值保护
  const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  bind('btnSave', staticReadOnlyTip);
  bind('btnCancel', backToList);
  bind('btnBack', backToList);
  bind('btnEdit', staticReadOnlyTip);
  bind('btnDelete', staticReadOnlyTip);

// 初始化
loadDiaries();
