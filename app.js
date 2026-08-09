const STORAGE_KEY = "mistake_ai_data";
let mistakes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

document.addEventListener("DOMContentLoaded", () => {
    renderHomeStats();
    renderMistakesList();
    bindSaveEvent();
});

// 頁面切換功能（點擊底部圖標或按鈕時調用）
function switchTab(tabId) {
    const sections = document.querySelectorAll(".page-section");
    sections.forEach(sec => sec.style.display = "none");

    const activeSection = document.getElementById(tabId);
    if (activeSection) {
        activeSection.style.display = "block";
    }

    const navButtons = document.querySelectorAll(".nav-item");
    navButtons.forEach(btn => btn.classList.remove("active"));
    
    // 依順序亮起按鈕：0=home, 1=mistakes, 2=add
    if (tabId === 'home' && navButtons[0]) navButtons[0].classList.add("active");
    if (tabId === 'mistakes' && navButtons[1]) navButtons[1].classList.add("active");
    if (tabId === 'add' && navButtons[2]) navButtons[2].classList.add("active");
}

// 渲染首頁數字
function renderHomeStats() {
    const totalElement = document.getElementById("total-count");
    if (totalElement) {
        totalElement.innerText = mistakes.length;
    }
}

// 渲染儲存的照片清單
function renderMistakesList() {
    const listContainer = document.getElementById("mistakes-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (mistakes.length === 0) {
        listContainer.innerHTML = "<p style='text-align:center; color:#888; padding:20px;'>目前還沒有儲存任何照片。</p >";
        return;
    }

    mistakes.forEach((item, index) => {
        const card = document.createElement("div");
        card.style.cssText = "background:#fff; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #e5e7eb;";
        card.innerHTML = `
            <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">科目：${item.subject} | 時間：${item.date}</div>
            < img src="${item.image}" style="max-width:100%; border-radius:6px; display:block; margin-bottom:8px;">
            <button onclick="deleteMistake(${index})" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-size:12px; cursor:pointer;">刪除照片</button>
        `;
        listContainer.appendChild(card);
    });
}

// 刪除照片
function deleteMistake(index) {
    mistakes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
    renderHomeStats();
    renderMistakesList();
}

// 綁定儲存按鈕事件
function bindSaveEvent() {
    const saveBtn = document.getElementById("save-btn");
    const imageInput = document.getElementById("image-input");
    const subjectSelect = document.getElementById("subject-select");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const file = imageInput?.files[0];
            if (!file) {
                alert("請先選擇一張錯題照片！");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const newRecord = {
                    id: Date.now(),
                    subject: subjectSelect ? subjectSelect.value : "General",
                    image: e.target.result,
                    date: new Date().toLocaleDateString()
                };

                mistakes.unshift(newRecord);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));

                renderHomeStats();
                renderMistakesList();

                if (imageInput) imageInput.value = "";
                alert("照片儲存成功！");
                switchTab('mistakes'); // 儲存後自動跳轉至照片查看頁
            };
            reader.readAsDataURL(file);
        });
    }
}
