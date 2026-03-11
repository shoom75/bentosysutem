function doPost(e) {
    // 1. JavaScriptから送られてきたJSONデータを取り出す
    const data = JSON.parse(e.postData.contents);

    // 2. 書き込み先のシートを取得（1番目のシート）
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // 現在の日時を取得してフォーマット
    const now = new Date();
    const date = Utilities.formatDate(now, "JST", "yyyy/MM/dd"); // 日付
    const time = Utilities.formatDate(now, "JST", "HH:mm:ss");    // 時刻

    // 3. データを1行追加する [日付, 時刻, 名前, 弁当名]
    sheet.appendRow([
        date,
        time,
        data.name,
        data.bento
    ]);

    // 4. ブラウザに「成功」と返事をする
    const response = { "status": "success", "message": "保存完了" };
    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}


