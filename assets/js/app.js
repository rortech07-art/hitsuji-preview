/* ぬくもりサロン ひつじのうたた寝 — プロトタイプ用スクリプト
   本番（WordPress）では、空き状況のデータは管理画面のカスタムフィールドから出力する。
   ここではその出力を JSON で模している。 */
(function () {
  'use strict';

  /* ---- ヘッダー：ヒーローを抜けたら生成り地に切り替える ---- */
  var hd = document.querySelector('.hd');
  var onScroll = function () {
    if (!hd) return;
    hd.classList.toggle('stuck', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- スマホメニュー ---- */
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.hasAttribute('hidden');
      if (open) { drawer.removeAttribute('hidden'); } else { drawer.setAttribute('hidden', ''); }
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' || e.target.dataset.close !== undefined) {
        drawer.setAttribute('hidden', '');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- FAQ アコーディオン ---- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---- あらわれ ----
     演出であって、表示の条件にはしない。
     監視が発火しない環境でも 3 秒後に必ず出す。 */
  var rise = document.querySelectorAll('.rise');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rise.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rise.forEach(function (el) { el.classList.add('in'); }); }, 3000);
  } else {
    rise.forEach(function (el) { el.classList.add('in'); });
  }

  /* ==========================================================
     空き状況カレンダー
     status: 'o' 空きあり / 't' 残りわずか / 'x' 満席 / 'off' 定休
     ========================================================== */
  var CAL = window.HITSUJI_CAL || {};
  var LINE_URL = 'https://lin.ee/ex2fCM4';
  var DOW = ['日', '月', '火', '水', '木', '金', '土'];
  var MARK = {
    o:   { s: '○', cls: 'mk-o', label: '空きあり' },
    t:   { s: '△', cls: 'mk-t', label: '残りわずか' },
    x:   { s: '×', cls: 'mk-x', label: '満席' },
    off: { s: '定休',   cls: '',     label: '定休日' }
  };

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function statusOf(d) {
    var v = CAL[ymd(d)];
    if (v) return v;
    return d.getDay() === 0 ? 'off' : 'o'; /* 既定：日曜定休 */
  }

  var grid = document.getElementById('calGrid');
  var picked = null;

  if (grid) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = new Date(today); start.setDate(start.getDate() - start.getDay()); /* 日曜はじまり */
    var html = '';
    DOW.forEach(function (n, i) {
      html += '<div class="dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '') + '">' + n + '</div>';
    });
    for (var i = 0; i < 14; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var past = d < today;
      var st = past ? 'x' : statusOf(d);
      var m = MARK[st];
      var dis = (st === 'x' || st === 'off' || past);
      html += '<button type="button" class="day' + (dis ? (st === 'off' ? ' is-off' : ' is-x') : '') + '"' +
        (dis ? ' disabled' : '') +
        ' data-date="' + ymd(d) + '" data-dow="' + DOW[d.getDay()] + '"' +
        ' aria-label="' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + m.label + '">' +
        '<span class="d">' + d.getDate() + '</span>' +
        '<span class="s ' + m.cls + (st === 'off' ? ' txt' : '') + '">' + m.s + '</span>' +
        '</button>';
    }
    grid.innerHTML = html;

    var pickBox = document.getElementById('calPick');
    var pickTx = document.getElementById('calPickTx');
    var pickBtn = document.getElementById('calPickBtn');

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.day'); if (!b || b.disabled) return;
      grid.querySelectorAll('.day').forEach(function (x) { x.classList.remove('is-sel'); });
      b.classList.add('is-sel');
      var p = b.dataset.date.split('-');
      picked = Number(p[1]) + '月' + Number(p[2]) + '日(' + b.dataset.dow + ')';
      if (pickTx) pickTx.innerHTML = '<b>' + picked + '</b> を選びました';
      if (pickBtn) pickBtn.hidden = false;
      if (pickBox) pickBox.style.borderStyle = 'solid';
    });

    if (pickBtn) {
      pickBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var msg = picked ? picked + 'に予約を希望します。（メニュー：　　／ご希望の時間帯：　　）' : 'ご予約を希望します。';
        var go = function () { window.open(LINE_URL, '_blank', 'noopener'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msg).then(function () {
            pickBtn.textContent = 'メッセージをコピーしました → LINEへ';
            setTimeout(go, 500);
          }, go);
        } else { go(); }
      });
    }
  }

  /* ---- スマホ固定バーに本日の空き状況を出す ---- */
  var barLab = document.querySelector('#barToday .b-lab');
  if (barLab) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var sb = statusOf(t), mk = MARK[sb];
    barLab.innerHTML = (sb === 'off') ? '本日 定休' : '本日 <b class="' + mk.cls + '">' + mk.s + '</b>';
  }

  /* ---- ヒーローの「本日／明日」表示 ---- */
  var heroOpen = document.getElementById('heroOpen');
  if (heroOpen) {
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var t1 = new Date(t0); t1.setDate(t0.getDate() + 1);
    [['本日', t0], ['明日', t1]].forEach(function (pair) {
      var m = MARK[statusOf(pair[1])];
      var body = (statusOf(pair[1]) === 'off')
        ? m.label
        : '<span class="mk ' + m.cls + '">' + m.s + '</span>' + m.label;
      heroOpen.insertAdjacentHTML('beforeend', '<dt>' + pair[0] + '</dt><dd>' + body + '</dd>');
    });
  }
})();
