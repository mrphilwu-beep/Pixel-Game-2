# Pixel Quest: 像素闖關問答遊戲 🎮

這是一個使用 React Vite 開發、採用 2000 年代復古街機像素風格 (Pixel Art) 的動態問答遊戲。
關主圖片由 **DiceBear Pixel-Art API** 隨機產生，而題目與結算成績則經由串接 **Google Apps Script** 讀寫 **Google Sheets**。

---

## 🛠️ 安裝與本地啟動

1. **安裝相依套件**：
   在專案根目錄 (`Pixel Game 2`) 下執行以下指令。
   ```bash
   npm install
   ```

2. **設定環境變數**：
   請確認根目錄下存有 `.env` 檔案（若無請自行建立），並加入以下設定：
   ```env
   # 指向您部署好的 Google Apps Script 網頁應用程式 URL
   VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/.../exec

   # 過關門檻 (需要答對幾題)
   VITE_PASS_THRESHOLD=3

   # 每次遊戲撈取的題目數量
   VITE_QUESTION_COUNT=5
   ```

3. **啟動本地開發伺服器**：
   ```bash
   npm run dev
   ```
   打開瀏覽器前往 [http://localhost:5173](http://localhost:5173) 即可開始遊玩！遇到無法連線後端時，系統會自動啟動內建的 Mock Data 測試模式。

---

## 📊 Google Sheets 建立與結構配置

請前往 Google 雲端硬碟建立一份全新的 **[ Google 試算表 ]**。並在底下建立 **兩個** 工作表（Sheet），名稱必須完全一致：

### 1. 工作表名稱：`題目`
請將第一列 (Row 1) 設為標題，依序填入：
- **A 欄**：`題號`
- **B 欄**：`題目`
- **C 欄**：`A` (選項 A 的內容)
- **D 欄**：`B`
- **E 欄**：`C`
- **F 欄**：`D`
- **G 欄**：`解答` (必須填入大寫的 A, B, C 或 D)

*(從第二列開始逐列填寫你的闖關考題)*

### 2. 工作表名稱：`回答`
請將第一列 (Row 1) 設為標題，依序填入：
- **A 欄**：`ID` 
- **B 欄**：`闖關次數`
- **C 欄**：`總分`
- **D 欄**：`最高分`
- **E 欄**：`第一次通關分數`
- **F 欄**：`花了幾次通關`
- **G 欄**：`最近遊玩時間`

*(資料會由 Google Apps Script 自動寫入，不需手動填寫)*

---

## 🚀 Google Apps Script (GAS) 後端部署教學

這段程式碼將做為前後端溝通的 API，讓 React 可以撈取「題目」與回傳「回答」。

1. 打開剛建立好的 Google 試算表，點選上方選單的 **「擴充功能」 -> 「Apps Script」**。
2. 將編輯器內原有的程式碼清空，並貼上以下完整程式碼：

```javascript
const SHEET_QUESTIONS = '題目';
const SHEET_ANSWERS = '回答';

// GET 請求：前端來要題目時觸發
function doGet(e) {
  const count = e.parameter.count ? parseInt(e.parameter.count) : 5;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUESTIONS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ questions: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0];
  const questions = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // 確切核對欄位順序: 0:題號, 1:題目, 2:A, 3:B, 4:C, 5:D, 6:解答
    questions.push({
      id: row[0],
      question: row[1],
      A: row[2],
      B: row[3],
      C: row[4],
      D: row[5],
      answer: row[6]
    });
  }
  
  // 隨機打亂題目順序並抽出指定數量 count 題
  questions.sort(() => 0.5 - Math.random());
  const selected = questions.slice(0, count);
  
  // 支援 CORS，利用 JSONP 或直接回傳 JSON 格式
  return ContentService.createTextOutput(JSON.stringify({ questions: selected }))
    .setMimeType(ContentService.MimeType.JSON);
}

// POST 請求：前端提交成績時觸發
function doPost(e) {
  // 加入 LockService 避免多人同時提交造成寫入衝突
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // 最多等待 10 秒
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'submitScore') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ANSWERS);
      const data = sheet.getDataRange().getValues();
      
      const { id, totalScore, passed, attempts } = body;
      const now = new Date();
      let foundIndex = -1;
      
      // 尋找是否已有相同 ID 的玩家
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          foundIndex = i;
          break;
        }
      }
      
      if (foundIndex > -1) {
        // [更新現有資料]
        const row = data[foundIndex];
        const totalAttempts = Number(row[1]) + 1; // 闖關次數 + 1
        const currentTotal = Number(row[2]) || 0;
        const currentHigh = Number(row[3]) || 0;
        
        let newFirstPassScore = row[4]; // 第一次通關分數
        let newPassAttempts = row[5];   // 花了幾次通關
        
        // 若先前未曾通關，但這次通關了，就記錄本次分數與嘗試次數
        if (passed && !newFirstPassScore) {
            newFirstPassScore = totalScore;
            newPassAttempts = totalAttempts;
        }
        
        const rowNum = foundIndex + 1;
        sheet.getRange(rowNum, 2).setValue(totalAttempts);
        sheet.getRange(rowNum, 3).setValue(currentTotal + totalScore);
        sheet.getRange(rowNum, 4).setValue(Math.max(currentHigh, totalScore));
        sheet.getRange(rowNum, 5).setValue(newFirstPassScore);
        sheet.getRange(rowNum, 6).setValue(newPassAttempts);
        sheet.getRange(rowNum, 7).setValue(now);

      } else {
        // [新增一筆玩家資料]
        const firstPassScore = passed ? totalScore : "";
        const passAttempts = passed ? 1 : "";
        // 欄位: ID, 闖關次數, 總分, 最高分, 第一次通關分數, 花了幾次通關, 最近遊玩時間
        sheet.appendRow([id, 1, totalScore, totalScore, firstPassScore, passAttempts, now]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 支援跨域請求 Preflight
function doOptions(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
```

3. **儲存並部署**：
   - 點擊上方藍色按鈕 **「部署」 -> 「新增部署作業」**。
   - 在左側「選取類型」點選齒輪圖示，選擇 **「網頁應用程式 (Web App)」**。
   - 描述可填入：`v1.0 API`
   - **執行身份**：選擇 **「我」**（擁有存取 Google 試算表權限的帳號）。
   - **誰可以存取**：必須選擇 **「所有人 (Anyone)」**。
   - 點擊 **「部署」**。

4. **授權與取得網址**：
   - 第一次佈署時，系統會要求「授予存取權」-> 點擊「進階」-> 點擊「前往 (由開發人員提供)」。
   - 部署完成後，會跑出一個 **網頁應用程式網址 (URL)**，長得像 `https://script.google.com/macros/s/XXXXXX/exec`。
   - **複製該網址，貼到你專案底下的 `.env` 檔案**：`VITE_GOOGLE_APP_SCRIPT_URL=這裡貼上網址`，然後重新啟動 `npm run dev`，專案就成功連動了！🎉

---

> 💡 **Tip:** 若要重新調整 API 邏輯：更改 Apps Script 程式碼後，一定要重新點擊 **「部署」 -> 「管理部署作業」 -> 點擊編輯(鉛筆) -> 將版本切換為「建立新版本」** 才會生效。

---

## 📝 10 題測試範例 (可直接複製貼上至 Google Sheets)

請反白複製下方的表格（包含標題行），打開你的 Google 試算表 `題目` 工作表，在 A1 儲存格點擊右鍵「貼上」，資料就會自動對齊分配到各個欄位！

| 題號 | 題目 | A | B | C | D | 解答 |
|---|---|---|---|---|---|---|
| 1 | 請問「React」是由哪間公司開發的？ | Google | Apple | Meta (Facebook) | Microsoft | C |
| 2 | 這個專案所使用的前端建置工具名稱是？ | Webpack | Vite | Parcel | Snowpack | B |
| 3 | 在 8-bit 的世界中，1 byte 等於多少 bits？ | 4 | 8 | 16 | 32 | B |
| 4 | CSS 的全名是什麼？ | Cascading Style Sheets | Creative Style System | Computer Style Sheets | Colorful Style System | A |
| 5 | 我們使用的像素風頭像生成 API 名稱是？ | PixelAvatar | DiceBear | 8bitMaker | RoboHash | B |
| 6 | 下列哪一個語言主要用於網頁前端邏輯控制？ | Python | Java | C++ | JavaScript | D |
| 7 | 在 HTML 中，代表最大的標題的元素是？ | h6 | title | head | h1 | D |
| 8 | 請問這套系統的關卡成績是存入哪裡？ | MySQL | 瀏覽器 localStorage | Google Sheets | MongoDB | C |
| 9 | 「JSON」的全稱是 JavaScript Object...? | Notation | Network | Navigation | Name | A |
| 10(魔王) | 要如何更新已經發布的 Google Apps Script？ | 按下儲存即可 | 要重新發布新版本 | 關閉分頁重開 | 無法更新 | B |

---

## 🌐 自動部署至 GitHub Pages

這個專案內建了 GitHub Actions 工作流程，當您推播程式碼到 `main` 或 `master` 分支時，會自動編譯並部署到 GitHub Pages。

### 部署圖文教學

1. **設定 Vite Base Path (重要)**
   打開你專案底下的 `vite.config.js`，在 `defineConfig` 中加入你的 Repo 名稱。假設你的 Repo 叫做 `pixel-quest`，就加上 `base: '/pixel-quest/'`：
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/你的Repo名稱/' // 👈 確保打包時路徑正確
   })
   ```

2. **在 GitHub 寫入環境變數 (Secrets)**
   由於 GitHub Actions 是在雲端編譯，它讀不到你本機的 `.env` 檔案，你需要手動把變數告訴 GitHub：
   - 進入你的 GitHub Repo 頁面。
   - 點擊 **Settings** -> **Secrets and variables** -> **Actions**。
   - 選擇 **Repository secrets**，點擊 **New repository secret** 依序新增以下變數（其值請參考 `.env.example`）：
     - `VITE_GOOGLE_APP_SCRIPT_URL`：填上你的 GAS URL (必填)
     - `VITE_PASS_THRESHOLD`：填 `3` (選填)
     - `VITE_QUESTION_COUNT`：填 `5` (選填)

3. **開啟 GitHub Pages 權限**
   - 點擊 Repo 的 **Settings** -> 左側選單的 **Pages**。
   - 在 **Build and deployment** 區塊，將 **Source** 改為 **`GitHub Actions`**。

4. **推播程式碼**
   完成上述設定後，只要 `git push` 到 GitHub，切換到 **Actions** 頁籤就能看到自動編譯與佈署正在進行。部署完成後，即可在 Pages 區塊看見你的遊戲線上網址！
