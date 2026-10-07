/**
 * 星海之境 · 工具页面密码保护
 * 在工具页面 <body> 开头引入：<script src="auth.js"></script>
 */
(function() {
    const AUTH_KEY = 'ocean_stars_tool_auth';
    const EXPIRE_HOURS = 2; // 登录有效期2小时
    const CORRECT_PASSWORD = '7777777';

    // 检查是否已登录
    function isAuthenticated() {
        const data = sessionStorage.getItem(AUTH_KEY);
        if (!data) return false;
        try {
            const { time } = JSON.parse(data);
            const now = Date.now();
            const hours = (now - time) / (1000 * 60 * 60);
            return hours < EXPIRE_HOURS;
        } catch (e) {
            return false;
        }
    }

    // 标记登录
    function setAuthenticated() {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify({ time: Date.now() }));
    }

    // 清除登录
    function clearAuth() {
        sessionStorage.removeItem(AUTH_KEY);
    }

    // 创建密码覆盖层
    function createAuthOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'toolAuthOverlay';
        overlay.innerHTML = `
            <div class="auth-overlay">
                <div class="auth-box">
                    <div class="auth-icon">🔒</div>
                    <h2 class="auth-title">验证访问</h2>
                    <p class="auth-desc">该页面包含敏感数据，请输入密码后继续</p>
                    <div class="auth-form">
                        <input type="password" id="authPassword" placeholder="请输入密码" autocomplete="off">
                        <button id="authSubmit" onclick="window.__toolAuthLogin()">进入</button>
                    </div>
                    <div class="auth-error" id="authError"></div>
                    <div class="auth-hint">忘记密码请联系管理员</div>
                </div>
            </div>
        `;
        document.body.insertBefore(overlay, document.body.firstChild);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .auth-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(2, 6, 15, 0.92);
                backdrop-filter: blur(20px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: authFadeIn 0.4s ease;
            }
            @keyframes authFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .auth-box {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(0, 240, 255, 0.15);
                border-radius: 24px;
                padding: 2.5rem;
                width: 90%;
                max-width: 380px;
                text-align: center;
                backdrop-filter: blur(30px);
                box-shadow: 0 0 60px rgba(0, 240, 255, 0.08);
            }
            .auth-icon {
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            .auth-title {
                font-family: 'Noto Serif SC', serif;
                font-size: 1.3rem;
                color: var(--text-primary, #e0e6ed);
                margin-bottom: 0.5rem;
            }
            .auth-desc {
                font-size: 0.85rem;
                color: var(--text-secondary, #94a3b8);
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }
            .auth-form {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .auth-form input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 240, 255, 0.2);
                border-radius: 12px;
                color: var(--text-primary, #e0e6ed);
                font-size: 1rem;
                outline: none;
                transition: all 0.3s;
                text-align: center;
                letter-spacing: 2px;
            }
            .auth-form input:focus {
                border-color: rgba(0, 240, 255, 0.5);
                box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
            }
            .auth-form input::placeholder {
                color: var(--text-secondary, #94a3b8);
                letter-spacing: normal;
            }
            .auth-form button {
                padding: 12px;
                background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 200, 255, 0.1));
                border: 1px solid rgba(0, 240, 255, 0.3);
                border-radius: 12px;
                color: var(--bioluminescent, #00f0ff);
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.3s;
            }
            .auth-form button:hover {
                background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(0, 200, 255, 0.2));
                box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
            }
            .auth-error {
                font-size: 0.8rem;
                color: #ff6b6b;
                margin-top: 0.5rem;
                min-height: 1.2rem;
            }
            .auth-hint {
                font-size: 0.75rem;
                color: var(--text-secondary, #94a3b8);
                opacity: 0.5;
                margin-top: 1rem;
            }
            .auth-overlay.hidden {
                animation: authFadeOut 0.3s ease forwards;
            }
            @keyframes authFadeOut {
                to { opacity: 0; visibility: hidden; }
            }
        `;
        document.head.appendChild(style);

        // 绑定回车事件
        const input = document.getElementById('authPassword');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') window.__toolAuthLogin();
            });
            setTimeout(() => input.focus(), 100);
        }
    }

    // 登录函数
    window.__toolAuthLogin = function() {
        const input = document.getElementById('authPassword');
        const error = document.getElementById('authError');
        const overlay = document.getElementById('toolAuthOverlay');
        if (!input) return;

        const pwd = input.value.trim();
        if (!pwd) {
            if (error) error.textContent = '请输入密码';
            return;
        }

        if (pwd === CORRECT_PASSWORD) {
            setAuthenticated();
            if (overlay) overlay.classList.add('hidden');
            setTimeout(() => {
                if (overlay) overlay.remove();
            }, 300);
        } else {
            if (error) error.textContent = '密码错误，请重试';
            input.value = '';
            input.focus();
        }
    };

    // 页面加载时执行
    if (!isAuthenticated()) {
        // 等待DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createAuthOverlay);
        } else {
            createAuthOverlay();
        }
    }
})();
