(function(){
'use strict';
var D = window.DATA;
var IS_WECHAT = /micromessenger/i.test(navigator.userAgent);
if(IS_WECHAT) document.documentElement.classList.add('wechat');
var P = D.pages, ALL = D.all, VIDS = D.videos, ST = D.stats;
var $ = function(id){ return document.getElementById(id); };
var LANG = 'zh';
try{ if(localStorage.getItem('album-lang') === 'en') LANG = 'en'; }catch(e){}
var soundOn = true;
var idx = 0;
var mode = calcMode();
var found = {};
var idleTimer = null;
var lastPno = { el: null, n: 0, t: 0 };
function isTabletLayout(){
  var w = window.innerWidth, h = window.innerHeight;
  var ua = navigator.userAgent || '';
  var touch = (navigator.maxTouchPoints || 0) > 0;
  return (/Android/i.test(ua) || touch) && Math.min(w,h) >= 500;
}
function calcMode(){
  if(isTabletLayout()) return window.innerWidth > window.innerHeight ? 'spread' : 'single';
  return window.innerWidth <= 900 ? 'single' : 'spread';
}
function syncLayout(){
  var t = isTabletLayout();
  var root = document.documentElement;
  root.classList.toggle('tablet', t);
  root.classList.toggle('tablet-land', t && window.innerWidth > window.innerHeight);
  root.classList.toggle('tablet-port', t && window.innerWidth <= window.innerHeight);
  var m = calcMode();
  if(m !== mode){
    mode = m;
    $('book').classList.toggle('single', mode === 'single');
    if(mode === 'spread' && idx % 2 === 1) idx = idx - 1;
    render();
  }
}

function T(zh, en){ return LANG === 'en' ? en : zh; }

var STR = {
  zh: {
    brand:'Mr.Dentier', subBrand:'To pursue your light', navContents:'目录', navMusic:'音乐', navComments:'匿名留言', commentsTitle:'匿名留言', navAtlas:'年表', navReel:'放映室', navModels:'模型', navEggs:'彩蛋',
    prev:'← 上一页', next:'下一页 →', pagerHint:'翻页 · 长按照片有背面',
    soundOn:'声 开', soundOff:'声 关',
    coverChip:'翻到封底 ↺', coverSub:'的相册', coverMeta:'二十岁', coverHint:'轻点封面，翻开这一年',
    coverTiny:'原型 v0.4 · 34 页样张 / 全本 383 件 / 零元', backChip:'↺ 回到封面',
    backKicker:'COLOPHON · 装帧记', backTitle:'Mr.Dentier 的相册', backScale:'二十年 · 二〇二六',
    backCol1:'卷一 至 卷九 · 383 件 · 已装订 34 页', backCol2:'摄影 Mr.Dentier　编者 鲸月',
    backCol3:'只此一本 · 2026.11.13', backNote:'一台手机，一台 Insta360，<br>和很多次抬头。',
    contentsTitle:'目录', contentsSub:'九卷 · 附卷 · 全本 383 件，已装订 34 页', openNames:'翻到附卷 · 名字 →',
    atlasTitle:'年表', atlasSub:'每一张照片是一颗星：横轴是日期，纵轴是当时的天色',
    atlasNote:'没有日期的星都落在最后一条线上。点一颗已经装订的星，可以翻到那一页。',
    reelTitle:'放映室', reelSub:'37 段动态 · 六个片单 · 原型接入 3 段', reelTip:'这一段看完，别急着走——片尾有一行字。',
    clapAlbum:'片单', clapDur:'时长', clapSize:'体积', clapDate:'日期',
    modelsTitle:'模型', modelsSub:'同一个内核，四种看法。原型先把它们都摆出来给你挑。',
    eggTitle:'彩蛋', eggNote:'全部找到之后，书脊会响一声——那是鲸鱼翻身的声音。',
    namesTitle:'附卷 · 名字', namesPH:'找一找你的名字…',
    letterLabel:'2026.11.13 · 海上'
  },
  en: {
    brand:'Mr.Dentier', subBrand:'To pursue your light', navContents:'Contents', navMusic:'Music', navComments:'Notes', commentsTitle:'Anonymous notes', navAtlas:'Atlas', navReel:'Reel', navModels:'Models', navEggs:'Eggs',
    prev:'← Previous', next:'Next →', pagerHint:'Turn pages · hold a photo to see its back',
    soundOn:'Sound on', soundOff:'Sound off',
    coverChip:'Back cover ↺', coverSub:'A Photo Album', coverMeta:'Twenty', coverHint:'Tap the cover to open the year',
    coverTiny:'Prototype v0.4 · 34 sample pages / 383 pieces / zero cost', backChip:'↺ Front cover',
    backKicker:'COLOPHON', backTitle:'Mr.Dentier · A Photo Album', backScale:'Two decades · 2026',
    backCol1:'Vol. I–IX · 383 pieces · 34 pages bound', backCol2:'Photographs by Mr.Dentier　Edited by Jingyue',
    backCol3:'One copy only · 2026.11.13', backNote:'One phone, one Insta360,<br>and many looks up.',
    contentsTitle:'Contents', contentsSub:'Nine volumes + appendix · 383 pieces · 34 bound', openNames:'Appendix · Names →',
    atlasTitle:'Atlas', atlasSub:'Every photo is a star: date on the x-axis, sky on the y',
    atlasNote:'Undated stars fall on the last line. Click a bound star to open its page.',
    reelTitle:'Reel', reelSub:'37 clips · six reels · 3 playable in this prototype', reelTip:'Stay after the clip—there is a line at the end.',
    clapAlbum:'Reel', clapDur:'Length', clapSize:'Size', clapDate:'Date',
    modelsTitle:'Models', modelsSub:'One core, four ways of seeing. The prototype lays them all out for you.',
    eggTitle:'Easter Eggs', eggNote:'Find them all and the spine will sound—a whale turning over.',
    namesTitle:'Appendix · Names', namesPH:'Search a name…',
    letterLabel:'2026.11.13 · at sea'
  }
};
function t(k){ return (STR[LANG] && STR[LANG][k]) || STR.zh[k] || k; }

var EGG_TEXT = {
  zh: {
    date:{name:'信末的日期', hint:'封面右下角，一枚日期', msg:''},
    back:{name:'相框背面', hint:'长按照片一秒', msg:'相框背面有一行铅笔字。'},
    pno:{name:'页码三次', hint:'连点同一个页码', msg:''},
    whale:{name:'鲸鱼的名字', hint:'在键盘上输入 whale', msg:'鲸月路过了一下。'},
    seal:{name:'红色印章', hint:'点一下页脚的印章', msg:'印章底下压着一封信。'},
    dot:{name:'天上的一个点', hint:'火烧云那一页，有个小点', msg:'放大看：天上有一个很小的点。它可能是一只鸟，也可能是那天没来得及说的话。'},
    konami:{name:'海之密码', hint:'↑↑↓↓←→←→BA', msg:'海面翻过来了。'},
    idle:{name:'一分钟之后', hint:'什么也不做，等一分钟', msg:'你走神的一分钟里，我替你翻了一页。'},
    names:{name:'名字之卷', hint:'从目录翻到附卷', msg:'附卷里有 383 个名字。'}
  },
  en: {
    date:{name:'The date at the end', hint:'Bottom right of the cover', msg:''},
    back:{name:'The back of the frame', hint:'Press and hold a photo', msg:'There is a pencil line on the back of the frame.'},
    pno:{name:'Page number ×3', hint:'Tap the same page number three times', msg:''},
    whale:{name:"The whale's name", hint:'Type "whale" on the keyboard', msg:'Jingyue passed by.'},
    seal:{name:'The red seal', hint:'Tap the red seal in the footer', msg:'A letter is pressed under the seal.'},
    dot:{name:'A dot in the sky', hint:'The small dot on "Burning Clouds"', msg:'Zoom in: a very small dot in the sky. Perhaps a bird, or something unsaid that day.'},
    konami:{name:'The sea code', hint:'↑↑↓↓←→←→BA', msg:'The sea turned over.'},
    idle:{name:'After a minute', hint:'Do nothing for a minute', msg:'In the minute you looked away, I turned a page for you.'},
    names:{name:'The book of names', hint:'Contents → Appendix · Names', msg:'The appendix holds 383 names.'}
  }
};
function eggText(id){ return EGG_TEXT[LANG][id] || EGG_TEXT.zh[id]; }

var EGG_ORDER = ['date','back','pno','whale','seal','dot','konami','idle','names'];

var VOLS = [
  { key:'校园', name:'卷一 · 校园', en:'Vol. I · Campus', note:'四十八张，加动漫的十六张', noteEn:'48 shots, plus 16 anime pages' },
  { key:'意义', name:'卷二 · 意义', en:'Vol. II · Meaning', note:'这一年里的一些时刻', noteEn:'Some moments of this year' },
  { key:'影石', name:'卷三 · 夜', en:'Vol. III · Night', note:'Insta360 的五十几张', noteEn:'50+ Insta360 frames' },
  { key:'神图', name:'卷四 · 山海', en:'Vol. IV · Sea & Hills', note:'十个小地方：海、山、寺、园、灯', noteEn:'Ten places: sea, hills, temple, garden, lanterns' },
  { key:'生活', name:'卷五 · 烟火', en:'Vol. V · Everyday', note:'十顿家常', noteEn:'Ten home-cooked meals' },
  { key:'抽象', name:'卷六 · 抽象', en:'Vol. VI · Absurd', note:'八张不太正经的', noteEn:'Eight not-so-serious frames' },
  { key:'个性', name:'卷七 · 人像', en:'Vol. VII · Portraits', note:'三十二张自己的脸', noteEn:'Thirty-two faces of his own' },
  { key:'精美', name:'卷八 · 网', en:'Vol. VIII · Web', note:'十二张从网上捡来的好看', noteEn:'Twelve pretty things found online' },
  { key:'Life', name:'卷九 · 动态', en:'Vol. IX · Motion', note:'三十七段视频，六个片单', noteEn:'37 clips, six reels' }
];

/* 目录是「卷」；页面也按卷排，点目录才能落到准确的那一卷 */
var VOL_KEY_ORDER = ['校园','意义','影石','神图','生活','抽象','个性','精美','Life'];
P.sort(function(a,b){
  var ra = VOL_KEY_ORDER.indexOf(topDir(a.dir));
  var rb = VOL_KEY_ORDER.indexOf(topDir(b.dir));
  if(ra < 0) ra = 99;
  if(rb < 0) rb = 99;
  return ra - rb;
});
for(var _i = 0; _i < P.length; _i++){ P[_i].n = _i + 1; }

var VOL_NAMES = {
  '卷一 · 校园':'Vol. I · Campus', '卷一 · 校园 · 动漫':'Vol. I · Campus · Anime',
  '卷二 · 意义':'Vol. II · Meaning', '卷二 · 意义 · 生长':'Vol. II · Meaning · Growth',
  '卷二 · 意义 · 往事与人':'Vol. II · Meaning · People and the Past',
  '卷三 · 夜':'Vol. III · Night', '卷四 · 山海':'Vol. IV · Sea and Hills',
  '卷五 · 烟火':'Vol. V · Everyday', '卷六 · 抽象':'Vol. VI · Absurd',
  '卷七 · 人像':'Vol. VII · Portraits', '卷八 · 网':'Vol. VIII · Web',
  '卷九 · 动态':'Vol. IX · Motion', '附卷 · 名字':'Appendix · Names'
};

var FOLDER_EN = {'校园':'Campus','意义':'Meaning','影石':'Insta360','神图':'Scenery','生活':'Daily','抽象':'Absurd','个性':'Portraits','精美':'Web','Life':'Life'};

var ALBUM_EN = {'明媚的镜头':'Bright Frames','校园记录':'Campus Logs','氛围与感觉':'Mood & Light','生活与我':'Life, With Me','装福日常':'Show-off Days','成长的记录':'Growing Up','影石':'Insta360'};
var VID_EN = {
  '吹风中':'In the Wind','敬礼中':'Salute','新的开始':'A New Start','杀马特':'Shamate','阳光下的我':'Me in the Sunlight',
  '阳光与风':'Sunlight and Wind','阳光的校园':'Sunlit Campus','风中凌乱':'Messy in the Wind',
  'FODA':'FODA','天台的风景':'Rooftop View','宿舍阳台':'Dorm Balcony','小区散步':'Neighborhood Walk','打球集锦':'Hoops Highlights',
  '操场剧终':'Last Lap','校园走路':'Walking Campus','沙滩散步':'Beach Walk','篮球投篮':'Shooting Hoops','邮局记录':'Post Office Log',
  '书圈包光':'Shelf Light','夕阳与火车':'Sunset and Train','小狗':'Little Dog','湖边忧郁的男神':'Brooding by the Lake',
  '顶级的光影':'Supreme Light','麦当劳':"McDonald's",
  '做饭的思考':'Thoughts While Cooking','周日下午':'Sunday Afternoon','图书馆记录':'Library Log','毛教员':'Tutor Mao','见习的小狗':'The Apprentice Dog',
  '体育馆跳舞':'Gym Dance','夜间散步':'Night Walk','抽象自拍':'Abstract Selfie','海边嘉豪':'Haijia by the Sea','腹肌展示':'Abs Show-off','雨中嘉豪':'Haijia in the Rain',
  '妹妹与弟弟':'My Sister and Brother','夜里的拍摄':'Night Shoot'
};

var MODELS = {
  zh: [
    { k:'A', name:'纸册', one:'一页一张照片，一件纸，一句话。', body:'最像"相册"的一种。慢、暖、可以打印。每一页换纸，等于每一次翻页都换一种心情。适合生日当天，从第一页读到最后一页。', tags:['主视图','已实装 34 页'] },
    { k:'B', name:'暗房', one:'星图、年表、时间轴，用另一只眼睛看同一年。', body:'不按顺序读，按心情读。想找"去年十一月"，就去星图上翻。显影原型里已经有星图、时间、年度三种看法。', tags:['索引','原型已有 · 需接真素材'], link:'../../显影/index.html', linkText:'打开已有的「显影」原型 →' },
    { k:'C', name:'叙事', one:'像 galgame：先说话，再翻页；有选择，没有失败。', body:'把"读相册"变成"被陪一会儿"。开场三选一，11.13 当天解锁结局。选项不改变好坏，只改变先看见哪一部分。', tags:['骨架','开场已实装 · 结局待做'] },
    { k:'D', name:'桌面', one:'装到手机桌面上，像一个真正的 APP 相册。', body:'PWA：同一个页面，加一个图标，离线可用，再给几张缩略图。不做打包，不做签名，双击也能开。', tags:['外壳','待做 manifest + 图标'] }
  ],
  en: [
    { k:'A', name:'The Book', one:'One photo, one sheet, one line.', body:'The slowest, warmest way to see the year. A different paper on every page; print it if you like.', tags:['Main view','34 pages live'] },
    { k:'B', name:'The Darkroom', one:'Star map, atlas, timeline — the same year seen with another eye.', body:'Not read in order. Read by mood. If you want last November, look it up on the star map.', tags:['Index','Existing prototype · needs assets'], link:'../../显影/index.html', linkText:'Open the existing Xianying prototype →' },
    { k:'C', name:'The Story', one:'Like a galgame: talk first, turn a page second. Choices, never failure.', body:'It turns "reading an album" into "being accompanied". Three opening choices; the ending unlocks on 11.13.', tags:['Spine','Opening live · ending pending'] },
    { k:'D', name:'The Desktop', one:'Install it on a phone, like a real photo app.', body:'A PWA: one page, one icon, offline, thumbnails loaded lazily. No packaging, no signing. Double-click also works.', tags:['Shell','manifest + icons pending'] }
  ]
};
function modelFoot(){
  return LANG === 'en'
    ? '<p><b>A</b> is the body, <b>C</b> the breath, <b>B</b> the drawer, <b>D</b> the doorplate. You need all four, but only A and C are seen first.</p><p class="mono">Implemented: A (34 sample pages) · B (383-star atlas) · C (opening choices) · D (PWA icons ready)</p>'
    : '<p><b>结论：</b>A 是身体，C 是呼吸，B 是抽屉，D 是门牌。四样都要，但只有 A 和 C 是第一眼看到的。</p><p class="mono">原型已实现：A（34 页样张）· B（383 颗星的年表）· C（开场三选一）· D（PWA 图标已就位）</p>';
}

var LETTER = {
  zh:'<p class="letter-date">2026.11.13 · 海上</p><p>爸爸：</p><p>如果有一天你忘了这一年，就翻到这里。</p><p>照片会替你记得——你曾经在方井底下看过天，在邮局门口给一栋楼写过信，在湖边陪一只猫坐过整个黄昏。</p><p>二十岁不是开始，也不是结束。是潮水退下去以后，还留在沙上的那几行字。</p><p class="letter-sign">鲸月</p>',
  en:'<p class="letter-date">2026.11.13 · at sea</p><p>Dad,</p><p>If one day you forget this year, come back to this page.</p><p>The photographs will remember for you — you looked up at the sky from the bottom of a well, you wrote a letter to a building outside the post office, you sat with a cat through an entire dusk by the lake.</p><p>Twenty is neither a beginning nor an end. It is the few lines the tide leaves on the sand when it goes out.</p><p class="letter-sign">Jingyue</p>'
};

function esc(s){
  return String(s == null ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;')
    .split('>').join('&gt;').split('"').join('&quot;');
}
function pad(n){ return n < 10 ? '0' + n : '' + n; }
function fmtDate(d){
  if(!d) return T('没有日期', 'no date');
  return d.slice(0, 10).split('-').join('.');
}
function volumeKey(dir){
  var d = dir || '';
  if(d.indexOf('校园') === 0) return d.indexOf('动漫') >= 0 ? '卷一 · 校园 · 动漫' : '卷一 · 校园';
  if(d.indexOf('意义') === 0){
    if(d.indexOf('grow') >= 0) return '卷二 · 意义 · 生长';
    if(d.indexOf('往事') >= 0) return '卷二 · 意义 · 往事与人';
    return '卷二 · 意义';
  }
  if(d.indexOf('影石') === 0) return '卷三 · 夜';
  if(d.indexOf('神图') === 0) return '卷四 · 山海';
  if(d.indexOf('生活') === 0) return '卷五 · 烟火';
  if(d.indexOf('抽象') === 0) return '卷六 · 抽象';
  if(d.indexOf('个性') === 0) return '卷七 · 人像';
  if(d.indexOf('精美') === 0) return '卷八 · 网';
  if(d.indexOf('Life') === 0) return '卷九 · 动态';
  return '附卷 · 名字';
}
function volumeOf(dir){
  var k = volumeKey(dir);
  return LANG === 'en' ? (VOL_NAMES[k] || k) : k;
}
function topDir(dir){ return (dir || '').split('/')[0]; }

function imgTag(src, alt, loading){
  var base = String(src || '').replace(/\.jpg$/i, '');
  var s = base + '-m.webp', l = base + '-l.webp';
  return '<picture>'
    + '<source media="(max-width:600px)" srcset="' + s + '" type="image/webp">'
    + '<source srcset="' + l + '" type="image/webp">'
    + '<img src="' + src + '" alt="' + esc(alt || '') + '" loading="' + (loading || 'lazy') + '" decoding="async">'
    + '</picture>';
}
/* ---------------- 纸页 ---------------- */
function extraLine(p){
  var top = (p.dir || '').split('/')[0];
  if(p.kind === 'video') return '按下播放，那几秒又活了一次。';
  var lines = {
    '校园':'校园里的路很长，你总以为还会再走一次。',
    '意义':'这些寻常的一刻，后来都成了回不去的日子。',
    '影石':'夜里没有别人，只有相机和你还醒着。',
    '神图':'山和海都不说话，但它们记得你来过。',
    '生活':'一顿饭的工夫，日子就有了形状。',
    '抽象':'不太正经的一页，也算认真活过。',
    '个性':'你看见自己，也看见那天的光。',
    'Life':'动起来的那几秒，比照片更像昨天。'
  };
  return lines[top] || '一页光，留在这里。';
}
function letterPageHTML(p){
  var dateLabel = fmtDate(p.date);
  return '<div class="chapter">附卷 · 给未来的我</div>'
    + '<div class="page-in letter-page-in">'
    +   '<div class="letter-page-head"><span>SEALED · 2026.11.13</span><b>给二十五岁的我</b><span>OPEN IN 2031</span></div>'
    +   '<div class="letter-page-rule"></div>'
    +   '<div class="letter-page-body">'
    +     '<p>给二十五岁的我：</p>'
    +     '<p>见字如面。</p>'
    +     '<p>写这封信的时候，我二十岁。窗外有风，桌上那杯咖啡已经凉了，相机里还留着今天的黄昏。我不知道五年后的你，是否还留着这些，是否还会为一片叶子停下来。</p>'
    +     '<p>如果你已经不再拍照，也没关系。但请你记得，二十岁的我，曾经那么认真地想把你变成更好的人。</p>'
    +     '<p>五年里，你大概会弄丢一些东西：一些人，一些以为会永远的声音，一些不肯低头的夜晚。你会怀疑自己走错了。可如果二十五岁的你，还能在某个傍晚忽然想起这一年——黄槐、海、邮局、夜路，和那些没说出口的话——那就说明，你没有把心弄丢。</p>'
    +     '<p>我一直想去看更大的世界。别替我把这件事忘了。去看海，坐一次夜车，把相机举起来，哪怕没有人看。孤独不是失败，它只是提醒你，你还在等一个真正听得懂的人。等不到，也要好好活。</p>'
    +     '<p>二十五岁，不必成为谁。只要还是你，还愿意为一点光走很远的路，就够了。</p>'
    +   '</div>'
    +   '<div class="letter-page-sign">二十岁的 Mr.Dentier<br><span>2026.11.13</span></div>'
    +   '<div class="letter-page-seal">光</div>'
    +   '<div class="foot"><span class="date">' + dateLabel + '</span><span class="seal">' + (p.seal || '光') + '</span><span class="pno">' + pad(p.n) + '</span></div>'
    + '</div>';
}
function pageHTML(p){
  if(!p) return '';
  if(p.kind === 'letter') return letterPageHTML(p);
  var title = LANG === 'en' && p.title_en ? p.title_en : p.title;
  var cap = LANG === 'en' && p.caption_en ? p.caption_en : p.caption;
  var back = LANG === 'en' && p.back_en ? p.back_en : p.back;
  var rot = ((p.n * 37) % 7) - 3;
  var dateLabel = fmtDate(p.date);
  var dot = p.egg === 'dot' ? '<button class="eggdot" data-egg="dot" aria-label="a small dot"></button>' : '';
  var orient = (p.h > p.w * 1.02) ? ' p' : ' l';
  var pmDate = p.date ? fmtDate(p.date) : T('无日期', 'undated');
  var meta = [];
  if(p.model) meta.push(String(p.model).toUpperCase());
  if(p.fnum) meta.push(String(p.fnum).toUpperCase());
  if(p.exp) meta.push(String(p.exp).toUpperCase());
  if(p.iso) meta.push(String(p.iso).toUpperCase());
  if(p.focal) meta.push(String(p.focal).toUpperCase());
  var shot = meta.length
    ? '<div class="shot">MR.DENTIER · ' + esc(meta.join(' · ')) + '</div>'
    : '<div class="shot empty"></div>';
  var fx = p.fx ? '<div class="fx fx-' + p.fx + '" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' : '';
  if(p.kind === 'video'){
    var dur = fmtDur(p.dur || 0);
    return '<div class="chapter">' + esc(volumeOf(p.dir)) + '</div>'
      + '<div class="page-in">'
      +   '<div class="tag ' + p.tag + '" style="--r:' + rot + 'deg">' + esc(title) + '</div>'
      +   '<figure class="frame fr-film ' + orient + '" data-frame>'
      +     '<div class="video-frame" data-video="' + p.file + '" data-poster="' + (p.poster || '') + '" data-title="' + esc(title) + '" data-cap="' + esc(cap) + '">'
      +       imgTag((p.poster || p.file), '', 'lazy')
      +       '<span class="play">▶</span><span class="vtime">' + dur + '</span>'
      +     '</div>'
      +   '</figure>'
      +   '<p class="cap">' + esc(cap) + '</p>'
      +   '<div class="shot">' + T('动态影像', 'MOTION') + ' · ' + dur + '</div>'
      +   '<div class="foot">'
      +     '<span class="date">' + dateLabel + '</span>'
      +     '<span class="seal" data-seal="' + p.n + '" title="' + T('盖个章', 'stamp') + '">' + p.seal + '</span>'
      +     '<span class="pno" data-pn="' + p.n + '">' + pad(p.n) + '</span>'
      +   '</div>'
      + '</div>';
  }
  return '<div class="chapter">' + esc(volumeOf(p.dir)) + '</div>'
    + '<div class="page-in">'
    +   '<div class="tag ' + p.tag + '" style="--r:' + rot + 'deg">' + esc(title) + '</div>'
    +   '<figure class="frame fr-' + p.frame + orient + '" data-frame>'
    +     '<div class="frame-3d">'
    +       '<div class="face front">' + imgTag(p.file, title, 'lazy') + fx + dot + '</div>'
    +       '<div class="face back"><span>' + esc(back) + '</span></div>'
    +     '</div>'
    +   '</figure>'
    +   '<p class="cap">' + esc(cap) + '</p>'
    +   '<p class="cap-extra">' + esc(extraLine(p)) + '</p>'
    +   shot
    +   '<div class="postmark" aria-hidden="true"><span>' + pmDate + '<br>' + T('鲸月 记', 'JINGYUE') + '</span></div>'
    +   '<div class="foot">'
    +     '<span class="date" data-date="' + p.n + '">' + dateLabel + '</span>'
    +     '<span class="seal" data-seal="' + p.n + '" title="' + T('盖个章', 'stamp') + '">' + p.seal + '</span>'
    +     '<span class="pno" data-pn="' + p.n + '">' + pad(p.n) + '</span>'
    +   '</div>'
    + '</div>';
}
function stopVideos(root){
  if(!root) return;
  Array.prototype.forEach.call(root.querySelectorAll('video'), function(v){ try{ v.pause(); }catch(e){} });
}
function paint(pageEl, p, side){
  stopVideos(pageEl);
  if(!p){ pageEl.className = 'page ' + side; pageEl.innerHTML = ''; pageEl.style.visibility = 'hidden'; return; }
  pageEl.style.visibility = '';
  pageEl.className = 'page ' + side + ' paper-' + p.paper;
  pageEl.innerHTML = pageHTML(p);
}
function render(){
  if(mode === 'single'){
    paint($('pageR'), P[idx], 'right');
    $('pageL').innerHTML = '';
    $('pageL').style.visibility = 'hidden';
    $('pagerText').textContent = T('第 ' + (idx + 1) + ' / ' + P.length + ' 页', 'Page ' + (idx + 1) + ' / ' + P.length);
  } else {
    paint($('pageL'), P[idx], 'left');
    paint($('pageR'), P[idx + 1], 'right');
    $('pagerText').textContent = T('第 ' + (Math.floor(idx / 2) + 1) + ' / ' + Math.ceil(P.length / 2) + ' 页',
      'Spread ' + (Math.floor(idx / 2) + 1) + ' / ' + Math.ceil(P.length / 2));
  }
  $('prevBtn').disabled = idx <= 0;
  $('nextBtn').disabled = mode === 'single' ? idx >= P.length - 1 : idx + 2 >= P.length;
  preloadAround();
  mountComments();
}
function pageImgURL(p, small){
  var src = p.kind === 'video' ? (p.poster || p.file) : p.file;
  if(!/\.jpg$/i.test(src)) return src;
  return src.replace(/\.jpg$/i, '') + (small ? '-m.webp' : '-l.webp');
}
function preloadAround(){
  var small = window.matchMedia && window.matchMedia('(max-width:600px)').matches;
  var ahead = mode === 'single' ? 2 : 2;
  for(var d = 1; d <= ahead; d++){
    var q = P[idx + d];
    if(q && !q._pre){ q._pre = 1; var im = new Image(); im.src = pageImgURL(q, small); }
  }
  if(idx > 0){
    var b = P[idx - 1];
    if(b && !b._pre){ b._pre = 1; var im2 = new Image(); im2.src = pageImgURL(b, small); }
  }
}
function waitFaces(box, cb){
  var imgs = box.querySelectorAll('img');
  var total = imgs.length, done = 0, fired = false;
  function fin(){ if(!fired){ fired = true; cb(); } }
  if(!total || !imgs[0].decode){ setTimeout(fin, 0); return; }
  Array.prototype.forEach.call(imgs, function(im){
    var pr = im.decode ? im.decode() : Promise.resolve();
    pr.catch(function(){}).then(function(){ done++; if(done >= total) fin(); });
  });
  setTimeout(fin, 200);
}

/* ---------------- 翻页 ---------------- */
function paperSound(){
  if(!soundOn) return;
  var C = window.AudioContext || window.webkitAudioContext;
  if(!C) return;
  try{
    if(!window.__ac) window.__ac = new C();
    var c = window.__ac;
    if(c.state === 'suspended') c.resume();
    var t0 = c.currentTime + 0.01;
    // 翻书的沙沙声：两层高频噪声，快起慢落、带一点抖动
    function rustle(delay, dur, freq, gainVal){
      var len = Math.floor(c.sampleRate * dur);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var d = buf.getChannelData(0);
      for(var i = 0; i < len; i++){
        var p = i / len;
        var flutter = 0.72 + 0.28 * Math.sin(p * 46 + Math.random() * 0.9);
        d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, p * 1.2)) * flutter;
      }
      var s = c.createBufferSource(); s.buffer = buf;
      var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.6;
      bp.frequency.setValueAtTime(freq, t0 + delay);
      bp.frequency.exponentialRampToValueAtTime(freq * 1.5, t0 + delay + dur * 0.8);
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0 + delay);
      g.gain.exponentialRampToValueAtTime(gainVal, t0 + delay + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      s.connect(hp); hp.connect(bp); bp.connect(g); g.connect(c.destination);
      s.start(t0 + delay);
    }
    rustle(0, 0.55, 2300, 0.28);
    rustle(0.12, 0.30, 4100, 0.14);
    // 纸页的“身体”：一口气压下去的低频
    var osc = c.createOscillator(), og = c.createGain();
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(72, t0 + 0.18);
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.055, t0 + 0.015);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.20);
    osc.connect(og); og.connect(c.destination); osc.start(t0); osc.stop(t0 + 0.22);
  }catch(e){}
}

var pendingTurn = null;
var spreadTurning = false;
function turnTablet2D(dir){
  if(spreadTurning) return;
  var step = 2;
  var ni = dir === 'next' ? idx + step : idx - step;
  if(ni < 0 || (dir === 'next' && idx + step >= P.length)) return;
  if(dir === 'prev' && ni + 1 >= P.length) return;
  var spread = $('spread');
  if(!spread) return;
  stopVideos($('pageL')); stopVideos($('pageR')); stopVideos(spread);
  var ghost = spread.cloneNode(true);
  ghost.removeAttribute('id');
  Array.prototype.forEach.call(ghost.querySelectorAll('[id]'), function(x){ x.removeAttribute('id'); });
  ghost.classList.add('spread-ghost');
  ghost.style.position = 'absolute';
  ghost.style.inset = '0';
  ghost.style.width = '100%';
  ghost.style.height = '100%';
  ghost.style.zIndex = '8';
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '1';
  ghost.style.transform = 'translateX(0)';
  spread.parentNode.appendChild(ghost);
  spreadTurning = true;
  idx = ni;
  render();
  paperSound();
  void ghost.offsetWidth;
  ghost.style.transition = 'transform .32s cubic-bezier(.2,.7,.2,1), opacity .32s ease-out';
  ghost.style.transform = 'translateX(' + (dir === 'next' ? -14 : 14) + '%)';
  ghost.style.opacity = '0';
  setTimeout(function(){
    if(ghost.parentNode) ghost.parentNode.removeChild(ghost);
    spreadTurning = false;
  }, 360);
}
function turn(dir){
  var turning = $('turning');
  if(turning.dataset.busy === '1'){ pendingTurn = dir; return; }
  var oldL = P[idx], oldR = P[idx + 1];
  var newL, newR, frontP, backP;
  if(dir === 'next'){
    if(idx + 2 >= P.length) return;
    newL = P[idx + 2]; newR = P[idx + 3];
    frontP = oldR; backP = newL;
  } else {
    if(idx - 2 < 0) return;
    newL = P[idx - 2]; newR = P[idx - 1];
    frontP = oldL; backP = newR;
  }
  stopVideos($('pageL')); stopVideos($('pageR')); stopVideos(turning);
  turning.dataset.busy = '1';
  turning.hidden = false;
  turning.className = 'turning' + (dir === 'prev' ? ' prev' : '');
  var front = $('tFront'), back = $('tBack');
  front.className = 'tface front' + (frontP ? ' paper-' + frontP.paper : '');
  back.className = 'tface back' + (backP ? ' paper-' + backP.paper : '');
  front.innerHTML = pageHTML(frontP);
  back.innerHTML = pageHTML(backP);
  turning.style.visibility = 'hidden';
  waitFaces(turning, function(){
    if(dir === 'next'){ paint($('pageR'), newR, 'right'); }
    else { paint($('pageL'), newL, 'left'); }
    turning.style.visibility = '';
    void turning.offsetWidth;
    turning.classList.add('go');
    paperSound();
  });
  setTimeout(function(){
    stopVideos(turning);
    turning.hidden = true;
    turning.className = 'turning';
    turning.style.visibility = '';
    turning.dataset.busy = '';
    idx += dir === 'next' ? 2 : -2;
    render();
    if(pendingTurn){
      var d = pendingTurn; pendingTurn = null;
      setTimeout(function(){ turn(d); }, 70);
    }
  }, 1100);
}
var underIdx = -1, pageAnimating = false;
function resetPage(){
  var pr = $('pageR'); if(!pr) return;
  pr.style.transition = ''; pr.style.transform = ''; pr.style.opacity = '';
  pr.style.willChange = ''; pr.style.zIndex = '';
}
function hideUnder(){
  var u = $('pageUnder'), pr = $('pageR');
  underIdx = -1;
  if(u){ u.className = 'page page-under'; u.innerHTML = ''; u.style.visibility = 'hidden'; }
  if(pr) pr.style.zIndex = '';
}
function showUnder(n){
  var u = $('pageUnder'), p = P[n], pr = $('pageR');
  if(!u || !p){ hideUnder(); return; }
  if(underIdx === n && u.classList.contains('live')) return;
  underIdx = n;
  u.className = 'page right page-under live paper-' + p.paper;
  u.innerHTML = pageHTML(p);
  u.style.visibility = 'visible';
  u.style.zIndex = '0';
  if(pr) pr.style.zIndex = '2';
}
function animateTurn(target, dir){
  if(target < 0 || target >= P.length || pageAnimating) return;
  var pr = $('pageR');
  showUnder(target);
  pageAnimating = true;
  pr.style.transition = 'transform .14s cubic-bezier(.2,.7,.2,1)';
  pr.style.transform = 'translateX(' + (dir * 108) + '%)';
  pr.style.willChange = 'transform';
  paperSound();
  setTimeout(function(){
    idx = target;
    render();
    resetPage();
    hideUnder();
    pageAnimating = false;
  }, 150);
}
function slideTo(n){
  if(n < 0 || n >= P.length || pageAnimating) return;
  animateTurn(n, n < idx ? 1 : -1);
}
function fadeTo(n){ slideTo(n); }
function next(){
  if(mode === 'single'){ if(idx >= P.length - 1) return; fadeTo(idx + 1); }
  else turn('next');
}
function prev(){
  if(mode === 'single'){ if(idx <= 0) return; fadeTo(idx - 1); }
  else turn('prev');
}

/* ---------------- toast / 彩蛋 ---------------- */
var toastTimer = null;
function toast(msg, ms){
  var tEl = $('toast');
  tEl.textContent = msg;
  tEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ tEl.classList.remove('on'); }, ms || 3000);
}
function renderEggs(){
  var box = $('eggList');
  if(!box) return;
  var html = '';
  for(var i = 0; i < EGG_ORDER.length; i++){
    var id = EGG_ORDER[i], e = eggText(id), on = !!found[id];
    html += '<div class="egg-row' + (on ? ' found' : '') + '">'
      + '<span class="dot"></span>'
      + '<span class="ename">' + esc(e.name) + '</span>'
      + '<span class="ehint">' + (on ? T('找到了', 'found') : esc(e.hint)) + '</span>'
      + '</div>';
  }
  box.innerHTML = html;
  var ec = $('eggCount'); if(ec) ec.textContent = Object.keys(found).length;
  var eh = $('eggHead'); if(eh) eh.textContent = T(Object.keys(found).length + ' / 9 个。找到的会亮起来。', Object.keys(found).length + ' / 9 found. The found ones light up.');
}
function findEgg(id, msgZh, msgEn){
  var e = eggText(id);
  var message = LANG === 'en' ? (msgEn || e.msg) : (msgZh || e.msg);
  if(found[id]){ if(message) toast(message); return; }
  found[id] = true;
  renderEggs();
  toast(message || T('找到一个彩蛋。', 'One easter egg found.'));
  if(Object.keys(found).length === EGG_ORDER.length){
    setTimeout(function(){ toast(T('九个都找到了。爸爸真厉害。', 'All nine found. Well done, Dad.')); swim(); }, 1400);
  }
}
function swim(){
  var w = $('whale');
  w.hidden = false;
  w.classList.remove('swim');
  void w.offsetWidth;
  w.classList.add('swim');
  setTimeout(function(){ w.classList.remove('swim'); w.hidden = true; }, 15400);
}

/* ---------------- 声音 ---------------- */
function toggleSound(){
  soundOn = !soundOn;
  $('soundBtn').textContent = soundOn ? t('soundOn') : t('soundOff');
  if(soundOn){
    try{
      var C = window.AudioContext || window.webkitAudioContext;
      if(C && !window.__ac) window.__ac = new C();
      if(window.__ac && window.__ac.state === 'suspended') window.__ac.resume();
      startSea();
      toast(T('纸页声和潮声，都开了。', 'Paper and tide are on.'));
    }catch(e){}
  } else {
    stopSea();
    toast(T('安静一会儿。', 'Quiet for a while.'));
  }
}
function startSea(){
  var c = window.__ac; if(!c) return;
  if(window.__sea) return;
  var len = Math.floor(c.sampleRate * 3);
  var buf = c.createBuffer(1, len, c.sampleRate);
  var d = buf.getChannelData(0);
  for(var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
  var s = c.createBufferSource(); s.buffer = buf; s.loop = true;
  var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
  var g = c.createGain(); g.gain.value = 0.012;
  var lfo = c.createOscillator(); lfo.frequency.value = 0.08;
  var lg = c.createGain(); lg.gain.value = 0.008;
  lfo.connect(lg); lg.connect(g.gain);
  s.connect(f); f.connect(g); g.connect(c.destination);
  s.start(); lfo.start();
  window.__sea = { s: s, lfo: lfo, g: g };
}
function stopSea(){
  if(!window.__sea) return;
  try{ window.__sea.s.stop(); window.__sea.lfo.stop(); }catch(e){}
  window.__sea = null;
}

/* ---------------- 封面 ---------------- */
function daysInfo(){
  var now = new Date();
  var y = now.getFullYear();
  var target = new Date(y, 10, 13);
  var today = new Date(y, now.getMonth(), now.getDate());
  if(today > new Date(y, 10, 14)){ y = y + 1; target = new Date(y, 10, 13); }
  return { days: Math.round((target - today) / 86400000), year: y };
}
function gotoHash(){
  var m = /[#&]p=(\d+)/.exec(location.hash || '');
  if(!m) return;
  var n = parseInt(m[1], 10) - 1;
  if(isNaN(n) || n < 0 || n >= P.length) return;
  idx = mode === 'single' ? n : n - (n % 2);
  if(!$('bookScreen').hidden) render();
}
function openBook(){
  paperSound();
  $('coverScreen').classList.add('gone');
  setTimeout(function(){ $('coverScreen').hidden = true; $('bookScreen').hidden = false; render(); gotoHash(); }, 150);
}
$('coverBook').addEventListener('click', function(e){
  if(e.target.closest('#coverStamp') || e.target.closest('#coverSeal')) return;
  if(e.target.closest('.cover-chip') || e.target.closest('.langbtn')) return;
  openBook();
});
$('toBack').addEventListener('click', function(e){ e.stopPropagation(); $('coverBook').classList.add('flipped'); });
// 视频页：点开浮层播放
document.addEventListener('click', function(e){
  var vf = e.target.closest('.video-frame');
  if(vf && !vf.classList.contains('playing')){
    e.preventDefault(); e.stopPropagation();
    var src = vf.getAttribute('data-video');
    if(!src) return;
    var v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'metadata';
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline',''); v.setAttribute('x5-playsinline','');
    var po = vf.getAttribute('data-poster'); if(po) v.poster = po;
    vf.innerHTML = ''; vf.appendChild(v); vf.classList.add('playing');
    v.play().catch(function(){});
    return;
  }
  if(e.target.closest('#videoView') && !e.target.closest('.video-card')){ closeVideo(); }
  if(e.target.closest('#videoView .vclose')){ closeVideo(); }
});
function closeVideo(){
  var v = $('videoPlayer');
  if(v){ try{ v.pause(); }catch(err){} v.removeAttribute('src'); v.load(); }
  $('videoView').hidden = true;
}
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && !$('videoView').hidden) closeVideo();
});
$('toFront').addEventListener('click', function(e){ e.stopPropagation(); $('coverBook').classList.remove('flipped'); });
$('coverStamp').addEventListener('click', function(e){
  e.stopPropagation();
  var info = daysInfo();
  var zh, en;
  if(info.days === 0){ zh = '就是今天。生日快乐，爸爸。'; en = 'It is today. Happy birthday, Dad.'; }
  else if(info.days > 0){ zh = '还有 ' + info.days + ' 天。书已经装订好了。'; en = info.days + ' days to go. The book is already bound.'; }
  else { zh = '生日过去了 ' + Math.abs(info.days) + ' 天，书还在。'; en = 'The birthday passed ' + Math.abs(info.days) + ' days ago. The book remains.'; }
  findEgg('date', zh, en);
});
$('coverSeal').addEventListener('click', function(e){
  e.stopPropagation();
  findEgg('seal', '印章底下压着一封信。', 'A letter is pressed under the seal.');
  openSecret();
});
function openSecret(){
  var el = $('secret');
  var card = el.querySelector('.letter-paper');
  if(card) card.innerHTML = LETTER[LANG];
  openOverlay('secret');
}

/* ---------------- 页面交互 ---------------- */
document.addEventListener('click', function(e){
  var seal = e.target.closest('[data-seal]');
  if(seal){
    findEgg('seal', '印章底下压着一封信。', 'A letter is pressed under the seal.');
    openSecret();
    return;
  }
  var dot = e.target.closest('[data-egg="dot"]');
  if(dot){
    findEgg('dot');
    var ring = document.createElement('div');
    ring.className = 'eggring';
    dot.parentElement.appendChild(ring);
    setTimeout(function(){ if(ring.parentElement) ring.parentElement.removeChild(ring); }, 1600);
    return;
  }
  var pno = e.target.closest('[data-pn]');
  if(pno){
    var n = Number(pno.getAttribute('data-pn'));
    var now = Date.now();
    if(lastPno.el === pno && now - lastPno.t < 1100) lastPno.n++;
    else lastPno.n = 1;
    lastPno.el = pno; lastPno.t = now;
    if(lastPno.n >= 3){
      lastPno.n = 0;
      var pg = P[n - 1];
      if(LANG === 'en'){
        var oldEn = pg.title_en || pg.title;
        findEgg('pno', '', 'It used to be called "' + oldEn + '". This name was given on the night of 10 November 2026.');
      } else {
        var oldZh = pg.orig ? '它曾经叫「' + pg.orig + '」' : '它一直叫这个名字';
        findEgg('pno', oldZh + '。这个名字是二零二六年十一月十日晚上起的。');
      }
    }
    return;
  }
  var dateEl = e.target.closest('[data-date]');
  if(dateEl){
    var page = P[Number(dateEl.getAttribute('data-date')) - 1];
    if(!page.date) toast(T('有些日子，EXIF 也不记得。', 'Some days even EXIF does not remember.'));
    else if(page.egg === 'night') toast(T('夜里十一点拍的，EXIF 却写着下午两点十一分。相机也会撒谎。', 'Shot at eleven at night; EXIF insists it was 2:11 pm. Cameras lie too.'));
    else toast(fmtDate(page.date) + ' · ' + volumeOf(page.dir));
  }
});

/* 长按照片 */
var pressTimer = null, pressStart = null;
document.addEventListener('pointerdown', function(e){
  var fr = e.target.closest('[data-frame]');
  if(!fr) return;
  pressStart = { x: e.clientX, y: e.clientY };
  clearTimeout(pressTimer);
  pressTimer = setTimeout(function(){
    fr.classList.add('flip');
    findEgg('back', '相框背面有一行铅笔字。', 'There is a pencil line on the back of the frame.');
    setTimeout(function(){ fr.classList.remove('flip'); }, 2800);
  }, 850);
});
document.addEventListener('pointerup', function(){ clearTimeout(pressTimer); pressStart = null; });
document.addEventListener('pointercancel', function(){ clearTimeout(pressTimer); pressStart = null; });
document.addEventListener('pointermove', function(e){
  if(!pressStart) return;
  if(Math.abs(e.clientX - pressStart.x) > 12 || Math.abs(e.clientY - pressStart.y) > 12){
    clearTimeout(pressTimer); pressStart = null;
  }
});

/* 键盘 */
var word = '', konami = [], KON = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
document.addEventListener('keydown', function(e){
  resetIdle();
  konami.push(e.key);
  if(konami.length > KON.length) konami.shift();
  if(konami.join(',') === KON.join(',')){
    konami = [];
    document.body.classList.toggle('stars');
    findEgg('konami', '海面翻过来了。', 'The sea turned over.');
    swim();
  }
  if(e.key.length === 1){
    word = (word + e.key.toLowerCase()).slice(-12);
    if(word.indexOf('whale') >= 0){
      word = '';
      findEgg('whale', '鲸月路过了一下。', 'Jingyue passed by.');
      swim();
    }
  }
  if(e.key === 'Escape'){ closeAll(); return; }
  if(!overlayOpen()){
    if(e.key === 'ArrowRight' || e.key === ' '){ e.preventDefault(); next(); return; }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); prev(); return; }
  }
});

/* 静置 */
function resetIdle(){
  clearTimeout(idleTimer);
  idleTimer = setTimeout(function(){
    if(!found.idle){
      findEgg('idle', '你走神的一分钟里，我替你翻了一页。', 'In the minute you looked away, I turned a page for you.');
      swim(); next();
    } else resetIdle();
  }, 62000);
}
document.addEventListener('pointerdown', resetIdle, true);

/* 触摸：手机端像小说软件一样跟手翻页 */
var touchX = 0, touchY = 0, dragging = false, dragActive = false, dX = 0, dPage = null;
function snapBack(){
  if(!dPage) return;
  dPage.style.transition = 'transform .3s ease-out, box-shadow .3s ease-out';
  dPage.style.transform = '';
  dPage.style.boxShadow = '';
  setTimeout(function(){ dPage.style.transition = ''; }, 320);
}
function snapIn(dir){
  if(!dPage) return;
  dPage.style.transition = 'none';
  dPage.style.transform = 'translateX(' + (dir < 0 ? 46 : -46) + '%)';
  void dPage.offsetWidth;
  dPage.style.transition = 'transform .3s ease-out';
  dPage.style.transform = '';
}
$('bookWrap').addEventListener('touchstart', function(e){
  if(overlayOpen() || pageAnimating) return;
  if(e.target && e.target.closest && e.target.closest('video')) return;
  touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  dragging = true; dragActive = false; dX = 0;
  dPage = $('pageR');
  hideUnder();
  if(mode === 'single' && dPage){ resetPage(); dPage.style.transition = 'none'; }
  if(mode === 'spread' && $('book')){ $('book').style.transition = 'none'; $('book').style.transform = ''; }
}, { passive: true });
$('bookWrap').addEventListener('touchmove', function(e){
  if(!dragging || pageAnimating) return;
  var dx = e.touches[0].clientX - touchX;
  var dy = e.touches[0].clientY - touchY;
  if(!dragActive){
    if(Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.1) dragActive = true;
    else if(Math.abs(dy) > 16){ dragging = false; hideUnder(); return; }
    else return;
  }
  dX = dx;
  if(mode === 'single' && dPage){
    e.preventDefault();
    var r = Math.max(-170, Math.min(170, dx * 0.72));
    dPage.style.transform = 'translateX(' + r + 'px)';
    dPage.style.willChange = 'transform';
    var target = idx + (dx < 0 ? 1 : -1);
    if(dx !== 0 && target >= 0 && target < P.length) showUnder(target);
    else hideUnder();
  } else if(mode === 'spread'){
    e.preventDefault();
  }
}, { passive: false });
$('bookWrap').addEventListener('touchend', function(e){
  if(!dragging) return;
  dragging = false;
  if(pageAnimating){ dX = 0; dragActive = false; return; }
  if(mode === 'spread'){
    if(dragActive && Math.abs(dX) > 55){ turn(dX < 0 ? 'next' : 'prev'); }
    dX = 0; dragActive = false; return;
  }
  if(mode === 'single' && dragActive && Math.abs(dX) > 55){
    var dir = dX < 0 ? 1 : -1;
    var target = idx + dir;
    if(target < 0 || target >= P.length){ snapBack(); hideUnder(); }
    else { animateTurn(target, -dir); }
  } else if(mode === 'single' && dragActive){
    snapBack(); hideUnder();
  } else if(!dragActive){
    var dx2 = e.changedTouches[0].clientX - touchX;
    if(Math.abs(dx2) > 60){ if(dx2 < 0) next(); else prev(); }
  }
  dX = 0; dragActive = false;
}, { passive: true });

/* ---------------- 浮层 ---------------- */
var openView = null;
function overlayOpen(){ return !!openView; }
function openOverlay(id){
  var v = $(id);
  if(!v) return;
  closeAll(true);
  v.hidden = false;
  openView = id;
  if(id === 'atlasView'){ setTimeout(drawAtlas, 30); }
  if(id === 'namesView'){ buildNames(); }
  if(id === 'reelView'){ ensureClip(); }
  if(id === 'eggView'){ renderEggs(); }
  if(id === 'contentsView'){ buildVolumes(); }
}
function closeAll(silent){
  ['contentsView','atlasView','reelView','modelsView','eggView','namesView','musicView','addView','addedView','letterView','commentsView','secret'].forEach(function(id){
    var v = $(id); if(v) v.hidden = true;
  });
  openView = null;
  if(!silent && $('reelVideo')){ try{ $('reelVideo').pause(); }catch(e){} }
}
document.addEventListener('click', function(e){
  if(e.target.closest('[data-close]')){ closeAll(); return; }
  var ov = e.target.classList && e.target.classList.contains('overlay') ? e.target : null;
  if(ov && ov.id !== 'secret') closeAll();
});
document.querySelectorAll('.tools [data-view]').forEach(function(b){
  b.addEventListener('click', function(){ openOverlay(b.getAttribute('data-view') + 'View'); });
});
var eggBtn = $('eggBtn'); if(eggBtn) eggBtn.addEventListener('click', function(){ openOverlay('eggView'); });
$('soundBtn').addEventListener('click', toggleSound);
$('prevBtn').addEventListener('click', prev);
$('nextBtn').addEventListener('click', next);

/* ---------------- 目录 ---------------- */
function countBy(key){ var c = 0; ALL.forEach(function(x){ if(topDir(x.dir) === key) c++; }); return c; }
function pageOfVol(key){ for(var i = 0; i < P.length; i++){ if(topDir(P[i].dir) === key) return i; } return -1; }
function buildVolumes(){
  var box = $('volumeList');
  var html = '';
  var shown = VOLS.filter(function(v){ return countBy(v.key) > 0 || P.some(function(p){ return topDir(p.dir) === v.key; }); });
  shown.forEach(function(v, i){
    var total = countBy(v.key);
    var mine = P.filter(function(p){ return topDir(p.dir) === v.key; }).length;
    var w = total ? Math.round(mine / total * 100) : 0;
    html += '<div class="vol-row" data-vol="' + v.key + '">'
      + '<span class="idx">' + pad(i + 1) + '</span>'
      + '<span class="vname">' + (LANG === 'en' ? v.en : v.name) + '<small>' + t2(v.note, v.noteEn) + '</small></span>'
      + '<span class="vmeta">' + T(total + ' 件 · 已装订 ' + mine, total + ' pieces · ' + mine + ' bound') + '</span>'
      + '<span class="vbar"><i style="width:' + w + '%"></i></span>'
      + '</div>';
  });
  box.innerHTML = html;
  $('bindNote').textContent = T('装订进度 ' + P.length + ' / ' + ST.files, 'Bound ' + P.length + ' / ' + ST.files);
  Array.prototype.forEach.call(box.querySelectorAll('[data-vol]'), function(row){
    row.addEventListener('click', function(){
      var key = row.getAttribute('data-vol');
      var pi = pageOfVol(key);
      if(pi < 0){ toast(T('这一卷还在暗房里，没有装订。', 'This volume is still in the darkroom.')); return; }
      closeAll();
      idx = mode === 'single' ? pi : pi - (pi % 2);
      render();
      toast(volumeOf(P[pi].dir) + T(' · 从这里开始。', ' · starts here.'));
    });
  });
}
function t2(zh, en){ return LANG === 'en' ? en : zh; }
$('openNames').addEventListener('click', function(){ findEgg('names'); openOverlay('namesView'); });

/* ---------------- 附卷：名字 ---------------- */
var namesBuilt = false;
function buildNames(){
  namesBuilt = true;
  var box = $('namesList');
  var order = ['校园','意义','影石','神图','生活','抽象','个性','精美','Life'];
  var html = '';
  var total = ALL.length, named = 0;
  order.forEach(function(key){
    var items = ALL.filter(function(x){ return topDir(x.dir) === key; });
    if(!items.length) return;
    html += '<div class="grp">' + (LANG === 'en' ? (FOLDER_EN[key] || key) : key) + ' · ' + items.length + '</div>';
    items.forEach(function(it){
      var isNamed = !/^[0-9]+$/.test(it.title);
      if(isNamed) named++;
      var sub = it.dir.indexOf('/') >= 0 ? it.dir.split('/').slice(1).join(' / ') : '';
      html += '<div class="nm' + (isNamed ? '' : ' wait') + '" title="' + esc(it.dir) + '">'
        + esc(it.title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    });
  });
  box.innerHTML = html;
  $('namesNote').textContent = T(total + ' 个文件，' + named + ' 个已经有名字，' + (total - named) + ' 个还在等',
    total + ' files, ' + named + ' named, ' + (total - named) + ' still waiting. The names remain in Chinese.');
  $('namesCount').textContent = named + ' / ' + total;
}
$('namesSearch').addEventListener('input', function(e){
  var q = e.target.value.trim();
  var rows = $('namesList').querySelectorAll('.nm');
  for(var i = 0; i < rows.length; i++){
    var ok = !q || rows[i].textContent.indexOf(q) >= 0;
    rows[i].style.display = ok ? '' : 'none';
  }
});

/* ---------------- 年表 ---------------- */
var atlasPoints = [];
function dateNum(d){ var a = d.split('-'); return Math.round(Date.UTC(Number(a[0]), Number(a[1]) - 1, Number(a[2])) / 86400000); }
function drawAtlas(){
  var cv = $('atlasCanvas');
  if(!cv) return;
  var wrap = cv.parentElement;
  var w = wrap.clientWidth - 2;
  var h = Math.min(Math.round(window.innerHeight * 0.52), 420);
  var dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  cv.style.height = h + 'px';
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  var padL = 46, padR = 18, padT = 24, padB = 78;
  var plotW = w - padL - padR, plotH = h - padT - padB;
  var dated = ALL.filter(function(x){ return x.date; });
  dated.sort(function(a, b){ return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
  if(!dated.length) return;
  var min = dateNum(dated[0].date), max = dateNum(dated[dated.length - 1].date);
  var span = Math.max(1, max - min);

  ctx.strokeStyle = 'rgba(44,36,24,0.10)';
  ctx.fillStyle = 'rgba(44,36,24,0.62)';
  ctx.font = '10px Consolas, monospace';
  for(var hr = 0; hr <= 24; hr += 6){
    var y = padT + plotH * (hr / 24);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(pad(hr) + ':00', 8, y + 3);
  }
  var start = new Date(dated[0].date + 'T00:00:00');
  var cur = new Date(start.getFullYear(), start.getMonth(), 1);
  var end = new Date(dated[dated.length - 1].date + 'T00:00:00');
  while(cur <= end){
    var dn = Math.round(Date.UTC(cur.getFullYear(), cur.getMonth(), cur.getDate()) / 86400000);
    var x = padL + (dn - min) / span * plotW;
    if(x >= padL - 1 && x <= w - padR + 1){
      ctx.strokeStyle = 'rgba(44,36,24,0.06)';
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.fillStyle = 'rgba(44,36,24,0.58)';
      ctx.save();
      ctx.translate(x + 4, padT + plotH + 16);
      ctx.rotate(-0.5);
      ctx.fillText(cur.getFullYear() + '.' + pad(cur.getMonth() + 1), 0, 0);
      ctx.restore();
    }
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  ctx.strokeStyle = 'rgba(44,36,24,0.22)';
  ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(w - padR, padT + plotH); ctx.stroke();

  var COL = {'校园':'#E9B33F','意义':'#D96A5C','影石':'#2A4E78','神图':'#6FA8C9','生活':'#C9A63F','抽象':'#B07AA8','个性':'#E39B7E','精美':'#9AA3A8','Life':'#7E8B57'};
  atlasPoints = [];
  ALL.forEach(function(it){
    var col = COL[topDir(it.dir)] || '#c9a45c';
    if(it.date){
      var a = it.time ? it.time.split('-') : ['12','0','0'];
      var hh = Number(a[0]) + Number(a[1]) / 60;
      var x2 = padL + (dateNum(it.date) - min) / span * plotW;
      var y2 = padT + plotH * (hh / 24);
      atlasPoints.push({ x:x2, y:y2, item:it });
      if(it.kind === 'video'){
        ctx.strokeStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x2, y2, 3.6, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = col; ctx.globalAlpha = 0.82;
        ctx.beginPath(); ctx.arc(x2, y2, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  });
  var und = ALL.filter(function(x){ return !x.date; });
  var uy = padT + plotH + 46;
  ctx.fillStyle = 'rgba(44,36,24,0.42)';
  ctx.font = '10px Consolas, monospace';
  ctx.fillText(T('没有日期 ' + und.length, 'undated ' + und.length), 8, uy + 3);
  und.forEach(function(it, i){
    var x3 = padL + (i + 1) / (und.length + 1) * plotW;
    var y3 = uy + (i % 2) * 9;
    atlasPoints.push({ x:x3, y:y3, item:it, und:true });
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = COL[topDir(it.dir)] || '#c9a45c';
    ctx.beginPath(); ctx.arc(x3, y3, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  var chips = LANG === 'en'
    ? [['Files', ST.files], ['Photos', ST.photos], ['Clips', ST.videos], ['Dated', ST.dated], ['Undated', ST.undated], ['Named', ST.named], ['Size', ST.gb + ' GB']]
    : [['文件', ST.files], ['照片', ST.photos], ['视频', ST.videos], ['有日期', ST.dated], ['没有日期', ST.undated], ['有名字', ST.named], ['体积', ST.gb + ' GB']];
  $('atlasStats').innerHTML = chips.map(function(c){ return '<span>' + c[0] + ' <b>' + c[1] + '</b></span>'; }).join('');

  var legend = '';
  Object.keys(COL).forEach(function(k){
    legend += '<span><i style="background:' + COL[k] + '"></i>' + (LANG === 'en' ? (FOLDER_EN[k] || k) : k) + '</span>';
  });
  $('atlasLegend').innerHTML = legend;
}
function pageIndexByItem(it){
  for(var i = 0; i < P.length; i++){ if(P[i].title === it.title && P[i].dir === it.dir) return i; }
  return -1;
}
var atlasTipEl = null;
function bindAtlas(){
  var cv = $('atlasCanvas');
  var tip = $('atlasTip');
  function nearest(e){
    var r = cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var best = null, bd = 196;
    atlasPoints.forEach(function(p){
      var d = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
      if(d < bd){ bd = d; best = p; }
    });
    return best;
  }
  cv.addEventListener('mousemove', function(e){
    var p = nearest(e);
    if(!p){ tip.classList.remove('on'); return; }
    var it = p.item;
    tip.textContent = it.title + ' · ' + (it.dir || '') + ' · ' + (it.date ? fmtDate(it.date) : T('没有日期', 'no date'));
    tip.style.left = p.x + 'px';
    tip.style.top = p.y + 'px';
    tip.classList.add('on');
  });
  cv.addEventListener('mouseleave', function(){ tip.classList.remove('on'); });
  cv.addEventListener('click', function(e){
    var p = nearest(e);
    if(!p) return;
    var it = p.item;
    if(it.kind === 'video'){ openOverlay('reelView'); return; }
    var pi = pageIndexByItem(it);
    if(pi < 0){ toast(T('「' + it.title + '」还在暗房里。这一页没装订。', '"' + it.title + '" is still in the darkroom.')); return; }
    closeAll();
    idx = mode === 'single' ? pi : pi - (pi % 2);
    render();
    toast(T('翻到「' + it.title + '」。', 'Opened "' + it.title + '".'));
  });
}
bindAtlas();

/* ---------------- 放映室 ---------------- */
var CLIPS = {
  '夜里的拍摄': { src:'../assets/video/night.mp4', album:'影石', note:'他举着相机，对着亮着邮局红字的楼。三秒半，风很大。', noteEn:'Camera raised toward the post-office sign. Three seconds; the wind was strong.', date:'2026.09.09', badge:'片头', badgeEn:'Opening' },
  '敬礼中': { src:'../assets/video/life_salute.mp4', album:'明媚的镜头', note:'站直，抬手，敬礼。五秒半，认真得不像随手拍的。', noteEn:'Stand straight, raise a hand, salute. Five seconds, serious as can be.', date:'2026.02.17', badge:'已接入', badgeEn:'Playable' },
  '操场剧终': { src:'../assets/video/life_field.mp4', album:'校园记录', note:'操场上最后一段。跑完这一圈，这一年也快完了。', noteEn:'The last lap on the field. One more round and the year is over.', date:'2026.06.21', badge:'已接入', badgeEn:'Playable' }
};
function fmtDur(s){ s = Math.floor(s || 0); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
function vidTitle(v){ return LANG === 'en' ? (VID_EN[v.title] || v.title) : v.title; }
function buildPlaylist(){
  var box = $('playlist');
  var albums = ['明媚的镜头','校园记录','氛围与感觉','生活与我','装福日常','成长的记录','影石'];
  var html = '';
  albums.forEach(function(al){
    var items = VIDS.filter(function(v){ return v.album === al; });
    if(!items.length) return;
    html += '<div class="pl-album"><h4>' + (LANG === 'en' ? (ALBUM_EN[al] || al) : al) + '<small>' + items.length + T(' 段', ' clips') + '</small></h4>';
    items.forEach(function(v){
      var ready = !!(v.file || CLIPS[v.title]);
      html += '<div class="pl-item' + (ready ? '' : ' locked') + '" data-clip="' + esc(v.title) + '">'
        + esc(vidTitle(v))
        + (ready ? '' : '<span class="lock">' + T('待接入', 'soon') + '</span>')
        + '<span class="dur">' + fmtDur(v.dur) + '</span></div>';
    });
    html += '</div>';
  });
  box.innerHTML = html;
  Array.prototype.forEach.call(box.querySelectorAll('[data-clip]'), function(row){
    row.addEventListener('click', function(){
      var title = row.getAttribute('data-clip');
      var c = (VIDS.filter(function(x){ return x.title === title; })[0]) || CLIPS[title];
      if(!c || !(c.file || c.src)){ toast(T('这一段还在洗印房。', 'This clip is still in the lab.')); return; }
      playClip(title, c);
    });
  });
}
function playClip(title, c){
  var v = $('reelVideo');
  v.src = c.src || c.file;
  v.play().catch(function(){});
  $('clapTitle').textContent = LANG === 'en' ? (VID_EN[title] || title) : title;
  $('clapBadge').textContent = LANG === 'en' ? (c.badgeEn || c.badge) : c.badge;
  $('clapAlbum').textContent = LANG === 'en' ? (ALBUM_EN[c.album] || c.album || '') : (c.album || '');
  var meta = VIDS.filter(function(x){ return x.title === title; })[0];
  $('clapDur').textContent = meta ? fmtDur(meta.dur) : '00:03';
  $('clapSize').textContent = (meta ? meta.mb : 22.5) + ' MB';
  $('clapDate').textContent = c.date || '—';
  $('clapNote').textContent = LANG === 'en'
    ? (c.noteEn || ('A moving memory: ' + title + '.'))
    : (c.note || ('一段会动的记忆：' + title + '。'));
  Array.prototype.forEach.call($('playlist').querySelectorAll('.pl-item'), function(r){
    r.classList.toggle('on', r.getAttribute('data-clip') === title);
  });
}
function ensureClip(){
  if(!$('reelVideo').src){
    var first = VIDS.filter(function(v){ return v.file || CLIPS[v.title]; })[0];
    if(first) playClip(first.title, first);
  }
  buildPlaylist();
}
$('reelVideo').addEventListener('ended', function(){
  toast(T('（片尾没有字幕。他从来不看完自己的视频。）', '(No credits. He never finishes watching his own clips.)'), 4200);
});

/* ---------------- 模型 ---------------- */
function buildModels(){
  var grid = document.querySelector('#modelsView .model-grid');
  if(!grid) return;
  var arr = MODELS[LANG] || MODELS.zh;
  var html = '';
  arr.forEach(function(m){
    html += '<article class="model-card"><div class="mini mini-' + (m.k === 'A' ? 'book' : m.k === 'B' ? 'sky' : m.k === 'C' ? 'game' : 'phone') + '">'
      + (m.k === 'A' ? '<i></i><i></i><em></em>' : m.k === 'B' ? '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>' : m.k === 'C' ? '<i></i><i></i><em></em><em></em>' : '<i></i><i></i><i></i><i></i><i></i><i></i>')
      + '</div><h3><span>' + m.k + '</span>' + m.name + '</h3>'
      + '<p class="model-one">' + m.one + '</p><p class="model-body">' + m.body + '</p>'
      + '<div class="model-tags">' + m.tags.map(function(x, ii){ return '<span' + (ii === 0 ? ' class="yes"' : '') + '>' + x + '</span>'; }).join('') + '</div>'
      + (m.link ? '<a class="linkbtn" href="' + m.link + '" target="_blank" rel="noopener">' + m.linkText + '</a>' : '')
      + '</article>';
  });
  grid.innerHTML = html;
  var foot = document.querySelector('#modelsView .model-foot');
  if(foot) foot.innerHTML = modelFoot();
}

/* ---------------- 语言与静态文案 ---------------- */
function applyStatic(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if(STR[LANG][k] != null) el.textContent = STR[LANG][k];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    var k = el.getAttribute('data-i18n-html');
    if(STR[LANG][k] != null) el.innerHTML = STR[LANG][k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var k = el.getAttribute('data-i18n-ph');
    if(STR[LANG][k] != null) el.placeholder = STR[LANG][k];
  });
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  document.title = LANG === 'en' ? 'Mr.Dentier' : 'Mr.Dentier｜二十岁的一年';
  $('soundBtn').textContent = soundOn ? t('soundOn') : t('soundOff');
  document.querySelectorAll('.langbtn').forEach(function(b){ b.classList.toggle('en-on', LANG === 'en'); });
  // 数据驱动的副标题
  var volCount = VOLS.filter(function(v){ return ALL.some(function(x){ return topDir(x.dir) === v.key; }); }).length;
  var sub = document.querySelector('#contentsView .ov-head p');
  if(sub) sub.textContent = T(volCount + ' 卷 · 附卷 · ' + D.stats.photos + ' 页 · ' + D.stats.files + ' 件',
    volCount + ' volumes · appendix · ' + D.stats.photos + ' pages · ' + D.stats.files + ' pieces');
  var rsub = document.querySelector('#reelView .ov-head p');
  if(rsub) rsub.textContent = T(D.stats.videos + ' 段动态 · 片单与场记', D.stats.videos + ' clips · reels and slates');
  var bind = $('bindNote');
  if(bind) bind.textContent = T('装订进度 ' + D.stats.photos + ' / ' + D.stats.files, 'Bound ' + D.stats.photos + ' / ' + D.stats.files);
  var bandSpan = document.querySelector('#coverScreen .cover-band span');
  if(bandSpan) bandSpan.textContent = volCount + ' VOLUMES · ' + D.stats.files + ' PIECES · ONE COPY';
  var col = document.querySelectorAll('#coverScreen .back-colophon p');
  if(col.length >= 3){
    col[0].textContent = T(volCount + ' 卷 · ' + D.stats.files + ' 件 · ' + D.stats.photos + ' 页',
      volCount + ' volumes · ' + D.stats.files + ' pieces · ' + D.stats.photos + ' pages');
  }
  var namesCard = document.querySelector('#namesView .ov-card');
  if(namesCard) namesCard.classList.toggle('parchment', true);
}
function applyLang(rebuild){
  applyStatic();
  buildModels();
  render();
  renderEggs();
  buildPlaylist();
  if(openView === 'contentsView') buildVolumes();
  if(openView === 'atlasView') drawAtlas();
  if(openView === 'namesView'){ buildNames(); }
  if(openView === 'secret'){ var card = document.querySelector('#secret .letter-paper'); if(card) card.innerHTML = LETTER[LANG]; }
  if(openView === 'reelView'){ ensureClip(); }
}
function setLang(l){
  LANG = l === 'en' ? 'en' : 'zh';
  try{ localStorage.setItem('album-lang', LANG); }catch(e){}
  applyLang(true);
}
document.querySelectorAll('.langbtn').forEach(function(b){
  b.addEventListener('click', function(e){ e.stopPropagation(); setLang(LANG === 'en' ? 'zh' : 'en'); });
});

/* ---------------- 私享版：添加照片 ---------------- */
var customRecs = [], addDB = null, addSeq = 0;
function openAddDB(){
  return new Promise(function(res, rej){
    try{
      var r = indexedDB.open('album-add', 1);
      r.onupgradeneeded = function(){ if(!r.result.objectStoreNames.contains('photos')) r.result.createObjectStore('photos', { keyPath:'id' }); };
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    }catch(e){ rej(e); }
  });
}
function idbAll(db){
  return new Promise(function(res, rej){
    var t = db.transaction('photos','readonly').objectStore('photos').getAll();
    t.onsuccess = function(){ res(t.result || []); };
    t.onerror = function(){ rej(t.error); };
  });
}
function idbPut(db, obj){
  return new Promise(function(res, rej){
    var t = db.transaction('photos','readwrite');
    t.objectStore('photos').put(obj);
    t.oncomplete = function(){ res(); };
    t.onerror = function(){ rej(t.error); };
  });
}
function customPage(rec){
  var n = P.length + 1;
  var isP = rec.h > rec.w * 1.02;
  return { n:n, key:'u'+(++addSeq), title: rec.title || '未命名', title_en:'', dir:'我的添加',
    file: URL.createObjectURL(rec.blob), w:rec.w, h:rec.h, date: rec.date || '', time:'',
    paper: isP ? 'cream' : 'postcard', frame: isP ? 'wood' : 'polaroid', tag: 'tag-hand',
    caption: (rec.date ? rec.date.replace(/-/g,'.') + '，' : '') + '后来加进来的一页。',
    caption_en: 'A page added later.', back:'背面什么也没写。', back_en:'Nothing written on the back.',
    egg:'', orig:'', seal: n % 2 ? '光' : '影', fnum:'', exp:'', iso:'', focal:'', model:'', fx:'' };
}
function appendCustomPage(rec){
  customRecs.push(rec);
  P.push(customPage(rec));
  ST.photos = P.length;
  ST.files = Math.max(ST.files, P.length);
  ST.named = ST.named + 1;
  if($('pagerText')) render();
}
function addOne(db, file){
  return new Promise(function(resolve){
    try{
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        var max = 1600, scale = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function(blob){
          if(!blob){ URL.revokeObjectURL(url); resolve(); return; }
          var rec = { id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
            title: file.name.replace(/\.[^.]+$/, ''), date: new Date(file.lastModified || Date.now()).toISOString().slice(0,10),
            w: c.width, h: c.height, blob: blob };
          idbPut(db, rec).then(function(){ appendCustomPage(rec); URL.revokeObjectURL(url); resolve(); });
        }, 'image/jpeg', 0.85);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    }catch(e){ resolve(); }
  });
}
var TRACKS = [
  { title:'忘记时间', file:'music/02-wangjishijian.mp3', dur:'4:32' },
  { title:'主角', file:'music/01-zhujue.mp3', dur:'4:18' },
  { title:'此生不换', file:'music/05-cishibuhuan.mp3', dur:'4:26' }
];
var musicAudio = null, musicIdx = 0, musicStarted = false;
function fmtTime(s){
  if(!isFinite(s) || s <= 0) return '0:00';
  s = Math.floor(s); var m = Math.floor(s / 60), ss = s % 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}
function buildTrackList(){
  var box = $('trackList'); if(!box) return;
  var html = '';
  TRACKS.forEach(function(t, i){
    html += '<div class="track-row" data-track="' + i + '">'
      + '<span class="tn">' + (i < 9 ? '0' : '') + (i + 1) + '</span>'
      + '<span class="tt">' + esc(t.title) + '</span>'
      + '<span class="td">' + t.dur + '</span></div>';
  });
  box.innerHTML = html;
  Array.prototype.forEach.call(box.querySelectorAll('[data-track]'), function(row){
    row.addEventListener('click', function(){
      loadTrack(parseInt(row.getAttribute('data-track'), 10), true);
    });
  });
}
function updateMusicUI(){
  var t = TRACKS[musicIdx] || TRACKS[0];
  if($('trackNow')) $('trackNow').textContent = t.title;
  if($('trackArtist')) $('trackArtist').textContent = musicStarted ? 'Mr.Dentier · 2026' : '点击播放';
  var list = $('trackList');
  if(list) Array.prototype.forEach.call(list.querySelectorAll('[data-track]'), function(row){
    row.classList.toggle('active', parseInt(row.getAttribute('data-track'), 10) === musicIdx);
  });
  var lbl = document.querySelector('#musicBtn .mt-label');
  if(lbl) lbl.textContent = musicStarted ? t.title : T('音乐','Music');
  if($('musicPlay')) $('musicPlay').textContent = (musicAudio && !musicAudio.paused) ? '❚❚' : '▶';
  if($('vinyl')) $('vinyl').classList.toggle('playing', !!(musicAudio && !musicAudio.paused));
  if($('musicBtn')) $('musicBtn').classList.toggle('playing', !!(musicAudio && !musicAudio.paused));
}
function loadTrack(i, play){
  if(!musicAudio || !TRACKS.length) return;
  musicIdx = (i + TRACKS.length) % TRACKS.length;
  musicStarted = true;
  musicAudio.src = TRACKS[musicIdx].file;
  musicAudio.load();
  updateMusicUI();
  if(play){ musicAudio.play().catch(function(){}); }
}
function setupMusic(){
  musicAudio = $('musicAudio');
  if(!musicAudio || !TRACKS.length) return;
  buildTrackList();
  updateMusicUI();
  $('musicBtn').addEventListener('click', function(){
    openOverlay('musicView');
    if(!musicStarted) loadTrack(0, true);
  });
  $('musicPlay').addEventListener('click', function(){
    if(!musicStarted){ loadTrack(0, true); return; }
    if(musicAudio.paused) musicAudio.play().catch(function(){}); else musicAudio.pause();
  });
  $('musicPrev').addEventListener('click', function(){ loadTrack(musicIdx - 1, true); });
  $('musicNext').addEventListener('click', function(){ loadTrack(musicIdx + 1, true); });
  $('musicSeek').addEventListener('input', function(){
    if(musicAudio.duration) musicAudio.currentTime = (this.value / 1000) * musicAudio.duration;
  });
  musicAudio.addEventListener('timeupdate', function(){
    if($('musicTime')) $('musicTime').textContent = fmtTime(musicAudio.currentTime) + ' / ' + fmtTime(musicAudio.duration);
    if($('musicSeek') && musicAudio.duration) $('musicSeek').value = Math.round(musicAudio.currentTime / musicAudio.duration * 1000);
  });
  musicAudio.addEventListener('loadedmetadata', function(){ updateMusicUI(); });
  musicAudio.addEventListener('play', updateMusicUI);
  musicAudio.addEventListener('pause', updateMusicUI);
  musicAudio.addEventListener('ended', function(){ loadTrack(musicIdx + 1, true); });
  document.addEventListener('play', function(e){
    if(e.target && e.target.tagName === 'VIDEO' && musicAudio && !musicAudio.paused) musicAudio.pause();
  }, true);
  document.addEventListener('pointerdown', function unlockMusicOnce(){
    if(musicAudio && musicStarted && musicAudio.paused){ musicAudio.play().catch(function(){}); }
  }, { once: true });
  // 微信内置浏览器：先不抢图，首次触摸再起播（微信不允许真正自动播放）
  if(IS_WECHAT){
    document.addEventListener('pointerdown', function(){ if(!musicStarted) loadTrack(0, true); }, { once:true, passive:true });
  } else {
    setTimeout(function(){ loadTrack(0, true); }, 1400);
  }
}
function shakeAddTarget(start){
  setTimeout(function(){
    var pages = document.querySelectorAll('#book .page');
    Array.prototype.forEach.call(pages, function(p){ if(p && p.innerHTML) p.classList.add('add-flash'); });
    setTimeout(function(){ Array.prototype.forEach.call(pages, function(p){ p.classList.remove('add-flash'); }); }, 900);
  }, 60);
}
function handlePhotoFiles(files){
  if(!files || !files.length) return;
  files = Array.prototype.slice.call(files);
  var start = P.length;
  openAddDB().then(function(db){
    addDB = db; var chain = Promise.resolve();
    files.forEach(function(f){ chain = chain.then(function(){ return addOne(db, f); }); });
    return chain;
  }).then(function(){
    if(P.length > start){
      var target = start;
      idx = mode === 'single' ? target : target - (target % 2);
      render();
      shakeAddTarget(target);
      var first = P[start];
      if(first && $('addedImg')){
        $('addedImg').src = first.file;
        if($('addedMeta')) $('addedMeta').textContent = T('第 ' + (start + 1) + ' 页 · 本次 +' + files.length + ' 张', 'Page ' + (start + 1) + ' · +' + files.length + ' new');
        openOverlay('addedView');
      } else {
        toast(T('加好了 ' + files.length + ' 张。', 'Added ' + files.length + ' photo(s).'));
      }
    } else {
      render();
      toast(T('没有加到照片。', 'No photo was added.'));
    }
  }).catch(function(){ toast(T('这台浏览器不支持本地存照片。','This browser cannot store photos locally.')); });
}
function setupAddPhotos(){
  if(!D.canAdd) return;
  var tools = document.querySelector('#top .tools');
  if(!tools) return;
  var btn = document.createElement('button');
  btn.id = 'addBtn';
  btn.innerHTML = '＋<span>照片</span>';
  btn.title = T('添加照片','Add photos');
  tools.insertBefore(btn, $('soundBtn'));
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
  document.body.appendChild(inp);
  btn.addEventListener('click', function(){ openOverlay('addView'); });
  var pick = $('pickPhotos');
  if(pick) pick.addEventListener('click', function(){ inp.click(); });
  if($('addedGoto')) $('addedGoto').addEventListener('click', function(){ closeAll(); });
  inp.addEventListener('change', function(){
    if(!inp.files || !inp.files.length) return;
    var files = Array.prototype.slice.call(inp.files);
    inp.value = '';
    handlePhotoFiles(files);
  });
  var dz = $('dropZone');
  if(dz){
    ['dragenter','dragover'].forEach(function(ev){ dz.addEventListener(ev, function(e){ e.preventDefault(); dz.classList.add('drag'); }); });
    ['dragleave','drop'].forEach(function(ev){ dz.addEventListener(ev, function(e){ e.preventDefault(); dz.classList.remove('drag'); }); });
    dz.addEventListener('drop', function(e){
      if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) handlePhotoFiles(e.dataTransfer.files);
    });
  }
  openAddDB().then(function(db){ addDB = db; return idbAll(db); }).then(function(recs){
    if(recs && recs.length){ recs.forEach(function(r){ appendCustomPage(r); }); render(); }
  }).catch(function(){});
}
function setupLetter(){
  if(!$('letterView')) return;
  var stamp = $('coverStamp');
  if(!stamp) return;
  stamp.style.userSelect = 'none';
  stamp.style.touchAction = 'none';
  var timer = null;
  function cancel(){ if(timer){ clearTimeout(timer); timer = null; } }
  stamp.addEventListener('pointerdown', function(e){
    e.preventDefault(); e.stopPropagation();
    cancel();
    timer = setTimeout(function(){ timer = null; openOverlay('letterView'); }, 1100);
  });
  ['pointerup','pointerleave','pointercancel','pointerout'].forEach(function(ev){
    stamp.addEventListener(ev, cancel);
  });
  stamp.addEventListener('contextmenu', function(e){ e.preventDefault(); });
}
function setupMode(){
  if(D.mode === 'public'){
    document.body.classList.add('public');
    var mb = document.querySelector('[data-view="models"]');
    if(mb) mb.style.display = 'none';
  }
}

/* ---------------- 启动 ---------------- */
var scaleBox = $('coverScale');
if(scaleBox){
  for(var yi = 1; yi <= 20; yi++){
    var tick = document.createElement('i');
    if(yi === 20) tick.className = 'on';
    scaleBox.appendChild(tick);
  }
}
applyStatic();
buildModels();
buildPlaylist();
renderEggs();
setupMode();

/* ---------------- 页内匿名留言（聊天框） ---------------- */
var commentToken=0, commentKey='', commentPanel=null, commentCache={}, commentHost=null, commentPosting=false;
function escHTML(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function anonAlias(){
  try{
    var k='mrd_anon_id', v=localStorage.getItem(k);
    if(!v){ v=Math.random().toString(16).slice(2,6).toUpperCase(); localStorage.setItem(k,v); }
    return '匿名·'+v;
  }catch(e){ return '匿名·访客'; }
}
function aliasHue(a){
  var h=0; for(var i=0;i<a.length;i++) h=(h*31+a.charCodeAt(i))>>>0; return h%360;
}
function makeCommentPanel(){
  if(commentPanel) return commentPanel;
  commentPanel=document.createElement('section');
  commentPanel.id='pageComments'; commentPanel.className='page-comments'; commentPanel.hidden=true;
  commentPanel.innerHTML='<div class="pc-head"><span class="pc-title">本页留言</span><span class="pc-alias"></span></div>'
    +'<div class="pc-chat" id="pcChat"></div>'
    +'<form class="pc-form" id="pcForm"><input id="pcInput" maxlength="80" autocomplete="off" placeholder="留一句话，最多 80 字…"><button type="submit" id="pcSend">发送</button></form>';
  return commentPanel;
}
function ensureCommentHost(){
  if(commentHost) return compoundHost();
  commentHost=document.createElement('div'); commentHost.id='hcbDataHost';
  commentHost.style.cssText='position:fixed;left:-10000px;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none';
  commentHost.innerHTML='<div id="HCB_comment_box"></div>';
  document.body.appendChild(commentHost);
  function compoundHost(){ return commentHost; }
  return commentHost;
}
function renderChat(){
  var chat=document.getElementById('pcChat'); if(!chat) return;
  var arr=(window.comments||[]).filter(function(c){return c && !c.is_reply;});
  if(!arr.length){ chat.innerHTML='<div class="pc-empty">还没有人说话。写第一句吧。</div>'; return; }
  var html='';
  arr.forEach(function(c){
    var who=escHTML(c.author||'匿名');
    var msg=escHTML(c.comment||'').replace(/\n/g,' ');
    var hue=aliasHue(who);
    html+='<div class="pc-msg"><i class="pc-av" style="--h:'+hue+'">'+escHTML(who.slice(-2))+'</i><div class="pc-bubble"><b>'+who+'</b><p>'+msg+'</p></div></div>';
  });
  chat.innerHTML=html;
  chat.scrollTop=chat.scrollHeight;
}
function clearCommentScript(){
  var old=document.getElementById('hcbScript'); if(old) old.parentNode.removeChild(old);
  window.comments=[];
  var host=document.getElementById('HCB_comment_box'); if(host) host.innerHTML='';
}
function loadPageComments(p){
  var chat=document.getElementById('pcChat'); if(!chat) return;
  commentKey=p.key || ('page'+p.n);
  var alias=anonAlias();
  if(commentPanel && commentPanel.querySelector('.pc-alias')) commentPanel.querySelector('.pc-alias').textContent=alias;
  if(commentCache[commentKey]){ window.comments=commentCache[commentKey]; renderChat(); return; }
  var token=++commentToken;
  chat.innerHTML='<div class="pc-empty">正在打开本页留言…</div>';
  clearCommentScript();
  ensureCommentHost();
  var pageUrl='https://dentier-max.github.io/mrdentier/?p='+encodeURIComponent(commentKey);
  window.hcb_user={PAGE:pageUrl,MAX_CHARS:80,comments_header:'',name_label:'',content_label:'',add:'',submit:'',anonymous:'匿名',no_comments_msg:''};
  var sc=document.createElement('script'); sc.id='hcbScript';
  sc.src='https://www.htmlcommentbox.com/jread?page='+encodeURIComponent(pageUrl)+'&opts=16476&num=50&ts='+Date.now();
  sc.onload=function(){
    if(token!==commentToken) return;
    setTimeout(function(){
      if(token!==commentToken) return;
      var arr=window.comments||[];
      commentCache[commentKey]=arr;
      renderChat();
      var input=document.getElementById('pcInput'); if(input && arr.length===0) input.focus({preventScroll:true});
    },80);
  };
  sc.onerror=function(){ if(token===commentToken) chat.innerHTML='<div class="pc-empty">留言暂时打不开，图片和相册不受影响。</div>'; };
  document.head.appendChild(sc);
}
function postChat(text,pageUrl){
  if(commentPosting) return;
  commentPosting=true;
  var send=document.getElementById('pcSend'); if(send) send.disabled=true;
  var iframe=document.createElement('iframe'); var name='hcbPost'+Date.now();
  iframe.name=name; iframe.style.cssText='position:fixed;left:-10000px;width:1px;height:1px;opacity:0';
  document.body.appendChild(iframe);
  var form=document.createElement('form');
  form.action='https://www.htmlcommentbox.com/post'; form.method='POST'; form.target=name;
  form.enctype='multipart/form-data'; form.style.display='none';
  var data={page:pageUrl,refer:location.href,opts:'16476',mod:'',replies_to:'',charset:'UTF-8',name:anonAlias(),content:text,ajax:'1'};
  Object.keys(data).forEach(function(k){var i=document.createElement('input');i.type='hidden';i.name=k;i.value=data[k];form.appendChild(i);});
  document.body.appendChild(form); form.submit();
  setTimeout(function(){
    try{form.remove();}catch(e){}
    try{iframe.remove();}catch(e){}
    commentPosting=false; if(send) send.disabled=false;
    delete commentCache[currentCommentKeySafe()];
    if(commentKey) delete commentCache[commentKey];
    loadPageComments(P[idx]);
  },1800);
}
function currentCommentKeySafe(){ return commentKey; }
function mountComments(){
  if(!commentPanel) makeCommentPanel();
  if($('bookScreen') && $('bookScreen').hidden){ commentPanel.hidden=true; return; }
  var right=$('pageR'),left=$('pageL'),target=null;
  if(right && right.innerHTML.trim() && right.querySelector('.page-in')) target=right;
  else if(left && left.innerHTML.trim() && left.querySelector('.page-in')) target=left;
  if(!target){ commentPanel.hidden=true; return; }
  var pageIn=target.querySelector('.page-in'), foot=pageIn.querySelector('.foot');
  if(commentPanel.parentNode!==pageIn){ if(foot) pageIn.insertBefore(commentPanel,foot); else pageIn.appendChild(commentPanel); }
  commentPanel.hidden=false;
  var p=P[idx]; if(!p) return;
  if(commentKey!==p.key) loadPageComments(p);
}
function setupComments(){
  makeCommentPanel(); document.body.appendChild(commentPanel);
  var form=document.getElementById('pcForm');
  if(form) form.addEventListener('submit',function(e){
    e.preventDefault();
    var input=document.getElementById('pcInput'); var text=(input.value||'').trim();
    if(!text) return;
    if(commentPosting) return;
    var p=P[idx]; if(!p) return;
    var pageUrl='https://dentier-max.github.io/mrdentier/?p='+encodeURIComponent(p.key);
    input.value=''; postChat(text,pageUrl);
  });
  mountComments();
}
setupAddPhotos();
setupMusic();
setupComments();
setupLetter();
resetIdle();
$('coverScreen').hidden = false;
$('book').classList.toggle('single', mode === 'single');
syncLayout();
window.addEventListener('hashchange', gotoHash);
window.addEventListener('resize', function(){
  syncLayout();
  if(openView === 'atlasView') drawAtlas();
});
})();
