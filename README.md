# CPR Physio Channel Partners Portal

物理治療中心 Channel Partners 與 Partner Earnings 管理系統。

## 已完成功能

### P1 - 核心功能
- ✅ Channel Partners 登入系統（管理員、Channel Partner）
- ✅ Partner Earnings 報表（儀表板 + 明細）
- ✅ 管理端基礎功能（Channel Partners 管理 + 交易輸入）

### P2 - Excel 導入 + 預約系統
- ✅ Excel 批量導入交易記錄
- ✅ 預約管理（創建、更新、狀態管理）
- ✅ Google Calendar 對接預留接口

## 測試帳號

| 角色 | 電郵 | 密碼 |
|---|---|---|
| 管理員 | admin@cprphysio.hk | admin123 |
| Channel Partner | partner1@cprphysio.hk | partner123 |
| Channel Partner | partner2@cprphysio.hk | partner123 |

## 待開發功能

- [ ] P3 - Channel Partner 層級支援
- [ ] P3 - 圖表視覺化
- [ ] Google Calendar 自動同步
- [ ] Partner Earnings 月結報告導出
- [ ] 英文介面

## 技術架構

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Bun + Hono API routes
- 認證: JWT (Bearer Token)
