// ==========================================
// 💬 dialogues.js : セリフデータ ＆ 音読サブシステム（レガシーBGM競合完全排除版全文）
// ==========================================

const dialogueListRaw = [
    { face: 2, text: "ここ、さっきも通らなかったかな……？うそ、やだ……。" },
    { face: 1, text: "うしろ……いや、気のせいだよね。振り返るの怖いもん……。" },
    { face: 3, text: "壁に手を当てて歩けば、いつかは外に出られるよね……？" },
    { face: 2, text: "ライトの電池、切れたら本当に真っ暗になっちゃう、どうしよう……。" },
    { face: 2, text: "ねえ、みんなコメントして……？一人だと怖くて泣きそう……。" },
    { face: 1, text: "足音がひとつ多い気がするの……気のせい、気のせいだよね……。" },
    { face: 1, text: "待って、今の曲がり角の影、絶対心中穏やかじゃないよぉ……！" },
    { face: 3, text: "ここ、携帯の電波が全然繋がらない……配信届いてるかな……。" },
    { face: 2, text: "早くお家に帰って、あったかいお布団で眠りたいよぉ……。" },
    { face: 1, text: "今の音なにっ！？ねえみんな、今の聞こえたよね……！？" },
    { face: 3, text: "無事に帰れたら、あったかいココアをたくさん飲むんだ……。" },
    { face: 2, text: "ミニマップのこの赤い点、何かの見違いだよね……？" },
    { face: 1, text: "背中がゾクゾクする……ずっと誰かに見られてるみたい……。" },
    { face: 2, text: "ねえ、さっきから同じところぐるぐる回ってない……？" },
    { face: 1, text: "ライトがチカチカする……お願い、消えないで、怖いよ……。" },
    { face: 2, text: "この角の奥、なんか嫌な気配がする……行きたくないよぉ……。" },
    { face: 1, text: "心臓がずっとバクバクしてて、痛いくらいだよ……。" },
    { face: 2, text: "涙が出てきちゃった……でも、立ち止まったらダメだよね……。" },
    { face: 2, text: "嘘でしょ……行き止まり！？もうやだぁ……っ！" },
    { face: 1, text: "暗闇の向こうから、じっと見つめられてる感覚が消えない……。" },
    { face: 1, text: "誰か助けて……！お父さん、お母さん……っ！" },
    { face: 1, text: "おい後ろ……！今なんか通った！！絶対誰かいたって……！！" },
    { face: 2, text: "心なしか、さっきより壁の色がドス黒くなってる気がする……。" },
    { face: 1, text: "あいつ、足音が全然しなくて、いつの間にか後ろにいるの……っ！" },
    { face: 1, text: "だめだ、怖すぎて頭がおかしくなりそう……っ、うふふ……。" },
    { face: 2, text: "冷たい風が吹いた……どこかから外の空気が入ってきてるのかな……。" },
    { face: 1, text: "ねえ、コメントの流れが急に止まった……？みんな、まだいるよね……？" },
    { face: 2, text: "地面が少しぬるぬるする……踏みたくない、気持ち悪いよぉ……。" },
    { face: 1, text: "どこまで行っても同じ景色……私、ずっと同じ場所を彷徨ってるんじゃ……。" },
    { face: 2, text: "遠くから、何かを引きずるような音が聞こえる気がする……。" },
    { face: 3, text: "焦っちゃダメ。落ち着いて、一つずつ角を曲がっていこう……。" },
    { face: 1, text: "ライトが照らす範囲が、さっきより狭くなってる気がするの……。" },
    { face: 2, text: "耳鳴りが止まらない……頭の奥がずっとキーンとしてる……。" },
    { face: 1, text: "やだ、壁に指先が触れたら、妙にベタベタしてる……何これ……。" },
    { face: 2, text: "自分の呼吸の音が大きすぎて、周りの音が聞こえづらいよぉ……。" },
    { face: 1, text: "あいつの気配が近くなると、手足の震えが止まらなくなる……。" },
    { face: 2, text: "もしライトが完全に消えたら、私はどうなっちゃうの……？" },
    { face: 3, text: "大丈夫、まだ歩ける。まだ諦めるわけにはいかないもん……。" },
    { face: 1, text: "天井から黒い液体が滴ってる……頭に落ちてきそうで怖いよ……。" },
    { face: 2, text: "もう何時間歩いたんだろう……時間の感覚が完全に麻痺してる……。" },
    { face: 1, text: "視界の端を、何かがものすごい速さで通り過ぎたような……。" },
    { face: 2, text: "喉がカラカラ……でも、ここに落ちてる水は絶対飲んじゃダメだよね……。" },
    { face: 1, text: "壁のあちこちに、爪で引っ掻いたような傷跡が無数にある……。" },
    { face: 2, text: "誰かの囁き声が聞こえた気がした……気のせい、気のせいだよね……。" },
    { face: 3, text: "靴底がかなりすり減ってきた気がする……足の裏が痛いよ……。" }
];

const panicDialogueListRaw = [
    { face: 5, text: "うわあああああ！びっくりしたぁぁ！！本当に心臓止まるかと思った……っ！！" },
    { face: 5, text: "ひっ……！！な、何いまの！？ガチで怖すぎて涙出てきた……うぅ……っ！！" },
    { face: 5, text: "あ、あぶねぇ……！一瞬、本当に目の前が真っ白になって息ができなかった……！" },
    { face: 5, text: "うわぁぁ！もう無理、心臓が口から飛び出るかと思ったよぉ……っ！" },
    { face: 5, text: "ダメだ、今のショックで一気に頭が狂いそう……心臓のバクバクが止まらない……っ！" }
];

const batteryDialogueList = [
    { face: 4, text: "⚡ よ、よかったぁ……！新しい電池、チャージできたよぉ……！" },
    { face: 4, text: "⚡ あったあぁ！これでまだ明かりを灯せる……！生き延びられた……っ！" },
    { face: 4, text: "⚡ 電池落ちてた……っ！神様、まだ私を見捨ててなかったんだ……！" },
    { face: 4, text: "⚡ よし、エネルギー補給完了……！この光があるうちに先へ進まなきゃ！" }
];

var dialogueList = dialogueListRaw.map(function(d) { return d.text; });
var panicDialogueList = panicDialogueListRaw.map(function(d) { return d.text; });
let lastSpokenText = "";

// 📢 少女の音声読み上げ
function speakGirlText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    let cleanText = text.replace(/[⚡❤️🎉]/g, '').replace(/……/g, '、');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP'; utterance.pitch = 1.35; utterance.rate = 1.40; utterance.volume = 0.20;
    const voices = window.speechSynthesis.getVoices();
    let girlVoice = voices.find(v => v.lang.includes('ja') && (v.name.includes('Kyoko') || v.name.includes('Google') || v.name.includes('Microsoft')));
    if (girlVoice) utterance.voice = girlVoice;
    window.speechSynthesis.speak(utterance);
}

// 各種イベント時のセリフ窓口
window.triggerRandomWalkingDialogue = function() {
    let filtered = dialogueListRaw.filter(d => d.text !== lastSpokenText);
    if (filtered.length === 0) filtered = dialogueListRaw;
    let randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
    lastSpokenText = randomQuote.text;
    window.typeWriterMessage(randomQuote, 80); 
};

window.triggerBatteryDialogue = function() {
    let randomBattery = batteryDialogueList[Math.floor(Math.random() * batteryDialogueList.length)];
    lastSpokenText = randomBattery.text;
    window.typeWriterMessage(randomBattery, 60); 
};

window.triggerPanicDialogue = function() {
    let randomPanic = panicDialogueListRaw[Math.floor(Math.random() * panicDialogueListRaw.length)];
    lastSpokenText = randomPanic.text;
    window.typeWriterMessage(randomPanic, 40); 
};

window.forceScareFace = function() {
    let fImg = document.getElementById('pokemon-face-img');
    if (fImg) fImg.src = 'assets/faces/5.png';
};

// 表情の更新ロジック
window.forceUpdateFace = function(dialogueObj) {
    let fImg = document.getElementById('pokemon-face-img');
    if (!fImg) return;
    
    let bat = (window.Game && typeof window.Game.battery !== 'undefined') ? window.Game.battery : 100;
    let faceNum = (bat <= 0) ? 1 : 3;

    if (dialogueObj && typeof dialogueObj.face !== 'undefined') {
        faceNum = dialogueObj.face;
    } else if (typeof dialogueObj === 'string' && dialogueObj.trim() !== "") {
        if (dialogueObj.includes("電池") || dialogueObj.includes("チャージ")) faceNum = 4;
        if (dialogueObj.includes("うわあ") || dialogueObj.includes("ひっ") || dialogueObj.includes("びっくり")) faceNum = 5;
    }
    
    fImg.src = `assets/faces/${faceNum}.png`;
};

// ピコピコ文字表示のピュア実装
let typeTimeout = null;
window.typeWriterMessage = function(dialogueInput, speed = 60) {
    let textEl = document.getElementById('pokemon-text');
    if (!textEl) return;
    if (typeTimeout) clearTimeout(typeTimeout);
    
    textEl.innerText = "";
    let index = 0;
    
    let text = (typeof dialogueInput === 'object') ? dialogueInput.text : dialogueInput;
    
    speakGirlText(text);
    window.forceUpdateFace(dialogueInput); 

    function type() {
        if (index < text.length) {
            textEl.innerText += text.charAt(index);
            index++;
            typeTimeout = setTimeout(type, speed);
        }
    }
    type();
};

// 💡【競合バグの修正】
// 古いアルペジオBGMシステム（startAdvanced8BitBGM）および、
// それに関連する画面タッチ時のリスナーを根こそぎ完全消去しました。
// これにより、game_v3.js側の一本化されたランダムホラーシンセBGMだけが100%美しくクリアに鳴り響きます。
