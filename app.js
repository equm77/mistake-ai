// ==========================================
// 1. 本地存儲設定
// ==========================================
const STORAGE_KEY = "mistake_ai_data";
let mistakes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ==========================================
// 2. 頁面初始化
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    renderHomeStats();
    renderMistakesList();
    setupFormListeners();
});

// 導覽列頁面切換
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
    if (!sectionId) return;
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

// 渲染已儲存的錯題列表
function renderMistakesList() {
    const listContainer = document.getElementById("mistakes-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (mistakes.length === 0) {
        listContainer.innerHTML = "<p style='text-align:center; color:#888;'>目前還沒有儲存任何照片。</p >";
        return;
    }

    mistakes.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "mistake-card";
        card.style.cssText = "background:#fff; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #ddd;";
        card.innerHTML = `
            <div style="font-size:12px; color:#666; margin-bottom:6px;">科目：${item.subject} | 時間：${item.date}</div>
            < img src="${item.image}" style="max-width:100%; border-radius:6px; display:block; margin-bottom:8px;">
            <button onclick="deleteMistake(${index})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">刪除照片</button>
        `;
        listContainer.appendChild(card);
    });
}

// 刪除紀錄
function deleteMistake(index) {
    mistakes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
    renderHomeStats();
    renderMistakesList();
}

// ==========================================
// 3. 上傳與儲存照片邏輯
// ==========================================
function setupFormListeners() {
    const saveBtn = document.getElementById("analyze-btn") || document.querySelector("button.analyze-btn");
    const imageInput = document.getElementById("image-input") || document.querySelector("input[type='file']");
    const subjectSelect = document.getElementById("subject-select") || document.querySelector("select");

    if (saveBtn) {
        // 修改按鈕顯示文字
        saveBtn.innerText = "儲存照片";

        saveBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const file = imageInput?.files[0];
            if (!file) {
                alert("請先選擇或拍攝一張照片！");
                return;
            }

            try {
                // 將圖片轉為 Base64 字串儲存
                const imageBase64 = await convertFileToBase64(file);
                const selectedSubject = subjectSelect ? subjectSelect.value : "General";

                // 新增至本地紀錄
                const newRecord = {
                    id: Date.now(),
                    subject: selectedSubject,
                    image: imageBase64,
                    date: new Date().toLocaleDateString()
                };

                mistakes.unshift(newRecord);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));

                // 更新頁面狀態
                renderHomeStats();
                renderMistakesList();

                // 清空輸入
                if (imageInput) imageInput.value = "";

                alert("照片已成功儲存！");
            } catch (error) {
                console.error("Save Error:", error);
                alert("儲存失敗，可能照片檔案過大。");
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
