const fs = require('fs');
const path = require('path');

let localeStrings = {}; // 用於緩存從 JSON 檔案讀取的語言字串

/**
 * 初始化本地化模組，讀取語言檔案。
 * 應在應用程式啟動時調用一次。
 */
function initializeLocalization() {
    // 構建相對於目前檔案的 localeStrings.json 路徑
    const filePath = path.join(__dirname, '../../data/localeStrings.json');
    try {
        // 同步讀取檔案內容
        const data = fs.readFileSync(filePath, 'utf8');
        // 解析 JSON 內容並存入緩存
        localeStrings = JSON.parse(data);
        console.log('Localization strings loaded successfully. (本地化字串載入成功)');
    } catch (error) {
        console.error('Failed to load or parse localization strings file (無法載入或解析本地化字串檔案):', filePath, error);
        // 在出現錯誤時保持 localeStrings 為空物件，避免後續 getText 出錯
        localeStrings = {};
    }
}

/**
 * 根據提供的鍵名獲取格式化的雙語字串。
 * @param {string} key - 在 localeStrings.json 中定義的鍵名。
 * @returns {string} 格式為 "English Text (中文文本)" 的字串，如果找不到鍵則返回錯誤提示。
 */
function getText(key) {
    const entry = localeStrings[key];

    // 檢查是否存在該鍵以及是否包含 en 和 zh-TW 屬性
    if (entry && typeof entry === 'object' && entry.en && entry['zh-TW']) {
        // 返回格式化的雙語字串
        return `${entry.en} (${entry['zh-TW']})`;
    } else {
        // 如果鍵不存在或結構不完整，記錄警告並返回提示字串
        console.warn(`Localization key "${key}" not found or incomplete in localeStrings.json. (本地化鍵 "${key}" 在 localeStrings.json 中未找到或不完整)`);
        return `KeyNotFound: ${key} (鍵未找到：${key})`;
    }
}

// 導出需要在其他模組中使用的函數
module.exports = {
    initializeLocalization,
    getText,
};