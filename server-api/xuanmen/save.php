<?php
/**
 * 玄门问道 · 云端存档接口（单文件，无需数据库）
 *
 *   GET  ?action=ping             健康检查
 *   GET  ?action=load&key=存档码   读取存档
 *   POST {"key":"存档码","data":"存档内容"}   写入存档
 *
 * 安全设计：
 *   - 存档码只做正则白名单校验，文件名一律用 sha256(存档码)，杜绝路径穿越
 *   - 单份存档 512KB 上限、存档总数 2000 上限，防止被人刷爆磁盘
 *   - 按 IP 做 5 分钟窗口限流（读 300 次 / 写 60 次）
 *   - 原子写入（临时文件 + rename），断电也不会写坏存档
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* ============ CORS：填了自己的站点域名就把下面的注释打开 ============ */
$allowedOrigins = array(
    // 'https://你的用户名.github.io',
    // 'http://localhost:8000',
);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
if (count($allowedOrigins) > 0) {
    if (in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
} else {
    header('Access-Control-Allow-Origin: *');   // 未配置时允许任意来源（无 Cookie，无 CSRF 风险）
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ============ 参数 ============ */
const MAX_BYTES   = 524288;   // 单份存档 512KB
const MAX_FILES   = 2000;     // 存档总数上限
const WINDOW      = 300;      // 限流窗口（秒）
const WRITE_LIMIT = 60;       // 窗口内写入次数
const READ_LIMIT  = 300;      // 窗口内读取次数

$SAVE_DIR = __DIR__ . '/saves';
$RATE_DIR = __DIR__ . '/.rate';

/* ============ 小工具 ============ */
function out(array $arr, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

function clientIp(): string
{
    return isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : 'unknown';
}

function limited(string $dir, string $ip, string $bucket, int $limit): bool
{
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $file = $dir . '/' . sha1($ip . '|' . $bucket) . '.txt';
    $now  = time();
    $hits = array();
    if (is_file($file)) {
        $raw = (string)@file_get_contents($file);
        foreach (explode(',', $raw) as $t) {
            $t = (int)$t;
            if ($t > $now - WINDOW) {
                $hits[] = $t;
            }
        }
    }
    if (count($hits) >= $limit) {
        return true;
    }
    $hits[] = $now;
    if (count($hits) > $limit) {
        $hits = array_slice($hits, -$limit);
    }
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}

function validKey(string $k): bool
{
    return (bool)preg_match('/^[A-Za-z0-9_-]{16,64}$/', $k);
}

function saveFile(string $dir, string $key): string
{
    return $dir . '/' . hash('sha256', $key) . '.json';
}

/* ============ 健康检查 ============ */
$action = isset($_REQUEST['action']) ? (string)$_REQUEST['action'] : '';

if ($action === 'ping') {
    out(array('ok' => true, 'service' => 'xuanmen-save', 'time' => time()));
}

/* ============ 存档目录 ============ */
if (!is_dir($SAVE_DIR) && !@mkdir($SAVE_DIR, 0755, true)) {
    out(array('ok' => false, 'error' => '服务端存档目录不可写，请检查权限'), 500);
}

/* ============ 读取 ============ */
if ($action === 'load') {
    if (limited($RATE_DIR, clientIp(), 'read', READ_LIMIT)) {
        out(array('ok' => false, 'error' => '请求过于频繁，请稍后再试'), 429);
    }
    $key = isset($_GET['key']) ? (string)$_GET['key'] : '';
    if (!validKey($key)) {
        out(array('ok' => false, 'error' => '存档码格式不正确（16-64 位字母数字）'), 400);
    }
    $file = saveFile($SAVE_DIR, $key);
    if (!is_file($file)) {
        out(array('ok' => true, 'exists' => false));
    }
    $j = json_decode((string)@file_get_contents($file), true);
    if (!is_array($j) || !isset($j['data']) || !is_string($j['data'])) {
        out(array('ok' => false, 'error' => '存档文件已损坏'), 500);
    }
    out(array(
        'ok'      => true,
        'exists'  => true,
        'updated' => (int)($j['updated'] ?? 0),
        'size'    => (int)($j['size'] ?? strlen($j['data'])),
        'data'    => $j['data'],
    ));
}

/* ============ 写入 ============ */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(array('ok' => false, 'error' => '读取数据请用 GET，写入请用 POST'), 405);
}

if (limited($RATE_DIR, clientIp(), 'write', WRITE_LIMIT)) {
    out(array('ok' => false, 'error' => '写入过于频繁，请稍后再试'), 429);
}

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) {
    out(array('ok' => false, 'error' => '请求体不是合法 JSON'), 400);
}

$key = isset($in['key']) ? (string)$in['key'] : '';
if (!validKey($key)) {
    out(array('ok' => false, 'error' => '存档码格式不正确（16-64 位字母数字）'), 400);
}
if (!isset($in['data']) || !is_string($in['data'])) {
    out(array('ok' => false, 'error' => '缺少存档内容'), 400);
}
if (strlen($in['data']) > MAX_BYTES) {
    out(array('ok' => false, 'error' => '存档超过 ' . (MAX_BYTES / 1024) . 'KB 上限'), 413);
}

$file = saveFile($SAVE_DIR, $key);
if (!is_file($file)) {
    $existing = glob($SAVE_DIR . '/*.json');
    if (is_array($existing) && count($existing) >= MAX_FILES) {
        out(array('ok' => false, 'error' => '存档空间已满'), 507);
    }
}

$payload = json_encode(array(
    'updated' => time(),
    'size'    => strlen($in['data']),
    'data'    => $in['data'],
), JSON_UNESCAPED_UNICODE);

$tmp = $file . '.tmp.' . (string)getmypid();
if (@file_put_contents($tmp, $payload, LOCK_EX) === false) {
    out(array('ok' => false, 'error' => '写入失败，请检查目录权限'), 500);
}
if (!@rename($tmp, $file)) {
    @unlink($tmp);
    out(array('ok' => false, 'error' => '写入失败，请检查目录权限'), 500);
}
@chmod($file, 0644);

out(array('ok' => true, 'updated' => time(), 'size' => strlen($in['data'])));
