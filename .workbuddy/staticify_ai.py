import io, json, re, sys

P = r'F:\ocean-stars-v2\ai\index.html'
t = io.open(P, encoding='utf-8').read()
orig = t

prompt = io.open(r'F:\ocean-stars-v2\.workbuddy\tmp\system_prompt.txt', encoding='utf-8').read()
prompt_js = json.dumps(prompt, ensure_ascii=False)

REPS = []

# 1) 头部增加一个「密钥」按钮
REPS.append((
    '            <button class="chat-clear-btn" onclick="clearChat()">清空对话</button>\n',
    '            <button class="chat-clear-btn" onclick="clearChat()">清空对话</button>\n'
    '            <button class="chat-clear-btn" style="right:6.4rem;" onclick="setApiKey()">🔑 密钥</button>\n'
))

# 2) 注入系统提示词 + 密钥管理
REPS.append((
    "        let isGenerating = false;\n"
    "        let messageHistory = [];\n",
    "        let isGenerating = false;\n"
    "        let messageHistory = [];\n"
    "\n"
    "        // ===== 纯静态站点：浏览器直连 DeepSeek，密钥只保存在本机浏览器 =====\n"
    "        const API_URL = 'https://api.deepseek.com/chat/completions';\n"
    "        const KEY_STORE = 'xinghai_deepseek_key';\n"
    "        const SYSTEM_PROMPT = " + prompt_js + ";\n"
    "\n"
    "        function getApiKey() {\n"
    "            return (localStorage.getItem(KEY_STORE) || '').trim();\n"
    "        }\n"
    "\n"
    "        function setApiKey() {\n"
    "            const cur = getApiKey();\n"
    "            const tip = cur\n"
    "                ? '已保存密钥：' + cur.slice(0, 4) + '****' + cur.slice(-4)\n"
    "                  + '\\n\\n输入新密钥可覆盖，留空并确定则删除。'\n"
    "                : '本站为纯静态站点，AI 功能由你自己的 DeepSeek API Key 驱动。'\n"
    "                  + '\\n密钥只保存在你这台设备的浏览器里，不会上传到任何服务器。'\n"
    "                  + '\\n\\n没有密钥？到 platform.deepseek.com 注册即可领取。';\n"
    "            const v = prompt(tip, '');\n"
    "            if (v === null) return;\n"
    "            if (v.trim() === '') { localStorage.removeItem(KEY_STORE); alert('已删除本机密钥。'); }\n"
    "            else { localStorage.setItem(KEY_STORE, v.trim()); alert('密钥已保存到本机浏览器。'); }\n"
    "        }\n"
))

# 3) 请求改为直连 DeepSeek
REPS.append((
    "                // 调用API（流式）\n"
    "                const response = await fetch('api/chat.php', {\n"
    "                    method: 'POST',\n"
    "                    headers: { 'Content-Type': 'application/json' },\n"
    "                    body: JSON.stringify({ messages: messageHistory })\n"
    "                });\n",
    "                // 调用 DeepSeek（流式，密钥来自本机 localStorage）\n"
    "                const apiKey = getApiKey();\n"
    "                if (!apiKey) {\n"
    "                    loadingEl.remove();\n"
    "                    setApiKey();\n"
    "                    throw new Error('已取消：未设置 API Key');\n"
    "                }\n"
    "                const response = await fetch(API_URL, {\n"
    "                    method: 'POST',\n"
    "                    headers: {\n"
    "                        'Content-Type': 'application/json',\n"
    "                        'Authorization': 'Bearer ' + apiKey\n"
    "                    },\n"
    "                    body: JSON.stringify({\n"
    "                        model: 'deepseek-chat',\n"
    "                        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(\n"
    "                            messageHistory.slice(-10)\n"
    "                                .filter(m => m.role === 'user' || m.role === 'assistant')\n"
    "                                .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }))\n"
    "                        ),\n"
    "                        temperature: 0.3,\n"
    "                        max_tokens: 2000,\n"
    "                        stream: true\n"
    "                    })\n"
    "                });\n"
))

# 4) 401 时提示密钥无效
REPS.append((
    "                if (!response.ok) {\n"
    "                    throw new Error('请求失败: ' + response.status);\n"
    "                }\n",
    "                if (!response.ok) {\n"
    "                    const detail = await response.text().catch(() => '');\n"
    "                    if (response.status === 401 || response.status === 403) {\n"
    "                        throw new Error('密钥无效或已过期（HTTP ' + response.status + '），请点击右上角「🔑 密钥」重新设置。');\n"
    "                    }\n"
    "                    throw new Error('请求失败: ' + response.status + ' ' + detail.slice(0, 120));\n"
    "                }\n"
))

for old, new in REPS:
    cnt = t.count(old)
    if cnt != 1:
        print('!!! 匹配失败(%d): %s' % (cnt, old[:70].replace('\n', '\\n')))
        raise SystemExit(1)
    t = t.replace(old, new)

io.open(P, 'w', encoding='utf-8', newline='').write(t)

print('AI 页改造完成: %d -> %d bytes' % (len(orig), len(t)))
print()
print('=== 复查 ===')
for k, ok in [
    ('chat.php 已清除', 'api/chat.php' not in t),
    ('指向 DeepSeek', 'api.deepseek.com' in t),
    ('密钥存 localStorage', 'localStorage.getItem(KEY_STORE)' in t),
    ('系统提示词已注入', 'SYSTEM_PROMPT' in t),
    ('密钥按钮', 'setApiKey()">🔑' in t),
]:
    print('  %-22s %s' % (k, 'OK' if ok else '*** 异常 ***'))
    if not ok:
        raise SystemExit(1)
