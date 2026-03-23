// LocalStorageのキー
const STORAGE_KEY = 'mojibake_memos';

// メモの状態を管理する配列
let memos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// 画面の要素を取得
const memoInput = document.getElementById('memo-input');
const saveBtn = document.getElementById('save-btn');
const memoList = document.getElementById('memo-list');

// --- コアロジック ---

// ① UTF-8を無理やりShift_JISとして読み込んで文字化けさせる
function garbleText(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  return new TextDecoder('shift_jis').decode(utf8Bytes);
}

// ② 文字化けテキストをShift_JISのバイト列に戻し、UTF-8として読み直す（※ここで文字が欠損する）
function restoreText(mojibakeText) {
  // Unicodeの配列に変換
  const unicodeArray = Encoding.stringToCode(mojibakeText);
  // Shift_JISのバイト列に変換（ここで変換できない文字が欠落・変化する）
  const sjisBytes = Encoding.convert(unicodeArray, { to: 'SJIS', from: 'UNICODE' });
  // バイト列をUTF-8として復元
  return new TextDecoder('utf-8').decode(new Uint8Array(sjisBytes));
}

// --- UIの制御 ---

// メモを画面に描画する
function renderMemos() {
  memoList.innerHTML = '';
  
  memos.forEach(memo => {
    const div = document.createElement('div');
    div.className = 'memo-item';
    
    div.innerHTML = `
      <p class="memo-text">${memo.text}</p>
      <div class="memo-actions">
        <button class="btn-restore" onclick="handleRestore(${memo.id})">復元を試みる</button>
        <button class="btn-delete" onclick="handleDelete(${memo.id})">削除</button>
      </div>
    `;
    
    memoList.appendChild(div);
  });
}

// メモを保存する処理
saveBtn.addEventListener('click', () => {
  const text = memoInput.value;
  if (!text.trim()) return;

  // 無慈悲に文字化けさせる
  const garbledText = garbleText(text);

  const newMemo = {
    id: Date.now(),
    text: garbledText
  };

  memos.unshift(newMemo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
  
  memoInput.value = ''; // 入力欄をクリア
  renderMemos();
});

// 復元ボタンが押された時の処理
window.handleRestore = (id) => {
  const memo = memos.find(m => m.id === id);
  if (memo) {
    // 復元を試みる（欠損した状態になる）
    const partiallyRestoredText = restoreText(memo.text);
    
    // アラートで絶望感を演出
    alert("復元を試みました。\n※一部のデータは永久に失われました。");
    
    // 復元（欠損）したテキストで上書き保存する
    memo.text = partiallyRestoredText;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    renderMemos();
  }
};

// 削除ボタンが押された時の処理
window.handleDelete = (id) => {
  if (confirm("このメモを削除しますか？")) {
    memos = memos.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    renderMemos();
  }
};

// 初期表示
renderMemos();