# CPR Physio Sales Agent Portal

物理治療中心分銷商佣金管理系統。

## 已完成功能

### P1 - 核心功能
- ✅ 分銷商登入系統（管理員、總代理、二級代理）
- ✅ 分銷商佣金報表（儀表板 + 明細）
- ✅ 管理端基礎功能（分銷商管理 + 交易輸入）

### P2 - Excel 導入 + 預約系統
- ✅ Excel 批量導入交易記錄
- ✅ 預約管理（創建、更新、狀態管理）
- ✅ Google Calendar 對接預留接口

## 測試帳號

| 角色 | 電郵 | 密碼 |
|---|---|---|
| 管理員 | admin@cprphysio.hk | admin123 |
| 總代理 | agent1@cprphysio.hk | agent123 |
| 二級代理 | agent2@cprphysio.hk | agent123 |

## 待開發功能

- [ ] P3 - 二級代理層級支援
- [ ] P3 - 圖表視覺化
- [ ] Google Calendar 自動同步
- [ ] 佣金月結報告導出
- [ ] 英文介面

## 技術架構

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Bun + Hono API routes
- 認證: JWT (Bearer Token)
