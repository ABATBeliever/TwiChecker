const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");

let forbiddenWords = [];
let tweetsData = null;

function loadBadWords() {
  return fetch('get-list-encrypted.php')
    .then(res => res.json())
    .then(json => {
//      console.log("受け取ったbase64文字列:", json.data);
      const decoded = decodeURIComponent(escape(atob(json.data)));
//      console.log("デコード結果:", decoded);
      forbiddenWords = decoded.split(",").filter(Boolean);
//      console.log("禁句リスト:", forbiddenWords);
    })
    .catch(err => {
      alert('エラー！禁句ワードリストを取得できません！')
    });
}
loadBadWords()

fileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.name !== "tweets.js") {
    alert("ファイル名が 'tweets.js' ではありません");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;

    try {
      const start = content.indexOf("[");
      const end = content.lastIndexOf("]") + 1;
      const jsonText = content.slice(start, end);
      tweetsData = JSON.parse(jsonText);
      fileInput.disabled = true;
      analyzeBtn.disabled = false;
    } catch (err) {
      alert("tweets.jsの読み込みに失敗しました");
      console.error(err);
    }
  };
  reader.readAsText(file, "UTF-8");
});

analyzeBtn.addEventListener("click", function () {
  if (!tweetsData) {
    alert("tweets.jsをまずアップロードしてください");
    return;
  }

  const results = [];

  tweetsData.forEach((entry) => {
    const tweet = entry.tweet;
    if (!tweet.full_text) return;

    const isRetweet = tweet.retweeted || tweet.full_text.startsWith("RT @");
    if (isRetweet) return;

    const text = tweet.full_text;
    const matched = forbiddenWords.filter((word) => text.includes(word));

    if (matched.length > 0) {
      const url = `https://x.com/i/web/status/${tweet.id_str}`;
      results.push({
        date: tweet.created_at,
        text: text,
        url: url,
        matchedWords: matched,
      });
    }
  });

  displayResults(results);
});

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

function displayResults(data) {
  if (data.length === 0) {
    resultDiv.innerHTML = "<div class='notice'>問題のある発言は検出されませんでした</div>";
    return;
  }

  let html = `<div id="hitCount">！ ${data.length}件の禁句かもしれない発言を検出しました。</div>`;
  html += "<table><thead><tr><th>日付</th><th>ツイート</th><th>URL</th><th>ブロック理由</th></tr></thead><tbody>";

  data.forEach((item) => {
    html += `<tr>
      <td>${item.date}</td>
      <td>${escapeHTML(item.text)}</td>
      <td><a href="${item.url}" target="_blank">ツイートに移動</a></td>
      <td>${item.matchedWords.join(", ")}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  resultDiv.innerHTML = html;
}
