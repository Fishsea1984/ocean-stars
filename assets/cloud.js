/**
 * 星海之境 · WorkBuddy 云客户端初始化（纯 HTML 站点，无构建步骤）
 *
 * publicConfig 来自「开启云服务」后返回的字段，属前端可公开配置：
 *   endpoint      —— 当前应用的线上数据面地址（必须随 publicConfig 传入，禁止写死/从 location 推断）
 *   publishableKey —— 仅标识应用、自身不含任何权限，可放前端
 *
 * 初始化一次，全站共用同一个 cloud 实例。任何其他模块都从这里取 cloud.database / cloud.storage。
 */
(function () {
  // 这些值由 WorkBuddy 云服务开通后生成；改动需重新从 publicConfig 同步。
  window.OCEAN_CLOUD_CONFIG = {
    endpoint: "https://ocean-stars.app.workbuddy.host",
    publishableKey: "wbpk_zkjkLlABcLNHn5vwsXFGjz_pjB2ANQ6De1jN5Gri3YaZIpM5HO8Hu12",
    oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth"
  };

  function boot() {
    if (typeof window.WorkBuddyCloud === "undefined") {
      console.warn("[cloud] SDK 未加载：cloud-sdk.global.js 可能加载失败");
      window.OceanCloud = null;
      return;
    }
    try {
      window.OceanCloud = window.WorkBuddyCloud.createWorkBuddyCloud({
        endpoint: window.OCEAN_CLOUD_CONFIG.endpoint,
        publishableKey: window.OCEAN_CLOUD_CONFIG.publishableKey
      });
    } catch (e) {
      console.error("[cloud] 初始化失败", e);
      window.OceanCloud = null;
    }
  }

  // cloud-sdk.global.js 在本脚本之前已同步加载，可直接初始化；
  // 若极端情况下 SDK 尚未就绪（如被改为 async/defer），则回退到 DOMContentLoaded 再初始化一次，
  // 保证 window.OceanCloud 在玄门云存档 IIFE 读取前已就绪。
  if (typeof window.WorkBuddyCloud !== "undefined") {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
