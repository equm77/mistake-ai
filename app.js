// ==========================================
// 1. 全局配置 (Configuration)
// ==========================================
const GEMINI_API_KEY = "AQ.Ab8RN6JwabaP6YCYFvXPyHMCcQrV9W504ZZDlNn0rMcQ0Iaeuw";

// 本地存儲 key
const STORAGE_KEY = "mistake_ai_data";

// ==========================================
// 2. 狀態管理 (State Management)
// ==========================================
let mistakes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ==========================================
// 3. 頁面初始化與事件監聽
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    renderHomeStats();
    setupFormListeners();
});

// 導覽列切換
function initNavigation() {
    const navItems = document.querySelectorAll("nav a, .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = item.getAttribute("href")?.replace("#", "") || item.dataset.target;
            showSection(targetId);
            
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll("section, .page-section");
    sections.forEach(sec => {
        if (sec.id === sectionId) {
            sec.style.display = "block";
        } else {
            sec.style.display = "none";
        }
    });
}

// 渲染首頁數據
function renderHomeStats() {
    const totalElement = document.getElementById("total-count");
    if (totalElement) {
        totalElement.innerText = mistakes.length;
    }
}

// ==========================================
// 4. 表單與 AI 分析邏輯
// ==========================================
function setupFormListeners() {
    const form = document.getElementById("add-mistake-form");
    const imageInput = document.getElementById("image-input");
    const analyzeBtn = document.getElementById("analyze-btn");

    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", async () => {
            const file = imageInput?.files[0];
            if (!file) {
                alert("請先選擇或拍攝一張錯題照片！");
                return;
            }

            // 顯示載入狀態
            analyzeBtn.disabled = true;
            analyzeBtn.innerText = "AI 分析中，請稍候...";

            try {
                // 將圖片轉換為 Base64
                const base64Data = await convertFileToBase64(file);
                
                // 直接呼叫 Gemini API
                const analysisResult = await callGeminiAPI(base64Data, file.type);

                // 顯示結果
                const resultBox = document.getElementById("analysis-result");
                if (resultBox) {
                    resultBox.innerText = analysisResult;
                    resultBox.style.display = "block";
                }

                alert("分析成功！");
            } catch (error) {
                console.error("Analysis Error:", error);
                alert("分析失敗：" + error.message);
            } finally {
                analyzeBtn.disabled = false;
                analyzeBtn.innerText = "Analyze Mistake";
            }
        });
    }
}

// 工具函數：檔案轉 Base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// 5. 直接呼叫 Gemini API (Direct Frontend Call)
// ==========================================
async function callGeminiAPI(base64ImageWithHeader, mimeType) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("請先在 app.js 中填入有效的 GEMINI_API_KEY！");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // 提取純 Base64 字串
    const base64Data = base64ImageWithHeader.split(",")[1];

    const promptText = "你是一位精通 HKDSE 的專業導師。請分析這張錯題照片，輸出格式如下：\n1. 題目考點分析\n2. 正確答案與詳細解題步驟\n3. 學生常見錯誤原因提示";

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    {
                        inline_data: {
                            mime_type: mimeType || "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }
        ]
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "網路請求失敗");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
