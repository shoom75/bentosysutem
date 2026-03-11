// 要素の取得
const nameInput = document.getElementById('student_name');
const bentoInput = document.getElementById('bento_type');
const submitBtn = document.getElementById('submit-btn');

// --- 1. ボタンの活性・非活性を管理する ---
function validateForm() {
    const isNameFilled = nameInput.value.trim() !== "";
    const isBentoSelected = bentoInput.value !== "" && bentoInput.value !== "選択してください";

    if (isNameFilled && isBentoSelected) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";
    }
}

// 入力を監視
nameInput.addEventListener('input', validateForm);
bentoInput.addEventListener('change', validateForm);


// --- 2. 送信処理 ---
async function sendToSheet() {

    const url = "https://script.google.com/macros/s/AKfycbw8NzHhZumcF6tOV5_BAtu4NoZsY-SymCsfSV8SWDDJa5NkeuQ2GybwTZThxHdZydMQ/exec"

    const payload = {
        name: nameInput.value,
        bento: bentoInput.value
    };

    try {
        // 二重送信防止のため、送信開始時にボタンを無効化
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中...";

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(payload)
        });

        // 成功時のログ表示
        let div = document.createElement("div");
        div.textContent = `【完了】${payload.name}さんの注文を記録しました`;
        div.style.backgroundColor = "#e1f5fe";
        div.style.padding = "10px";
        div.style.marginTop = "10px";
        document.body.appendChild(div);

        // 送信後に中身をクリア
        nameInput.value = "";
        bentoInput.selectedIndex = 0;

        // ボタンの状態を元に戻す（入力が空になるので再び半透明になる）
        submitBtn.textContent = "予約実行";
        validateForm();

    } catch (e) {
        console.error("エラーが発生しました", e);
        submitBtn.disabled = false;
        submitBtn.textContent = "予約実行";
    }
}