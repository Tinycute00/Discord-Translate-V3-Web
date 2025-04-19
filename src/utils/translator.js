/**
 * 翻譯工具模塊
 * 提供多種翻譯API的統一接口
 */
const axios = require('axios');

// 翻譯API設定
const translationServices = {
  deepl: {
    enabled: !!process.env.DEEPL_API_KEY,
    apiKey: process.env.DEEPL_API_KEY,
    baseUrl: 'https://api-free.deepl.com/v2/translate',
    defaultParams: {}
  },
  google: {
    enabled: !!process.env.GOOGLE_API_KEY,
    apiKey: process.env.GOOGLE_API_KEY,
    baseUrl: 'https://translation.googleapis.com/language/translate/v2',
    defaultParams: {}
  },
  microsoft: {
    enabled: !!process.env.MICROSOFT_TRANSLATOR_KEY,
    apiKey: process.env.MICROSOFT_TRANSLATOR_KEY,
    region: process.env.MICROSOFT_TRANSLATOR_REGION || 'global',
    baseUrl: 'https://api.cognitive.microsofttranslator.com',
    defaultParams: {}
  }
};

// 支援的語言映射表
const supportedLanguages = {
  // 常用語言代碼
  'en': { name: '英文', deepl: 'EN', google: 'en', microsoft: 'en' },
  'zh-TW': { name: '繁體中文', deepl: 'ZH', google: 'zh-TW', microsoft: 'zh-Hant' },
  'zh-CN': { name: '簡體中文', deepl: 'ZH', google: 'zh-CN', microsoft: 'zh-Hans' },
  'ja': { name: '日文', deepl: 'JA', google: 'ja', microsoft: 'ja' },
  'ko': { name: '韓文', deepl: 'KO', google: 'ko', microsoft: 'ko' },
  'fr': { name: '法文', deepl: 'FR', google: 'fr', microsoft: 'fr' },
  'de': { name: '德文', deepl: 'DE', google: 'de', microsoft: 'de' },
  'es': { name: '西班牙文', deepl: 'ES', google: 'es', microsoft: 'es' },
  'it': { name: '義大利文', deepl: 'IT', google: 'it', microsoft: 'it' },
  'ru': { name: '俄文', deepl: 'RU', google: 'ru', microsoft: 'ru' },
  'pt': { name: '葡萄牙文', deepl: 'PT', google: 'pt', microsoft: 'pt' },
  'nl': { name: '荷蘭文', deepl: 'NL', google: 'nl', microsoft: 'nl' },
  'pl': { name: '波蘭文', deepl: 'PL', google: 'pl', microsoft: 'pl' },
  'ar': { name: '阿拉伯文', deepl: null, google: 'ar', microsoft: 'ar' },
  'hi': { name: '印地文', deepl: null, google: 'hi', microsoft: 'hi' },
  'th': { name: '泰文', deepl: null, google: 'th', microsoft: 'th' },
  'vi': { name: '越南文', deepl: null, google: 'vi', microsoft: 'vi' },
  'tr': { name: '土耳其文', deepl: 'TR', google: 'tr', microsoft: 'tr' }
};

/**
 * 使用DeepL API進行翻譯
 * @param {string} text - 要翻譯的文本
 * @param {string} targetLang - 目標語言代碼
 * @returns {Promise<string>} - 翻譯後的文本
 */
async function translateWithDeepL(text, targetLang) {
  try {
    const langCode = supportedLanguages[targetLang]?.deepl || targetLang;
    const response = await axios.post(
      translationServices.deepl.baseUrl,
      {
        text: [text],
        target_lang: langCode
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${translationServices.deepl.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.translations[0].text;
  } catch (error) {
    console.error('DeepL翻譯失敗:', error.message);
    throw new Error(`DeepL翻譯失敗: ${error.message}`);
  }
}

/**
 * 使用Google Translate API進行翻譯
 * @param {string} text - 要翻譯的文本
 * @param {string} targetLang - 目標語言代碼
 * @returns {Promise<string>} - 翻譯後的文本
 */
async function translateWithGoogle(text, targetLang) {
  try {
    const langCode = supportedLanguages[targetLang]?.google || targetLang;
    const response = await axios.post(
      `${translationServices.google.baseUrl}?key=${translationServices.google.apiKey}`,
      {
        q: text,
        target: langCode
      }
    );

    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Google翻譯失敗:', error.message);
    throw new Error(`Google翻譯失敗: ${error.message}`);
  }
}

/**
 * 使用Google Translate API檢測文本語言
 * @param {string} text - 要檢測語言的文本
 * @returns {Promise<string>} - 檢測到的語言代碼
 */
async function detectLanguageWithGoogle(text) {
  try {
    const response = await axios.post(
      `${translationServices.google.baseUrl}/detect?key=${translationServices.google.apiKey}`,
      {
        q: text
      }
    );

    const detectedLanguage = response.data.data.detections[0][0].language;
    console.log(`檢測到語言: ${detectedLanguage}`);
    return detectedLanguage;
  } catch (error) {
    console.error('Google語言檢測失敗:', error.message);
    throw new Error(`Google語言檢測失敗: ${error.message}`);
  }
}

/**
 * 使用Microsoft Azure Translator API進行翻譯
 * @param {string} text - 要翻譯的文本
 * @param {string} targetLang - 目標語言代碼
 * @param {string} sourceLang - 源語言代碼（可選）
 * @returns {Promise<string>} - 翻譯後的文本
 */
async function translateWithMicrosoft(text, targetLang, sourceLang = null) {
  try {
    const targetLangCode = supportedLanguages[targetLang]?.microsoft || targetLang;
    
    const options = {
      method: 'POST',
      baseURL: translationServices.microsoft.baseUrl,
      url: '/translate',
      params: {
        'api-version': '3.0',
        'to': targetLangCode
      },
      headers: {
        'Ocp-Apim-Subscription-Key': translationServices.microsoft.apiKey,
        'Ocp-Apim-Subscription-Region': translationServices.microsoft.region,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuid().toString()
      },
      data: [{
        'text': text
      }],
      responseType: 'json'
    };
    
    if (sourceLang) {
      options.params.from = supportedLanguages[sourceLang]?.microsoft || sourceLang;
    }
    
    const response = await axios(options);
    
    if (response.data && response.data.length > 0 && 
        response.data[0].translations && 
        response.data[0].translations.length > 0) {
      return response.data[0].translations[0].text;
    } else {
      throw new Error('翻譯結果格式無效');
    }
  } catch (error) {
    console.error('Microsoft翻譯失敗:', error.message);
    throw new Error(`Microsoft翻譯失敗: ${error.message}`);
  }
}

/**
 * 生成UUID
 * @returns {string} UUID
 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 檢測文本語言
 * @param {string} text - 要檢測的文本
 * @returns {Promise<string>} - 檢測到的語言代碼
 */
async function detectLanguage(text) {
  // 優先使用Google的語言檢測
  if (translationServices.google.enabled) {
    try {
      return await detectLanguageWithGoogle(text);
    } catch (error) {
      console.warn('Google語言檢測失敗，嘗試使用Microsoft:', error.message);
    }
  }

  // 如果Google不可用或失敗，使用Microsoft
  if (translationServices.microsoft.enabled) {
    try {
      return await detectLanguageWithMicrosoft(text);
    } catch (error) {
      console.error('所有語言檢測服務都失敗:', error.message);
      throw error;
    }
  }

  throw new Error('沒有可用的語言檢測服務');
}

/**
 * 統一的翻譯函數
 * @param {string} text - 要翻譯的文本
 * @param {string} targetLang - 目標語言代碼
 * @param {string} sourceLang - 源語言代碼（可選）
 * @returns {Promise<string>} - 翻譯後的文本
 */
async function translate(text, targetLang, sourceLang = null) {
  // 如果沒有提供源語言，嘗試檢測
  if (!sourceLang) {
    try {
      sourceLang = await detectLanguage(text);
    } catch (error) {
      console.warn('語言檢測失敗，繼續翻譯但可能影響準確性:', error.message);
    }
  }

  // 嘗試使用可用的翻譯服務
  const errors = [];

  // 優先使用DeepL（如果可用且支援目標語言）
  if (translationServices.deepl.enabled && supportedLanguages[targetLang]?.deepl) {
    try {
      return await translateWithDeepL(text, targetLang);
    } catch (error) {
      errors.push(`DeepL: ${error.message}`);
    }
  }

  // 然後嘗試Google
  if (translationServices.google.enabled) {
    try {
      return await translateWithGoogle(text, targetLang);
    } catch (error) {
      errors.push(`Google: ${error.message}`);
    }
  }

  // 最後嘗試Microsoft
  if (translationServices.microsoft.enabled) {
    try {
      return await translateWithMicrosoft(text, targetLang, sourceLang);
    } catch (error) {
      errors.push(`Microsoft: ${error.message}`);
    }
  }

  // 如果所有服務都失敗了，拋出錯誤
  throw new Error(`所有翻譯服務都失敗:\n${errors.join('\n')}`);
}

/**
 * 獲取支援的語言列表
 * @returns {Object} - 支援的語言列表
 */
function getSupportedLanguages() {
  return supportedLanguages;
}

// 導出需要的函數
module.exports = {
  translate,
  detectLanguage,
  getSupportedLanguages
};