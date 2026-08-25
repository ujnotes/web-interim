var notification_intrvl;
var init_loading_intrvl;
var fade_loading_intrvl;

const TEXT_NOTIFICATION_TOP_ERROR = "Error!";

function beginLoading() {
	document.getElementById("wait_loader").classList.remove('hide');
}

function stopLoading() {
	document.getElementById("wait_loader").classList.add('hide');
}

function initLoading() {
	clearTimeout(init_loading_intrvl);
	init_loading_intrvl = setTimeout(function() {
		beginLoading();
	}, 3000);	
}

function endLoading() {
	clearTimeout(init_loading_intrvl);
	clearTimeout(fade_loading_intrvl);
	stopLoading();
}

function fadeLoading() {
	clearTimeout(fade_loading_intrvl);
	fade_loading_intrvl = setTimeout(function() {
		stopLoading();
	}, 3000);
}

function errorLoading() {
	document.getElementById("notification").innerText(TEXT_NOTIFICATION_TOP_ERROR);
	document.getElementById("notification").classList.remove('hide');
	clearTimeout(notification_intrvl); // ensure single timer
	notification_intrvl = setInterval(function() {
		document.getElementById("notification").innerText('');
		document.getElementById("notification").classList.add('hide');
	}, 3000);
}

function fbReload() {
	try{
		FB.XFBML.parse();
	}catch(ex) {};
}
function getElementsByClassName(node, classname){
	if (node.getElementsByClassName) { // use native implementation if available
		return node.getElementsByClassName(classname);
	} else {
		return (function getElementsByClass(searchClass,node) {
				if ( node == null )
					node = document;
				var classElements = [],
						els = node.getElementsByTagName("*"),
						elsLen = els.length,
						pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)"), i, j;

				for (i = 0, j = 0; i < elsLen; i++) {
					if ( pattern.test(els[i].className) ) {
							classElements[j] = els[i];
							j++;
					}
				}
				return classElements;
		})(classname, node);
	}
}

function supportsSvg() {
	var div = document.createElement('div');
	div.innerHTML = '<svg/>';
	return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
};
// external PROJECT_TITLE
var curTab;
var gTarget;
var URLid;

var menuActive = false;
var isTranslateButtonActive;
var isSearchButtonActive;

var activateMenuFn = function() {
	document.getElementById('main-wrapper').classList.add('pml-open');
	document.getElementById('menu-button').classList.add('active');
	activeNav = 'pml-open';
	var height = document.getElementById('nav-menu').scrollHeight;
	var frameHeight = document.getElementById('canvas-wrapper-inner-container').clientHeight;
	if(height < frameHeight)
		height = frameHeight;
	document.getElementById('canvas-main').style.maxHeight = height+'px';
	document.getElementById('nav-menu').style.maxHeight = null;
	menuActive = true;
	if(!(typeof (ga) === 'undefined')) {
		ga('set', 'page', '/'+'menu');
		ga('send', 'pageview');
	}
}

var activateMenu = function() {
    // Update URL to /menu when user opens the menu
    recordState('menu', '');
    activateMenuFn();
}

var activateMainFn = function() {
	document.getElementById('main-wrapper').classList.remove('pml-open');
	document.getElementById('main-wrapper').classList.remove('hide_path_title_updated');
	document.getElementById('menu-button').classList.remove('active');
	menuActive = false;
}

var activateMain = function() {
	replaceState(curTab, document.getElementById('title').innerText);
	activateMainFn();	
}
var curRequestId = 0;

function loadCanvasI(m) {
	if(this.classList.contains('article-title-nav-disabled')) {
		signalDisabledArticleNavigation(this);
		return false;
	}
	loadCanvasH(this);
	return false;
}

function signalDisabledArticleNavigation(link) {
	link.classList.remove('article-title-nav-denied');
	void link.offsetWidth;
	link.classList.add('article-title-nav-denied');
	setTimeout(function() {
		link.classList.remove('article-title-nav-denied');
	}, 380);
}

function scrollToArticleNavigation() {
	var navigation = document.getElementById('nav-list');
	if(!navigation)
		return false;

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	navigation.scrollIntoView({
		behavior: reduceMotion ? 'auto' : 'smooth',
		block: 'center'
	});

	navigation.classList.remove('nav-list-highlight');
	void navigation.offsetWidth;
	navigation.classList.add('nav-list-highlight');
	if(scrollToArticleNavigation.highlightTimeout)
		clearTimeout(scrollToArticleNavigation.highlightTimeout);
	scrollToArticleNavigation.highlightTimeout = setTimeout(function() {
		navigation.classList.remove('nav-list-highlight');
	}, 2200);
	return false;
}

function loadCanvasH(e) {
	var target = e.getAttribute('data-target');
	if(target == 'root')
		URLid = '';
	else
		URLid = target;
	recordState(target, e.getAttribute('data-title'));
	loadCanvas(target, e.getAttribute('data-title'));
	if(!(typeof (ga) === 'undefined')) {
		ga('set', 'page', '/'+URLid);
		ga('send', 'pageview');
	}
}

function loadCanvas(target, title) {
	if(typeof target !== 'string' || !target.length)
		return;

	curTab = target;
	var canvas_main = document.getElementById('canvas-main');
	var main_wrapper = document.getElementById('main-wrapper');
	var pathContainer = document.getElementById('path-container');
	var titleContainer = document.getElementById('title-container');
	var pathEl = document.getElementById('path');
	var titleEl = document.getElementById('title');

	if(main_wrapper)
		main_wrapper.classList.add('hide_path_title_updated');
	if(canvas_main)
		canvas_main.classList.add('hide');

	var startTime = new Date().getTime();
	syncScrollReload.startTime = null;
	scrollTop();
	initLoading();
	if(target == 'root') {
		if(pathContainer) pathContainer.classList.add('hide_scale');
		if(titleContainer) titleContainer.classList.add('hide_scale');
	}
	else {
		if(pathContainer) pathContainer.classList.remove('hide_scale');
		if(titleContainer) titleContainer.classList.remove('hide_scale');
	}
	if(pathEl) pathEl.classList.add('hide');
	if(titleEl) titleEl.classList.add('hide');

	var xmlhttp = new XMLHttpRequest();
	if(window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	else { // IE6, IE5
		xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	}
	xmlhttp.requestId = ++curRequestId;
	xmlhttp.onreadystatechange = function() {

		if (xmlhttp.readyState == 4 && xmlhttp.requestId == curRequestId) {
			if(target === gTarget) {
				var canvas_main = document.getElementById('canvas-main');
				var content = document.getElementById('content');
				switch (xmlhttp.status) {
				case 200: {
					endLoading();

					var resp = JSON.parse(xmlhttp.responseText);
					document.title = resp.desc + ' - ' + PROJECT_TITLE;
					// Use server label so a wrong link data-title cannot stick as the H1.
					var pageTitle = (typeof resp.label !== 'undefined') ? resp.label : title;
					if(target == 'root')
						updatePathTitle('', '&nbsp;', resp.prevArticle, resp.nextArticle);
					else {
						updatePathTitle(resp.path, pageTitle, resp.prevArticle, resp.nextArticle);
						if(pageTitle !== title)
							replaceState(target, pageTitle);
					}
					syncScrollReload(startTime, resp, target);
				} break;
				case 404: {
					endLoading();
					if(content)
						content.innerHTML = "Error: 404 - Resource not found!";
					else if(canvas_main)
						canvas_main.innerHTML = "Error: 404 - Resource not found!";
					if(canvas_main)
						canvas_main.classList.remove('hide');
				} break;
				case 408:
				case 501:
				case 502: {
					if(content)
						content.innerHTML = 'Error!';
					else if(canvas_main)
						canvas_main.innerHTML = 'Error!';
					if(canvas_main)
						canvas_main.classList.remove('hide');
					errorLoading();
				}
				}
			}
		}

	}

	gTarget = target;
	xmlhttp.open('GET', getLanguagePrefix()+'/'+target+'.json', true);
	xmlhttp.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
	xmlhttp.send();

}

function scrollTop() {
	scrollActive = true;
	var y = document.documentElement.scrollTop;
	if(typeof y === 'undefined')
		y = 0;
	var dy = 100;
	var scrollInterval = setInterval(function() {
		window.scrollTo(0, y);
		if(y <= 0) {
			clearInterval(scrollInterval);
			scrollActive = false;
			syncScrollReload();
		}
		else
			y = y-dy;
	}, 10);
}

var scrollActive;
function syncScrollReload(startTime, resp, target) {
	if(typeof startTime != 'undefined') {
		syncScrollReload.startTime = startTime;
		syncScrollReload.resp = resp;
		syncScrollReload.target = target;
		activateMainFn();
	}
	if(typeof syncScrollReload.startTime != 'undefined' && syncScrollReload.startTime != null && !scrollActive)
		executeReload(syncScrollReload.startTime, syncScrollReload.resp, syncScrollReload.target);
}

function executeReload(startTime, resp, target) {
	if(typeof reloadTimeout != 'undefined')
		clearTimeout(reloadTimeout);
	reloadTimeout = setTimeout( function() {
		var content = document.getElementById('content');
		var canvas_main = document.getElementById('canvas-main');
		var languageSwitcherEl = document.getElementById('language-switcher');
		var main_wrapper = document.getElementById('main-wrapper');
		var nav_menu = document.getElementById('nav-menu');

		if(content)
			content.innerHTML = resp.content;
		if(typeof resp.languageSwitcher !== 'undefined' && languageSwitcherEl) {
			var languageSwitcherResponse = document.createElement('div');
			languageSwitcherResponse.innerHTML = resp.languageSwitcher;
			var languageSwitcher = languageSwitcherResponse.querySelector('#language-switcher');
			languageSwitcherEl.innerHTML = languageSwitcher ? languageSwitcher.innerHTML : '';
		}
		if(canvas_main)
			canvas_main.classList.remove('hide');
		if(!URLid == '' && main_wrapper) {
			main_wrapper.classList.remove('hide_path_title_updated');
		}
		if(canvas_main && nav_menu)
			nav_menu.style.maxHeight = canvas_main.scrollHeight+'px';
		if(canvas_main)
			canvas_main.style.maxHeight = null;
		setXURL(document);
		if(resp.async == '1')
			initPageFunction(target);
		fbReload();
	}, getTimeOutDuration(new Date().getTime() - startTime) );
}

function getTimeOutDuration(elapsed) {
	timeout = 380 - elapsed;
	if(timeout < 0)
		return 0;
	else
		return timeout;
}

function getArticleNavigationLabel(kind) {
	var container = document.getElementById('title-container');
	if(!container)
		return '';
	return container.getAttribute('data-' + kind) || '';
}

function updateArticleNavigationLink(linkId, article, label, noneLabel) {
	var link = document.getElementById(linkId);
	if(!link)
		return;
	if(article == null) {
		link.classList.add('article-title-nav-disabled');
		link.removeAttribute('href');
		link.removeAttribute('data-target');
		link.removeAttribute('data-title');
		link.removeAttribute('title');
		link.setAttribute('aria-label', noneLabel);
		link.setAttribute('aria-disabled', 'true');
		link.setAttribute('tabindex', '-1');
		return;
	}

	link.classList.remove('article-title-nav-disabled');
	link.setAttribute('href', article.url);
	link.setAttribute('data-target', article.id);
	link.setAttribute('data-title', article.label);
	link.setAttribute('title', label);
	link.setAttribute('aria-label', label);
	link.removeAttribute('aria-disabled');
	link.setAttribute('tabindex', '0');
}

function updatePathTitle(path, title, prevArticle, nextArticle) {
	setTimeout(function() {
		var pathEl = document.getElementById('path');
		var titleEl = document.getElementById('title');
		if(pathEl)
			pathEl.innerHTML = path;
		if(titleEl)
			titleEl.innerHTML = title;
		updateArticleNavigationLink('article-prev', prevArticle, getArticleNavigationLabel('nav-prev'), getArticleNavigationLabel('nav-prev-none'));
		updateArticleNavigationLink('article-next', nextArticle, getArticleNavigationLabel('nav-next'), getArticleNavigationLabel('nav-next-none'));
		if(pathEl)
			pathEl.classList.remove('hide');
		if(titleEl)
			titleEl.classList.remove('hide');
	}, 300);
}
var isDarkMode = false;
var currentTheme = 'system';
var themeMediaQuery = null;

function normalizeTheme(theme) {
	if (theme === 'true') return 'dark';
	if (theme === 'false') return 'light';
	return theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
}

function getSystemTheme() {
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeControls(theme, resolvedTheme) {
	var button = document.querySelector('#darkmode-button');
	var options = document.querySelectorAll('.theme-option');
	var preferenceLabel = theme.charAt(0).toUpperCase() + theme.slice(1);
	var resolvedLabel = resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1);
	var label = theme === 'system' ? preferenceLabel + ' (' + resolvedLabel + ')' : resolvedLabel;
	var i;

	document.documentElement.setAttribute('data-theme-preference', theme);
	document.documentElement.setAttribute('data-theme-resolved', resolvedTheme);
	if (button) {
		button.setAttribute('aria-label', 'Theme: ' + label);
		button.setAttribute('title', 'Theme: ' + label);
	}

	for (i = 0; i < options.length; i++) {
		var selected = options[i].getAttribute('data-theme') === theme;
		options[i].classList.toggle('theme-option-active', selected);
		options[i].setAttribute('aria-checked', selected ? 'true' : 'false');
	}
}

function applyTheme(theme, animate, persist) {
	theme = normalizeTheme(theme);
	var resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
	var metaThemeColor = document.querySelector("meta[name='theme-color']");

	if (animate)
		document.documentElement.style.transition = 'background-color 0.3s, color 0.3s';

	if (resolvedTheme === 'dark')
		document.documentElement.classList.add('dark-mode');
	else
		document.documentElement.classList.remove('dark-mode');

	document.documentElement.style.colorScheme = resolvedTheme;
	if (metaThemeColor)
		metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1a1a2e' : '#ffffff');

	currentTheme = theme;
	isDarkMode = resolvedTheme === 'dark';
	updateThemeControls(theme, resolvedTheme);

	if (persist !== false) {
		try {
			localStorage.setItem('cutie-dark-mode', theme);
		} catch (e) {}
	}
}

function setThemeMenuOpen(open) {
	var button = document.querySelector('#darkmode-button');
	var menu = document.querySelector('#theme-menu');
	if (!button || !menu) return;

	menu.hidden = !open;
	button.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function initDarkMode() {
	var saved = null;
	var selector = document.querySelector('#theme-selector');
	var button = document.querySelector('#darkmode-button');
	var menu = document.querySelector('#theme-menu');
	var options = document.querySelectorAll('.theme-option');
	var i;

	try {
		saved = localStorage.getItem('cutie-dark-mode');
	} catch (e) {}
	applyTheme(normalizeTheme(saved), false, true);

	if (window.matchMedia) {
		themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		var handleSystemThemeChange = function() {
			if (currentTheme === 'system') applyTheme('system', true, false);
		};
		if (themeMediaQuery.addEventListener)
			themeMediaQuery.addEventListener('change', handleSystemThemeChange);
		else if (themeMediaQuery.addListener)
			themeMediaQuery.addListener(handleSystemThemeChange);
	}

	if (button && menu) {
		button.addEventListener('click', function() {
			setThemeMenuOpen(menu.hidden);
		});
		button.addEventListener('keydown', function(event) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setThemeMenuOpen(true);
				if (options.length) options[0].focus();
			}
		});
		menu.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') {
				setThemeMenuOpen(false);
				button.focus();
			}
		});
	}

	for (i = 0; i < options.length; i++) {
		options[i].addEventListener('click', function() {
			applyTheme(this.getAttribute('data-theme'), true, true);
			setThemeMenuOpen(false);
			if (button) button.focus();
		});
	}

	document.addEventListener('click', function(event) {
		if (selector && !selector.contains(event.target)) setThemeMenuOpen(false);
	});
}

function enableDarkMode(animate) {
	applyTheme('dark', animate, true);
}

function disableDarkMode() {
	applyTheme('light', true, true);
}
window.onpopstate = function(e) {
	var state = resolveHistoryState(e.state);
	if(state.id == 'menu')
		activateMenuFn();
	else {
		// Same-tab hash restore (e.g. /#portfolio) is handled by root.js; avoid a redundant reload.
		if(typeof curTab !== 'undefined' && curTab === state.id)
			return;
		loadCanvas(state.id, state.title == null ? '' : state.title);
	}
}

function resolveHistoryState(state) {
	if(state && state.id)
		return state;
	var urlid = typeof getURLid === 'function' ? getURLid() : '';
	if(urlid == 'menu')
		return {'id': 'menu', 'title': ''};
	if(urlid)
		return {'id': urlid, 'title': ''};
	return {'id': 'root', 'title': ''};
}

function historyUrlForTab(tab) {
	var path;
	if(tab != 'root')
		path = '/'+tab;
	else
		path = '';
	return getLanguagePrefix()+path || '/';
}

function recordState(tab, title) {
	window.history.pushState({'id':tab, 'title':title}, '', historyUrlForTab(tab));
}

function replaceState(tab, title) {
	var url = historyUrlForTab(tab);
	// Keep in-page section hashes when staying on home (e.g. /#portfolio).
	if(tab == 'root' && window.location.hash && window.location.hash.charAt(1) !== '/') {
		var homePath = getLanguagePrefix() || '/';
		var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
		if(path === homePath || path === '/')
			url = homePath + window.location.hash;
	}
	window.history.replaceState({'id':tab, 'title':title}, '', url);
}

// Update the URL (path/hash) without wiping the SPA history state used by popstate.
function replaceHistoryUrl(url) {
	var state = resolveHistoryState(window.history.state);
	window.history.replaceState(state, '', url);
}

// Ensure the current history entry has SPA state without changing the URL.
function ensureHistoryState(tab, title) {
	var state = window.history.state;
	if(state && state.id === tab)
		return;
	window.history.replaceState(
		{'id': tab, 'title': title == null ? '' : title},
		'',
		window.location.pathname + window.location.search + window.location.hash
	);
}
function initLoad() {
	if(!initLoadDone && document.readyState !== 'loading') {
		init();
		initLoadDone = true;
	}
}

function prepareGoogleTranslate(translate_button) {
	if(document.querySelector('script[data-google-translate]'))
		return;

	var scriptTag = document.createElement('script');
	scriptTag.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
	scriptTag.async = true;
	scriptTag.setAttribute('data-google-translate', '');
	translate_button.parentNode.appendChild(scriptTag);
}

function init() {
	
		setXURL(document);
		var hashID = getHashID();
		URLid = getURLid();
	
		var canvas_main = document.querySelector('#canvas-main'),
			menu_button = document.querySelector('.toggle-push-left'),
			menu_items = document.querySelectorAll('.XURL'),
			header_button = document.querySelector('#header_button'),
			translate_button = document.querySelector('#translate-button'),
			search_button = document.querySelector('#search-button'),
			translate_box = document.querySelector('#translation-controls'),
			search_box = document.querySelector('#search_box');
	
		if(!!hashID) {
			curTab = 'root';
			// Only treat hash as a canvas deep-link when it points at an XURL control.
			// In-page section anchors (#portfolio, #contact, …) are handled by root.js.
			var hashEl = document.getElementById(hashID);
			if(hashEl && hashEl.classList && hashEl.classList.contains('XURL') && hashEl.getAttribute('data-target'))
				loadCanvasH(hashEl);
		}
		else if(!!URLid)
			curTab = URLid;
		else
			curTab = 'root';
	
		if(URLid == 'menu') {
			menuActive = true;
			menu_button.classList.add('active');
			canvas_main.style.maxHeight = document.querySelector('#nav-menu').scrollHeight+'px';
		}
		else
			document.querySelector('#nav-menu').style.maxHeight = canvas_main.scrollHeight+'px';
	
		if (!hashID && !URLid)
			replaceState('root', '');
		else if(URLid == 'menu')
			replaceState('menu', '');
		else if (URLid)
			replaceState(URLid, document.getElementById('title').textContent);
		else if (hashID)
			// hash-only URLs (/#portfolio): keep hash, but attach SPA state so Back works after /work.
			ensureHistoryState('root', '');
	
		menu_button.addEventListener( 'click', function() {
			if (!menuActive) {
				activateMenu();
			}
			else {
				activateMain();
				canvas_main.style.maxHeight = null;
				document.querySelector('#nav-menu').style.maxHeight = canvas_main.scrollHeight+'px';
			}
		} );
	
		translate_button.addEventListener( 'click', function() {
			if(typeof isTranslateButtonActive === 'undefined')
				isTranslateButtonActive = false;
			if(!isTranslateButtonActive) {
				translate_button.classList.add('header-button-active');
				translate_box.classList.remove('hide_display');
				isTranslateButtonActive = true;
			}
			else {
				translate_button.classList.remove('header-button-active');
				translate_box.classList.add('hide_display');
				isTranslateButtonActive = false;
			}
		} );
	
		search_button.addEventListener( 'click', function() {
			if(isSearchButtonActive === undefined) {
				gcse_init();
				isSearchButtonActive = false;
			}
			if(!isSearchButtonActive) {
				search_button.classList.add('header-button-active');
				search_box.classList.remove('hide_display');
				isSearchButtonActive = true;
				var search_input = search_box.querySelector('input[type="search"], input[name="q"], input.gsc-input');
				if(search_input)
					search_input.focus();
			}
			else {
				search_button.classList.remove('header-button-active');
				search_box.classList.add('hide_display');
				isSearchButtonActive = false;
			}
		});
	
		[].forEach.call(document.getElementsByClassName('coming-soon'), function(el) { el.addEventListener( 'click', function() {
			if(!(typeof (ga) === 'undefined')) {
				ga('send', 'event', {
					'eventCategory': 'download',
					'eventAction': 'click'
				});
			}
			alert("Hold your breath! Coming soon..");
		});});
	
		[].slice.call(menu_items).forEach( function(el,i) {
				el.addEventListener( 'click', function() {
					activateMainFn();
				} );
			} );
	
		if (!supportsSvg()) {
			var image_div = document.getElementsByClassName('image');
			var i;
			var l = image_div.length;
			for (i = 0; i < l; i++) {
				image_div[i].classList.add('no-svg');
			}
			// or even .className += ' no-svg'; for deeper support
		}
	
		if(typeof initDarkMode !== 'undefined')
			initDarkMode();

		prepareGoogleTranslate(translate_button);

		initPageFunction(curTab);
		return false;

}
var initPageFunction = function(path) {
	if(typeof path === 'string' && path.length) {
		var pageFunction = path.replace('/', '__');
		if (typeof window[pageFunction] === 'function')
			window[pageFunction]();
	}
}
function getURLid() {
	var loc = window.location.pathname;
	var prefix = getLanguagePrefix();
	if(prefix && loc.indexOf(prefix + '/') === 0)
		loc = loc.substring(prefix.length);
	else if(loc === prefix)
		loc = '/';
	if(loc == '/')
		return '';
	else
		return loc.substring(1);
}

function getLanguagePrefix() {
	var lang = document.documentElement.getAttribute('lang');
	return lang && lang !== 'en' ? '/' + lang : '';
}

function getHashID() {
	var hash = window.location.hash;
	if(hash.length == 0)
		return '';
	// Legacy Cutie deep-links used "#/id"; in-page section anchors use "#id".
	if(hash.charAt(1) === '/')
		return hash.substring(2);
	return hash.substring(1);
}

function setXURL(node) {
	var arClassElement = getElementsByClassName(node, 'XURL');
	var n = arClassElement.length;
	for(i = 0; i < n; i++) {
		if(arClassElement[i].getAttribute('data-target') == 'menu')
			arClassElement[i].onclick = activateMenu;
		else
			arClassElement[i].onclick = loadCanvasI;
	}
}
var initLoadDone = false;
initLoad();
function about_me() {
	if(typeof twttr !== 'undefined')
		twttr.widgets.load();
}
function homeMenuNodeTile(node) {
	if(!node)
		return null;
	return node.querySelector(':scope > .home-menu-level > .item_block_container')
		|| node.querySelector(':scope > .home-menu-tile-row > .home-menu-level > .item_block_container');
}

function syncHomeMenuConnectorStyles(menu) {
	var nodes = menu.querySelectorAll('.home-menu-node');
	var branches = [];

	function addPseudoSegment(branch, element, pseudo, vertical) {
		var style = getComputedStyle(element, pseudo);
		if(style.content == 'none')
			return;
		var rect = element.getBoundingClientRect();
		var start = vertical ? parseFloat(style.top) : parseFloat(style.left);
		var length = vertical ? parseFloat(style.height) : parseFloat(style.width);
		var fixed = vertical ? parseFloat(style.left) : parseFloat(style.top);
		if(!isFinite(start) || !isFinite(length) || !isFinite(fixed) || length <= 0)
			return;
		branch.segments.push(vertical
			? { vertical: true, fixed: rect.left + fixed, start: rect.top + start, end: rect.top + start + length }
			: { vertical: false, fixed: rect.top + fixed, start: rect.left + start, end: rect.left + start + length });
	}

	function rangesOverlap(aStart, aEnd, bStart, bEnd) {
		return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > 1;
	}

	function segmentsConflict(a, b) {
		if(a.vertical == b.vertical)
			return Math.abs(a.fixed - b.fixed) <= 1 && rangesOverlap(a.start, a.end, b.start, b.end);
		var vertical = a.vertical ? a : b;
		var horizontal = a.vertical ? b : a;
		return vertical.fixed > horizontal.start + 1 && vertical.fixed < horizontal.end - 1
			&& horizontal.fixed > vertical.start + 1 && horizontal.fixed < vertical.end - 1;
	}


	function segmentCrossesTile(segment, rect) {
		if(segment.vertical)
			return segment.fixed > rect.left + 1 && segment.fixed < rect.right - 1
				&& rangesOverlap(segment.start, segment.end, rect.top + 1, rect.bottom - 1);
		return segment.fixed > rect.top + 1 && segment.fixed < rect.bottom - 1
			&& rangesOverlap(segment.start, segment.end, rect.left + 1, rect.right - 1);
	}

	[].forEach.call(nodes, function(node) {
		node.classList.remove('home-menu-connector-alternate');
		var subtree = node.querySelector(':scope > .home-menu-subtree:not([hidden])');
		if(!subtree)
			return;
		var branch = {
			node: node,
			subtree: subtree,
			parent: node.parentElement,
			rect: subtree.getBoundingClientRect(),
			segments: [],
			forceAlternate: false
		};
		addPseudoSegment(branch, node, '::after', true);
		if(node.classList.contains('home-menu-group-connector')) {
			addPseudoSegment(branch, subtree, '::before', false);
			addPseudoSegment(branch, subtree, '::after', true);
			[].forEach.call(subtree.querySelectorAll(':scope > .home-menu-group-row-line'), function(line) {
				var rect = line.getBoundingClientRect();
				branch.segments.push({ vertical: false, fixed: rect.top, start: rect.left, end: rect.right });
			});
		}
		else {
			[].forEach.call(subtree.querySelectorAll(':scope > .home-menu-node'), function(child) {
				addPseudoSegment(branch, child, '::before', false);
			});
			var level = subtree.querySelector(':scope > .home-menu-level');
			if(level)
				addPseudoSegment(branch, level, '::before', false);
		}
		branches.push(branch);
	});

	var conflicts = branches.map(function() {
		return branches.map(function() { return false; });
	});
	function addConflict(a, b) {
		if(a < 0 || b < 0 || a == b)
			return;
		conflicts[a][b] = true;
		conflicts[b][a] = true;
	}

	for(var i = 0; i < branches.length; i++) {
		for(var j = i + 1; j < branches.length; j++) {
			if(branches[i].node.contains(branches[j].node) || branches[j].node.contains(branches[i].node))
				continue;
			for(var a = 0; a < branches[i].segments.length; a++) {
				for(var b = 0; b < branches[j].segments.length; b++) {
					if(segmentsConflict(branches[i].segments[a], branches[j].segments[b]))
						addConflict(i, j);
				}
			}
		}
	}

	function branchIndexForTile(tile) {
		var owner = tile.closest('.home-menu-node');
		while(owner) {
			for(var index = 0; index < branches.length; index++) {
				if(branches[index].node == owner)
					return index;
			}
			var parent = owner.parentElement;
			owner = parent ? parent.closest('.home-menu-node') : null;
		}
		return -1;
	}

	[].forEach.call(menu.querySelectorAll('.item_block_container'), function(tile) {
		var tileRect = tile.getBoundingClientRect();
		var ownerIndex = branchIndexForTile(tile);
		for(var branchIndex = 0; branchIndex < branches.length; branchIndex++) {
			if(branchIndex == ownerIndex)
				continue;
			if(ownerIndex >= 0 && (branches[branchIndex].node.contains(branches[ownerIndex].node) || branches[ownerIndex].node.contains(branches[branchIndex].node)))
				continue;
			for(var segmentIndex = 0; segmentIndex < branches[branchIndex].segments.length; segmentIndex++) {
				if(segmentCrossesTile(branches[branchIndex].segments[segmentIndex], tileRect)) {
					if(ownerIndex >= 0)
						addConflict(branchIndex, ownerIndex);
					else
						branches[branchIndex].forceAlternate = true;
					break;
				}
			}
		}
	});

	var styles = [];
	for(var branchIndex = 0; branchIndex < branches.length; branchIndex++) {
		var solidUsed = false;
		var alternateUsed = false;
		for(var previousIndex = 0; previousIndex < branchIndex; previousIndex++) {
			if(!conflicts[branchIndex][previousIndex])
				continue;
			if(styles[previousIndex])
				alternateUsed = true;
			else
				solidUsed = true;
		}
		styles[branchIndex] = branches[branchIndex].forceAlternate
			? true
			: solidUsed && !alternateUsed;
		branches[branchIndex].node.classList.toggle('home-menu-connector-alternate', styles[branchIndex]);
	}
}
function syncHomeMenuConnectors(settled) {
	var menu = document.getElementById('home-menu');
	if(!menu)
		return;

	var menuRight = menu.getBoundingClientRect().right;
	var visibleSubtrees = menu.querySelectorAll('.home-menu-subtree:not([hidden])');
	var menuNodes = menu.querySelectorAll('.home-menu-node');
	[].forEach.call(menuNodes, function(node) {
		node.style.removeProperty('margin-right');
	});
	[].forEach.call(visibleSubtrees, function(subtree) {
		var subtreeLeft = subtree.getBoundingClientRect().left;
		subtree.style.setProperty('--home-subtree-width', Math.max(0, menuRight - subtreeLeft) + 'px');
	});

	var pageRight = document.body.getBoundingClientRect().right;
	[].forEach.call(menuNodes, function(node) {
		var subtree = node.querySelector(':scope > .home-menu-subtree:not([hidden])');
		var parentSubtree = node.parentElement;
		if(!subtree || !parentSubtree || !parentSubtree.classList.contains('home-menu-subtree'))
			return;
		var siblings = parentSubtree.querySelectorAll(':scope > .home-menu-node');
		if(siblings.length < 2)
			return;
		var source = homeMenuNodeTile(node);
		var firstChildSource = homeMenuNodeTile(subtree.querySelector(':scope > .home-menu-node'));
		if(!source || !firstChildSource)
			return;
		var sourceRect = source.getBoundingClientRect();
		var desiredChildRight = sourceRect.left + sourceRect.width / 2 + 36 + firstChildSource.getBoundingClientRect().width;
		if(desiredChildRight <= pageRight)
			return;
		var index = [].indexOf.call(siblings, node);
		var previous = index > 0 ? siblings[index - 1] : null;
		if(!previous)
			return;
		var nodeRect = node.getBoundingClientRect();
		var previousRect = previous.getBoundingClientRect();
		if(Math.abs(previousRect.top - nodeRect.top) < 2)
			previous.style.marginRight = Math.max(0, parentSubtree.getBoundingClientRect().right - previousRect.right) + 'px';
	});

	[].forEach.call(visibleSubtrees, function(subtree) {
		var subtreeLeft = subtree.getBoundingClientRect().left;
		subtree.style.setProperty('--home-subtree-width', Math.max(0, menuRight - subtreeLeft) + 'px');
	});

	[].forEach.call(document.querySelectorAll('#home-menu .home-menu-node'), function(node) {
		var source = homeMenuNodeTile(node);
		if(!source)
			return;

		var nodeRect = node.getBoundingClientRect();
		var sourceRect = source.getBoundingClientRect();
		var sourceCenter = sourceRect.top - nodeRect.top + sourceRect.height / 2;
		node.style.setProperty('--home-node-center-y', sourceCenter + 'px');

		var subtreeAll = node.querySelector(':scope > .home-menu-subtree');
		var subtree = node.querySelector(':scope > .home-menu-subtree:not([hidden])');
		var parentSubtree = node.parentElement;
		var siblingCount = parentSubtree && parentSubtree.classList.contains('home-menu-subtree')
			? parentSubtree.querySelectorAll(':scope > .home-menu-node').length
			: 0;
		var bottomConnector = siblingCount > 1 && !!subtreeAll;
		node.classList.toggle('home-menu-connector-bottom', bottomConnector);

		if(bottomConnector) {
			var parentLineXCollapsed = sourceRect.left - nodeRect.left + sourceRect.width / 2;
			var lineOriginYCollapsed = sourceRect.bottom - nodeRect.top + 8;
			node.style.setProperty('--home-bottom-line-start-y', lineOriginYCollapsed + 'px');
			node.style.setProperty('--home-bottom-line-x', parentLineXCollapsed + 'px');
		}

		if(!subtree) {
			node.classList.remove('home-menu-group-connector');
			node.classList.remove('home-menu-connector-alternate');
			node.style.removeProperty('--home-line-height');
			return;
		}

		var directNodes = subtree.querySelectorAll(':scope > .home-menu-node');
		var directNode = directNodes.length ? directNodes[directNodes.length - 1] : null;

		var parentLineX = parseFloat(getComputedStyle(node).getPropertyValue('--home-glyph-center')) || 19;
		var lineOriginY = sourceCenter;
		if(bottomConnector) {
			parentLineX = sourceRect.left - nodeRect.left + sourceRect.width / 2;
			lineOriginY = sourceRect.bottom - nodeRect.top + 8;
			var firstChild = directNodes.length ? directNodes[0] : null;
			var firstChildSource = homeMenuNodeTile(firstChild);
			if(firstChildSource) {
				var firstChildRect = firstChild.getBoundingClientRect();
				var childSourceOffset = firstChildSource.getBoundingClientRect().left - firstChildRect.left;
				subtree.style.setProperty('--home-bottom-child-indent', Math.max(0, parentLineX + 36 - childSourceOffset) + 'px');
			}
			node.style.setProperty('--home-bottom-line-start-y', lineOriginY + 'px');
			node.style.setProperty('--home-bottom-line-x', parentLineX + 'px');
		}
		[].forEach.call(directNodes, function(child) {
			var childSource = homeMenuNodeTile(child);
			if(!childSource)
				return;
			var childRect = child.getBoundingClientRect();
			var childSourceRect = childSource.getBoundingClientRect();
			var elbowY = childSourceRect.top - childRect.top + childSourceRect.height / 2;
			var lineX = nodeRect.left + parentLineX - childRect.left;
			var tileEdgeX = childSourceRect.left - childRect.left - 8;
			child.style.setProperty('--home-parent-elbow-y', elbowY + 'px');
			child.style.setProperty('--home-parent-elbow-left', Math.min(lineX, tileEdgeX) + 'px');
			child.style.setProperty('--home-parent-elbow-width', Math.abs(tileEdgeX - lineX) + 'px');
		});

		var childRows = {};
		var groupLeft = Infinity;
		var groupTop = Infinity;
		var groupBottom = -Infinity;
		[].forEach.call(directNodes, function(child) {
			var childSource = homeMenuNodeTile(child);
			if(!childSource)
				return;
			var childSourceRect = childSource.getBoundingClientRect();
			var rowKey = Math.round(childSourceRect.top);
			var rowCenterY = childSourceRect.top + childSourceRect.height / 2;
			if(!childRows[rowKey])
				childRows[rowKey] = { left: childSourceRect.left, centerY: rowCenterY };
			else
				childRows[rowKey].left = Math.min(childRows[rowKey].left, childSourceRect.left);
			groupLeft = Math.min(groupLeft, childSourceRect.left);
			groupTop = Math.min(groupTop, rowCenterY);
			groupBottom = Math.max(groupBottom, rowCenterY);
		});
		[].forEach.call(subtree.querySelectorAll(':scope > .home-menu-group-row-line'), function(line) {
			line.remove();
		});
		var wrappedGroup = directNodes.length > 1 && Object.keys(childRows).length > 1;
		node.classList.toggle('home-menu-group-connector', wrappedGroup);

		var target = directNode
			? homeMenuNodeTile(directNode)
			: homeMenuNodeTile(subtree.querySelector(':scope > .home-menu-node')) || subtree.querySelector(':scope > .home-menu-level > .item_block_container');

		if(!target) {
			node.style.removeProperty('--home-line-height');
			return;
		}

		var targetRect = target.getBoundingClientRect();
		var targetCenter = targetRect.top - nodeRect.top + targetRect.height / 2;
		if(wrappedGroup) {
			var subtreeRect = subtree.getBoundingClientRect();
			var groupSpineX = groupLeft - 24;
			var groupCenterY = (groupTop + groupBottom) / 2;
			var lineAbsoluteX = nodeRect.left + parentLineX;
			targetCenter = groupCenterY - nodeRect.top;
			subtree.style.setProperty('--home-group-elbow-y', groupCenterY - subtreeRect.top + 'px');
			subtree.style.setProperty('--home-group-elbow-left', Math.min(lineAbsoluteX, groupSpineX) - subtreeRect.left + 'px');
			subtree.style.setProperty('--home-group-elbow-width', Math.abs(groupSpineX - lineAbsoluteX) + 'px');
			subtree.style.setProperty('--home-group-spine-top', groupTop - subtreeRect.top + 'px');
			subtree.style.setProperty('--home-group-spine-x', groupSpineX - subtreeRect.left + 'px');
			subtree.style.setProperty('--home-group-spine-height', groupBottom - groupTop + 'px');
			Object.keys(childRows).sort(function(a, b) { return Number(a) - Number(b); }).forEach(function(rowKey) {
				var row = childRows[rowKey];
				var rowLine = document.createElement('span');
				rowLine.className = 'home-menu-group-row-line';
				rowLine.setAttribute('aria-hidden', 'true');
				rowLine.style.setProperty('--home-group-row-line-y', row.centerY - subtreeRect.top + 'px');
				rowLine.style.setProperty('--home-group-row-line-left', groupSpineX - subtreeRect.left + 'px');
				rowLine.style.setProperty('--home-group-row-line-width', Math.max(0, row.left - 8 - groupSpineX) + 'px');
				subtree.appendChild(rowLine);
			});
		}
		node.style.setProperty('--home-line-height', Math.max(0, targetCenter - lineOriginY) + 'px');


	});

	syncHomeMenuConnectorStyles(menu);

	if(settled !== true)
		requestAnimationFrame(function() {
			syncHomeMenuConnectors(true);
		});
}

function root() {
	var e = document.getElementById('profile-image');
	if(e) {
		root.full = false;
		e.addEventListener( "click", function(){
			if(root.full) {
				e.blur();
				root.full = false;
			}
			else
				root.full = true;
		});
	}

	[].forEach.call(document.querySelectorAll('#home-menu [data-home-menu-toggle]'), function(button) {
		if(button.getAttribute('data-home-menu-initialized') == 'true')
			return;

		button.setAttribute('data-home-menu-initialized', 'true');
		var glyph = button.querySelector('span');
		if(glyph && !glyph.textContent)
			glyph.textContent = button.getAttribute('aria-expanded') == 'false' ? '+' : '\u2212';
		button.addEventListener('click', function() {
			var target = document.getElementById(button.getAttribute('aria-controls'));
			if(!target)
				return;

			var expanded = button.getAttribute('aria-expanded') == 'true';
			button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
			button.setAttribute('aria-label', (expanded ? 'Expand ' : 'Collapse ') + button.getAttribute('data-home-menu-label'));
			var glyph = button.querySelector('span');
			if(glyph)
				glyph.textContent = expanded ? '+' : '\u2212';
			target.hidden = expanded;
			requestAnimationFrame(syncHomeMenuConnectors);
		});
	});

	syncHomeMenuConnectors();

	if(!root.homeMenuResizeInitialized) {
		root.homeMenuResizeInitialized = true;
		window.addEventListener('resize', syncHomeMenuConnectors);
	}
}
