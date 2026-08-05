/* ================================================================
   국가기상위성센터 프로토타입 공통 스크립트
   - 프로토바 / 해상도 토글 / 유틸바 · 헤더 · GNB 메가패널 / 퀵링크 / 푸터 주입
   - 더미 데이터만 사용, 서버 통신 없음
   - GNB 방식 : 기상청 본청(kma.go.kr) 구조 (발주처 지정, 08/04)
   ================================================================ */
(function () {

  /* ----------------------------------------------------------------
     IA 데이터 — dev/00_meta/preview_targets.csv 의 메뉴경로에서 추출
     [상위메뉴, [2Depth 그룹, ...]]
     그룹 = {name, w, items:[[3Depth명, [4Depth명, ...]], ...]}
       · w  : 그룹 폭 가중치(1|2) — 항목 수에 따른 컬럼 배분
       · items 가 빈 배열이면 그룹 헤더 자체가 링크 (기관장소개·자료제공)
     [개발 연동] 실제 링크는 selectPage.do / listBbs.do 파라미터로 연결.
                프로토타입은 화면이 있는 항목만 href, 나머지는 "#".
     ---------------------------------------------------------------- */
  var IA = [
    ["자료조회", [
      { name: "위성 영상", w: 2, items: [
        ["위성 영상", []], ["특별관측", []], ["특이위성영상", []],
        ["고해상도 위성영상", []], ["국민생활 안전 및 편의", []]
      ]},
      { name: "우주기상", w: 1, items: [
        ["우주기상 소개", []], ["우주기상 감시", [], "sub-static.html"],
        ["우주기상 예·특보", []], ["우주방사선 정보", []]
      ]},
      { name: "북극해빙", w: 1, items: [
        ["북극해빙 소개", []], ["북극해빙 면적", []], ["해빙표면 거칠기", []]
      ]},
      { name: "온실가스", w: 1, items: [["온실가스 소개", []], ["온실가스 감시", []]]},
      { name: "폭염 및 가뭄감시", w: 1, items: [
        ["폭염 및 가뭄감시 소개", []], ["폭염 및 가뭄감시 요소", []],
        ["영상 분석", []], ["시계열 분석", []]
      ]}
    ]],
    ["자료제공", [
      { name: "자료제공", w: 1, items: [] }   // 2Depth 없음 → 헤더 링크형
    ]],
    ["알림·소식", [
      { name: "알림", w: 2, items: [
        ["공지사항", [], "sub-bbs.html"], ["보도자료", []], ["채용공고", []]
      ]},
      { name: "소식", w: 2, items: [
        ["위성트위터", []], ["카드 뉴스", ["행사 사진", "행사 영상"]], ["센터 행사", []]
      ]}
    ]],
    ["정보공개", [
      { name: "청렴자료공개", w: 2, items: [
        ["업무추진비", []], ["수의계약정보", []], ["상품권 구매 현황", []]
      ]}
    ]],
    ["기관소개", [
      { name: "센터소개", w: 2, items: [
        ["연혁", []], ["미션/임무", []], ["소개영상", []],
        ["견학안내", []], ["오시는길", []]
      ]},
      { name: "기관장소개(인사말)", w: 1, items: [] },   // 헤더 링크형
      { name: "주요업무소개", w: 1, items: [["센터 사무분장", []]]}
    ]]
  ];

  /* 퀵링크 (요구④) — 08/04 회신 : 내부 서비스 바로가기 전용 · 전 페이지 공통
     강조 3 / 일반 3. 소통채널은 SNS 성격이라 우주기상으로 대체(03 문서 §2-④) */
  var QUICK = {
    lead: [
      ["고해상도 영상뷰어", "layers"],
      ["위성자료 다운로드", "download"],
      ["특이영상", "sparkles"]
    ],
    normal: [
      ["오시는 길", "map-pin"],
      ["견학안내", "users", "sub-bbs.html"],
      ["우주기상", "sun", "sub-static.html"]
    ]
  };

  /* 프로토타입 화면 목록 — 프로토바 네비 + 링크 유효성 판정에 사용 */
  var SCREENS = [
    ["index.html", "인덱스"],
    ["main-a.html", "메인 1안"],
    ["main-b.html", "메인 2안"],
    ["sub-static.html", "서브(정적)"],
    ["sub-bbs.html", "게시판"]
  ];
  var SCREEN_SET = SCREENS.reduce(function (m, s) { m[s[0]] = true; return m; }, {});

  /* 링크 유효성 표시 : 화면이 있으면 .is-live, 없으면 .is-dead
     [개발 연동] 실서비스 전환 시 이 클래스와 proto-linkmark.css 는 제거 대상 */
  function markLinks(scope) {
    (scope || document).querySelectorAll("a[href]").forEach(function (a) {
      if (a.closest(".proto-bar")) return;                 // 프로토바는 대상 외
      if (a.classList.contains("is-live") || a.classList.contains("is-dead")) return;
      var href = a.getAttribute("href") || "";
      if (SCREEN_SET[href.split("#")[0]]) a.classList.add("is-live");
      else if (href === "#" || href === "") {
        a.classList.add("is-dead");
        a.addEventListener("click", function (e) { e.preventDefault(); });
      }
    });
  }
  window.protoMarkLinks = markLinks;

  var FOOTER_LINKS = ["개인정보처리방침", "저작권정책", "이메일무단수집거부", "웹 접근성 정책", "사이트맵"];

  /* ----------------------------------------------------------------
     아이콘 — 외부 CDN 없이 내장 (file:// 로 직접 열어도 표시되도록)
     24×24 stroke 기준. [개발 연동] 실서비스는 기존 아이콘 자산으로 교체.
     ---------------------------------------------------------------- */
  var ICONS = {
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15.5 19.8 18l2.5.8-2.5.8L19 22l-.8-2.4-2.5-.8 2.5-.8Z"/>',
    "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2"/><path d="M16 3.5a4 4 0 0 1 0 7"/><path d="M22 21v-2a4 4 0 0 0-3-3.85"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    snowflake: '<path d="M12 2v20M4.2 6.5l15.6 9M19.8 6.5l-15.6 9"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
    satellite: '<path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/>',
    wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
    thermometer: '<path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    flame: '<path d="M12 2c1 3 3 4.5 4.5 6.5S19 12.5 19 15a7 7 0 0 1-14 0c0-2 1-3.8 2.2-5-.2 1.6.6 2.8 1.8 3.2-.6-2.6.4-5.6 3-8.2Z"/>',
    video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "message-circle": '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 20.5l1.5-4.4A8.4 8.4 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    link: '<path d="M9 17H7a5 5 0 0 1 0-10h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><path d="M8 12h8"/>'
  };

  /* [data-icon] 속성을 가진 요소를 인라인 SVG로 치환 */
  function paintIcons(scope) {
    (scope || document).querySelectorAll("[data-icon]").forEach(function (node) {
      var name = node.getAttribute("data-icon");
      var body = ICONS[name];
      if (!body) { node.remove(); return; }   // 정의 없는 아이콘은 빈 자리 남기지 않음
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      /* 원본 노드에 icon 외 커스텀 클래스(예: quicklink__toggle-caret)가 있으면 함께 보존 */
      svg.setAttribute("class", ("icon " + node.className).trim());
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = body;
      node.replaceWith(svg);
    });
  }
  window.protoPaintIcons = paintIcons;

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* 화면명 : <title>의 "NMSC 프로토타입 — " 접두어 제거 */
  function pageLabel() {
    var t = document.title.split("—").pop().trim();
    return t || "프로토타입 화면";
  }

  /* ---------------- 프로토바 + 해상도 토글 ---------------- */
  function renderProtoBar() {
    var note = document.body.getAttribute("data-proto-note") || "";
    var cur = location.pathname.split("/").pop() || "index.html";

    /* 화면 이동 네비 — 모든 화면에서 서로 오갈 수 있도록 전체 목록을 노출 */
    var nav = '<span class="proto-bar__nav">' +
      SCREENS.map(function (s) {
        return '<a href="' + s[0] + '"' + (s[0] === cur ? ' aria-current="page"' : '') + '>' +
               esc(s[1]) + '</a>';
      }).join("") + '</span>';

    var vp = '<span class="vp-switch">' +
        '<span class="vp-switch__label">해상도</span>' +
        '<button type="button" data-vp="full" aria-pressed="true">1920</button>' +
        '<button type="button" data-vp="1024" aria-pressed="false">1024</button>' +
        '<button type="button" data-vp="768" aria-pressed="false">768</button>' +
        '<button type="button" data-vp="375" aria-pressed="false">375</button>' +
      '</span>';

    var bar = document.querySelector(".proto-bar");
    if (bar) {
      /* 인덱스는 정적 마크업 — 네비만 주입 */
      bar.querySelector(".proto-bar__left").insertAdjacentHTML("beforeend", nav);
    } else {
      bar = el('<div class="proto-bar"></div>');
      bar.innerHTML =
        '<div class="proto-bar__left">' +
          '<span class="proto-bar__title">프로토타입</span>' + nav +
        '</div>' +
        '<div class="proto-bar__right">' +
          '<span class="proto-bar__page">' + esc(pageLabel()) + '</span>' +
          (note ? '<span class="proto-bar__note">' + esc(note) + '</span>' : '') +
          vp +
        '</div>';
      document.body.insertBefore(bar, document.body.firstChild);
    }

    bar.querySelectorAll("[data-vp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-vp");
        bar.querySelectorAll("[data-vp]").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        if (v === "full") document.body.removeAttribute("data-vp");
        else document.body.setAttribute("data-vp", v);
      });
    });
  }

  /* ---------------- 유틸바 + 헤더 + GNB ---------------- */
  function groupHtml(g) {
    var head = g.items.length
      ? '<h3 class="megagroup__head">' + esc(g.name) + '</h3>'
      : '<a class="megagroup__head megagroup__head--link" href="#">' + esc(g.name) + '</a>';

    var items = g.items.map(function (it) {
      var sub = it[1] && it[1].length
        ? '<ul class="megasub">' + it[1].map(function (s) {
            return '<li><a href="#">' + esc(s) + '</a></li>';
          }).join("") + '</ul>'
        : "";
      return '<li><a class="megaitem" href="' + (it[2] || "#") + '">' + esc(it[0]) + '</a></li>' + sub;
    }).join("");

    return '<div class="megagroup megagroup--w' + (g.w || 1) + '">' + head +
           (items ? '<ul class="megagroup__list">' + items + '</ul>' : '') + '</div>';
  }

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var current = document.body.getAttribute("data-gnb") || "";

    var gnbBtns = IA.map(function (m, i) {
      var isCur = m[0] === current;
      return '<button type="button" class="gnb__item" data-gnb-btn="' + i + '" ' +
             'aria-expanded="false" aria-controls="megapanel-' + i + '"' +
             (isCur ? ' aria-current="page"' : '') + '>' + esc(m[0]) + '</button>';
    }).join("");

    var panels = IA.map(function (m, i) {
      return '<div class="megapanel" id="megapanel-' + i + '" data-gnb-panel="' + i + '">' +
               '<div class="megapanel__inner container">' +
                 '<div class="megapanel__label">' + esc(m[0]) + '</div>' +
                 '<div class="megapanel__groups">' + m[1].map(groupHtml).join("") + '</div>' +
               '</div>' +
             '</div>';
    }).join("");

    host.outerHTML =
      '<div class="utilbar">' +
        '<div class="utilbar__inner container">' +
          '<span class="utilbar__slogan">"하늘을 친구처럼, 국민을 하늘처럼"</span>' +
          '<span class="utilbar__gov">국민이 주인인 나라, 함께 행복한 대한민국</span>' +
          '<div class="utilbar__right">' +
            '<div class="utilbar__search">' +
              '<input aria-label="통합검색" placeholder="검색어를 입력하세요.">' +
              '<button type="button" aria-label="검색"><span data-icon="search"></span></button>' +
            '</div>' +
            '<a href="#">사이트맵</a><a href="#">Language ▾</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<header class="header" data-gnb-root>' +
        '<div class="header__inner container">' +
          '<a class="logo" href="main-a.html">' +
            '<span class="logo__mark">NMSC</span>' +
            '<span class="logo__text"><strong>국가기상위성센터</strong>' +
            '<span>National Meteorological Satellite Center</span></span>' +
          '</a>' +
          '<nav class="gnb" aria-label="주메뉴">' + gnbBtns + '</nav>' +
          '<div class="header__sub">' +
            '<span class="header__sublogo">날씨누리</span>' +
            '<button type="button" class="header__all" aria-label="전체메뉴">' +
              '<span></span><span></span><span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        panels +
      '</header>';

    bindGnb();
  }

  /* GNB 인터랙션 : hover / focus 로 열고, 헤더 이탈 또는 ESC 로 닫음 */
  function bindGnb() {
    var root = document.querySelector("[data-gnb-root]");
    if (!root) return;
    var btns = root.querySelectorAll("[data-gnb-btn]");
    var panels = root.querySelectorAll("[data-gnb-panel]");

    function close() {
      btns.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      panels.forEach(function (p) { p.classList.remove("is-open"); });
    }
    function open(i) {
      close();
      btns[i].setAttribute("aria-expanded", "true");
      panels[i].classList.add("is-open");
    }

    btns.forEach(function (b, i) {
      b.addEventListener("mouseenter", function () { open(i); });
      b.addEventListener("focus", function () { open(i); });
      b.addEventListener("click", function () {
        b.getAttribute("aria-expanded") === "true" ? close() : open(i);
      });
    });
    root.addEventListener("mouseleave", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------------- 우측 퀵링크 (요구④) ----------------
     08/04 회신 : 내부 서비스 바로가기 전용. SNS·챗봇 미포함.
     [개발 연동] Tiles 공통 레이아웃 1곳에 삽입 → 전 페이지 전파.
                 dynamic 4p(영상뷰어·특별관측·램버트맵·온실가스감시)는 노출 예외.
     열기/닫기 : PC 기본 열림 · 태블릿(1024)·모바일 기본 닫힘 — 체크리스트 #11·#12
                 (하단 고정바가 페이징·본문과 겹치는 문제를 토글로 최소화) */
  function renderQuick() {
    var host = document.getElementById("site-quicklink");
    if (!host) return;

    function group(list, lead) {
      return '<div class="quicklink__group">' +
        list.map(function (q) {
          return '<a class="quicklink__item' + (lead ? ' quicklink__item--lead' : '') +
                 '" href="' + (q[2] || "#") + '">' +
                 '<span data-icon="' + q[1] + '"></span>' +
                 '<span class="quicklink__text">' + esc(q[0]) + '</span></a>';
        }).join("") + '</div>';
    }

    /* 패널을 토글 버튼보다 먼저 배치 — 하단 고정 버튼 위로 목록이 펼쳐지도록 */
    host.outerHTML =
      '<nav class="quicklink" aria-label="바로가기" id="site-quicklink">' +
        '<div class="quicklink__panel" id="quicklink-panel">' +
          '<div class="quicklink__list">' +
            group(QUICK.lead, true) + group(QUICK.normal, false) +
          '</div>' +
        '</div>' +
        '<button type="button" class="quicklink__toggle" aria-expanded="true" aria-controls="quicklink-panel">' +
          '<span data-icon="layers"></span>' +
          '<span class="quicklink__toggle-text">바로가기</span>' +
          '<span class="quicklink__toggle-caret" data-icon="chevron-down"></span>' +
        '</button>' +
      '</nav>';

    bindQuickToggle();
  }

  /* PC(>1024) 기본 열림 · 태블릿·모바일(≤1024) 기본 닫힘. 사용자가 직접 토글하면
     그 이후에는 창 크기 변화(실제 브라우저 리사이즈)로 기본값을 되돌리지 않는다. */
  function bindQuickToggle() {
    var nav = document.querySelector(".quicklink");
    if (!nav) return;
    var btn = nav.querySelector(".quicklink__toggle");
    var mq = window.matchMedia("(max-width:1024px)");
    var userToggled = false;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      nav.classList.toggle("is-closed", !open);
      btn.setAttribute("aria-expanded", String(open));
    }
    setOpen(!mq.matches);

    btn.addEventListener("click", function () {
      userToggled = true;
      setOpen(!nav.classList.contains("is-open"));
    });
    mq.addEventListener("change", function (e) {
      if (!userToggled) setOpen(!e.matches);
    });
  }

  /* ---------------- 푸터 ---------------- */
  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    host.outerHTML =
      '<div class="family"><div class="family__inner container">' +
        ["관련기관", "기상청 소속기관", "위성 관련 사이트", "유관기관"].map(function (n) {
          return '<select aria-label="' + n + '"><option>' + n + '</option></select>';
        }).join("") +
      '</div></div>' +
      '<footer class="footer"><div class="container">' +
        '<div class="footer__links">' +
          FOOTER_LINKS.map(function (n) { return '<a href="#">' + n + '</a>'; }).join("") +
        '</div>' +
        '<div class="footer__body">' +
          '<p>(63614) 제주특별자치도 서귀포시 남원읍 위성로 64-18<br>' +
          '대표전화 064-801-0000 · 팩스 064-805-0000</p>' +
          '<p>© National Meteorological Satellite Center. All rights reserved.</p>' +
        '</div>' +
      '</div></footer>';
  }

  function init() {
    renderProtoBar();
    renderHeader();
    renderQuick();
    renderFooter();
    paintIcons();          // 주입이 모두 끝난 뒤 한 번에 아이콘 치환
    markLinks();           // 링크 유효성 표시 (proto-linkmark.css)
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
