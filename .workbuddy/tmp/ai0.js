
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        let isGenerating = false;
        let messageHistory = [];

        // ===== 纯静态站点：浏览器直连 DeepSeek，密钥只保存在本机浏览器 =====
        const API_URL = 'https://api.deepseek.com/chat/completions';
        const KEY_STORE = 'xinghai_deepseek_key';
        const SYSTEM_PROMPT = "你是\"星海之境\"网站的AI政策咨询助手，专门解答长治市潞州区房屋征收与补偿相关政策问题。\n\n你的知识基于以下官方文件和政策数据：\n\n【文件1】潞州政办发[2026]6号 - 英雄路等道路更新改造项目房屋征收补偿安置方案\n- 征收范围：英雄路、延安路、长兴路、威远门路、西二环路、站前路、紫金东西街、府后东西街、东大街、西大街、解放东西街道路两侧\n- 签约期限：发布征收决定公告之日起20天内\n- 补偿方式：实物安置或货币补偿（二选一）\n- 独院补偿安置面积认定：二层以下建筑面积小于土地面积1.5倍，按1.5倍认定；大于1.5倍按现状认定，上限不超过2倍\n- 三层及以上：有证件按商品房评估价补偿不置换；无证件按700元/m²建安成本补偿\n- 经营性补助：住宅改营业房有合法手续的，500元/m²\n- 搬迁补助：住宅20元/m²（实物安置2次，货币1次）；商业80、生产100、办公50、仓储80元/m²\n- 过渡费：15元/月/m²，实物安置期房24个月，货币补偿6个月\n- 面积奖：400元/m²，上限200m²；单元式住宅额外10m²\n- 交房奖：2万元\n- 安置房：潞府花园、惠民新城、圣人澧园等\n\n【文件2】长政规〔2023〕2号 - 长治市人民政府关于规范潞州区房屋征收与补偿工作的通知\n- 适用范围：潞州区范围内\n- 分户认定：一房多证按一户，多房一证按一户；有独立结构、通道、配套设施的可分户\n- 货币补偿享受\"三补一奖\"：房屋补偿+附着物补偿+政策性补助+政策性奖励\n- 实物安置：等量置换、以旧换新、先签先选；超20m²内按成本价，超20m²按市场价\n- 搬迁补助：住宅20元/m²；商业80、生产100、办公50、仓储80元/m²\n- 过渡费：15元/月/m²；货币补偿6个月\n- 停产停业补助：根据上一年度纳税情况，工资补偿+经营补偿，全部停业不超过6个月\n- 签约交房奖：10万元/户\n- 面积奖：单元式住宅每户10m²\n- 施行日期：2024年1月1日，有效期2年\n\n【文件3】潞州政办发[2026]4号 - 上党门片区城市更新改造项目房屋征收补偿安置方案\n- 征收范围：英雄中路东片区（英雄中路以东、牛家才道巷以南、长兴中路以西、东大街以北）；西片区（二中东围墙以东、上党门以东、东华门巷、长运家属院等区域）\n- 签约期限：发布签约通知起30日内\n- 补偿方式：实物安置或货币补偿（二选一）\n- 面积认定：同英雄路方案（1.5倍/2倍规则）\n- 搬迁补助：住宅20元/m²；过渡费15元/月/m²\n- 经营性补助：500元/m²\n- 面积奖：400元/m²上限200m²；单元式10m²\n- 交房奖：2万元\n- 安置房现房：潞府花园（成本价6000/市场价9678）、圣人澧园（3580）、北寨（成本7339/市场7965）、小常（成本7389/市场7809）\n\n【其他工具数据】\n- 网站提供鞋帽厂片区、上党门片区、华东城中村三个征收补偿计算器\n- 史家大院16户土地分摊计算（总占地811.739m²）\n- 鱼氏家族6户土地分摊计算\n\n回答要求：\n1. 基于以上政策数据准确回答，引用具体文件条款\n2. 如果问题超出政策范围，请明确说明\n3. 涉及具体金额计算时，给出详细计算过程\n4. 语气友好专业，使用简体中文\n5. 如果用户问的是补偿计算，尽量给出具体数字结果";

        function getApiKey() {
            return (localStorage.getItem(KEY_STORE) || '').trim();
        }

        function setApiKey() {
            const cur = getApiKey();
            const tip = cur
                ? '已保存密钥：' + cur.slice(0, 4) + '****' + cur.slice(-4)
                  + '\n\n输入新密钥可覆盖，留空并确定则删除。'
                : '本站为纯静态站点，AI 功能由你自己的 DeepSeek API Key 驱动。'
                  + '\n密钥只保存在你这台设备的浏览器里，不会上传到任何服务器。'
                  + '\n\n没有密钥？到 platform.deepseek.com 注册即可领取。';
            const v = prompt(tip, '');
            if (v === null) return;
            if (v.trim() === '') { localStorage.removeItem(KEY_STORE); alert('已删除本机密钥。'); }
            else { localStorage.setItem(KEY_STORE, v.trim()); alert('密钥已保存到本机浏览器。'); }
        }

        // 自动调整输入框高度
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // 键盘事件
        function handleKeyDown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }

        // 快捷问题
        function askQuestion(question) {
            chatInput.value = question;
            sendMessage();
        }

        // 清空对话
        function clearChat() {
            if (!confirm('确定要清空所有对话记录吗？')) return;
            messageHistory = [];
            chatMessages.innerHTML = `
                <div class="message assistant">
                    <div class="message-avatar">🤖</div>
                    <div class="message-bubble">
                        <p>对话已清空。请输入新的问题开始咨询。</p>
                    </div>
                </div>
                <div class="quick-questions">
                    <button class="quick-btn" onclick="askQuestion('英雄路征收补偿方案有哪些奖励？')">奖励政策</button>
                    <button class="quick-btn" onclick="askQuestion('独院房屋补偿面积怎么认定？')">面积认定</button>
                    <button class="quick-btn" onclick="askQuestion('货币补偿和实物安置哪个更划算？')">补偿方式对比</button>
                    <button class="quick-btn" onclick="askQuestion('上党门片区安置房有哪些小区？价格多少？')">安置房源</button>
                    <button class="quick-btn" onclick="askQuestion('经营性房屋征收有哪些补助？')">经营补助</button>
                    <button class="quick-btn" onclick="askQuestion('过渡费怎么计算？发多久？')">过渡费</button>
                </div>
            `;
        }

        // 发送消息
        async function sendMessage() {
            const text = chatInput.value.trim();
            if (!text || isGenerating) return;

            // 添加用户消息
            appendMessage('user', text);
            messageHistory.push({ role: 'user', content: text });

            // 清空输入框
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // 显示加载状态
            isGenerating = true;
            sendBtn.disabled = true;
            const loadingEl = appendLoading();

            try {
                // 调用 DeepSeek（流式，密钥来自本机 localStorage）
                const apiKey = getApiKey();
                if (!apiKey) {
                    loadingEl.remove();
                    setApiKey();
                    throw new Error('已取消：未设置 API Key');
                }
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(
                            messageHistory.slice(-10)
                                .filter(m => m.role === 'user' || m.role === 'assistant')
                                .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }))
                        ),
                        temperature: 0.3,
                        max_tokens: 2000,
                        stream: true
                    })
                });

                // 移除加载指示器
                loadingEl.remove();

                if (!response.ok) {
                    const detail = await response.text().catch(() => '');
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('密钥无效或已过期（HTTP ' + response.status + '），请点击右上角「🔑 密钥」重新设置。');
                    }
                    throw new Error('请求失败: ' + response.status + ' ' + detail.slice(0, 120));
                }

                // 创建AI消息气泡
                const aiMsgEl = appendMessage('assistant', '');
                const bubbleEl = aiMsgEl.querySelector('.message-bubble');
                let fullContent = '';

                // 读取流式响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data:')) continue;

                        const data = trimmed.slice(5).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta?.content;
                            if (delta) {
                                fullContent += delta;
                                bubbleEl.innerHTML = formatMarkdown(fullContent);
                                scrollToBottom();
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }

                // 保存AI回复到历史
                if (fullContent) {
                    messageHistory.push({ role: 'assistant', content: fullContent });
                }

            } catch (error) {
                loadingEl.remove();
                appendMessage('assistant', '抱歉，请求出现错误：' + error.message + '\n\n请检查网络连接或稍后重试。');
            } finally {
                isGenerating = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        }

        // 添加消息气泡
        function appendMessage(role, content) {
            const div = document.createElement('div');
            div.className = `message ${role}`;
            const avatar = role === 'user' ? '👤' : '🤖';
            div.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-bubble">${content ? formatMarkdown(content) : ''}</div>
            `;
            chatMessages.appendChild(div);
            scrollToBottom();
            return div;
        }

        // 添加加载指示器
        function appendLoading() {
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            chatMessages.appendChild(div);
            scrollToBottom();
            return div;
        }

        // 简单的Markdown格式化
        function formatMarkdown(text) {
            return text
                // 标题
                .replace(/^### (.+)$/gm, '<strong style="font-size:1rem;">$1</strong>')
                .replace(/^## (.+)$/gm, '<strong style="font-size:1.1rem;">$1</strong>')
                .replace(/^# (.+)$/gm, '<strong style="font-size:1.2rem;">$1</strong>')
                // 粗体
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // 行内代码
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                // 无序列表
                .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
                // 有序列表
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                // 换行
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
        }

        // 滚动到底部
        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    