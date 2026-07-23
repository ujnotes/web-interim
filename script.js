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

	curTab = target;
	var canvas_main = document.getElementById('canvas-main');
	var main_wrapper = document.getElementById('main-wrapper');

	main_wrapper.classList.add('hide_path_title_updated');
	canvas_main.classList.add('hide');

	var startTime = new Date().getTime();
	syncScrollReload.startTime = null;
	scrollTop();
	initLoading();
	if(target == 'root') {
		document.getElementById('path-container').classList.add('hide_scale');
		document.getElementById('title-container').classList.add('hide_scale');
	}
	else {
		document.getElementById('path-container').classList.remove('hide_scale');
		document.getElementById('title-container').classList.remove('hide_scale');
	}
	document.getElementById('path').classList.add('hide');
	document.getElementById('title').classList.add('hide');

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
				switch (xmlhttp.status) {
				case 200: {
					endLoading();

					var resp = JSON.parse(xmlhttp.responseText);
					document.title = resp.desc + ' - ' + PROJECT_TITLE;
					if(target == 'root')
						updatePathTitle('', '&nbsp;', resp.prevArticle, resp.nextArticle);
					else
						updatePathTitle(resp.path, title, resp.prevArticle, resp.nextArticle);
					syncScrollReload(startTime, resp, target);
				} break;
				case 404: {
					canvas_main.innerHTML = "Error: 404 - Resource not found!";
				} break;
				case 408:
				case 501:
				case 502: {
					canvas_main.innerHTML = 'Error!';
					errorLoading();
				}
				}
			}
		}

	}

	gTarget = target;
	xmlhttp.open('GET', '/'+target+'.json', true);
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
		document.getElementById('content').innerHTML = resp.content;
		document.getElementById('canvas-main').classList.remove('hide');
		if(!URLid == '') {
			document.getElementById('main-wrapper').classList.remove('hide_path_title_updated');
		}
		var height = document.getElementById('canvas-main').scrollHeight;
		document.getElementById('nav-menu').style.maxHeight = height+'px';
		document.getElementById('canvas-main').style.maxHeight = null;
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

function updateArticleNavigationLink(linkId, article, direction) {
	var link = document.getElementById(linkId);
	if(article == null) {
		link.classList.add('article-title-nav-disabled');
		link.removeAttribute('href');
		link.removeAttribute('data-target');
		link.removeAttribute('data-title');
		link.removeAttribute('title');
		link.setAttribute('aria-label', 'No ' + direction.toLowerCase() + ' article');
		link.setAttribute('aria-disabled', 'true');
		link.setAttribute('tabindex', '-1');
		return;
	}

	link.classList.remove('article-title-nav-disabled');
	link.setAttribute('href', article.url);
	link.setAttribute('data-target', article.id);
	link.setAttribute('data-title', article.label);
	link.setAttribute('title', direction + ' article');
	link.setAttribute('aria-label', direction + ' article');
	link.removeAttribute('aria-disabled');
	link.setAttribute('tabindex', '0');
}

function updatePathTitle(path, title, prevArticle, nextArticle) {
	setTimeout(function() {
		document.getElementById('path').innerHTML = path;
		document.getElementById('title').innerHTML = title;
		updateArticleNavigationLink('article-prev', prevArticle, 'Previous');
		updateArticleNavigationLink('article-next', nextArticle, 'Next');
		document.getElementById('path').classList.remove('hide');
		document.getElementById('title').classList.remove('hide');
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
	if(!!e.state)
		if(e.state.id == 'menu')
			activateMenuFn();
		else {
			loadCanvas(e.state.id, e.state.title == null? '' : e.state.title);
		}
}

function recordState(tab, title) {
	var path;
	if(tab != 'root')
		path = tab;
	else
		path = '';
	window.history.pushState({'id':tab, 'title':title}, '', '/'+path);
}

function replaceState(tab, title) {
	var path;
	if(tab != 'root')
		path = tab;
	else
		path = '';
	window.history.replaceState({'id':tab, 'title':title}, '', '/'+path);
}
function initLoad() {
	if(!initLoadDone && document.readyState === 'interactive') {
		init();
		initLoadDone = true;
	}
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
			translate_box = document.querySelector('#google_translate_element'),
			search_box = document.querySelector('#search_box');
	
		if(!!hashID) {
			curTab = 'root';
			loadCanvas(document.getElementById(hashID));
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
		else
			recordState(URLid, '');
	
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
	
		var lang_switcher = document.querySelector('#language-switcher'),
			lang_has_native = lang_switcher && lang_switcher.querySelector('.lang-link');

		translate_button.addEventListener( 'click', function() {
			if(typeof isTranslateButtonActive === 'undefined') {
				// If native translations available, show language switcher
				// Otherwise fall back to Google Translate
				if (!lang_has_native) {
					var scriptTag = document.createElement('script');
					scriptTag.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
					translate_button.parentNode.appendChild(scriptTag);
				}
				isTranslateButtonActive = false;
			}
			if(!isTranslateButtonActive) {
				translate_button.classList.add('header-button-active');
				if (lang_has_native) {
					lang_switcher.classList.remove('hide_display');
				} else {
					translate_box.classList.remove('hide_display');
				}
				isTranslateButtonActive = true;
			}
			else {
				translate_button.classList.remove('header-button-active');
				if (lang_has_native) {
					lang_switcher.classList.add('hide_display');
				} else {
					translate_box.classList.add('hide_display');
				}
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

		initPageFunction(curTab);
		return false;

}
var initPageFunction = function(path) {
	if(typeof path != 'undefined') {
		var pageFunction = path.replace('/', '__');
		if (typeof window[pageFunction] === 'function')
			window[pageFunction]();
	}
}
function getURLid() {
	var loc = window.location.pathname;
	if(loc == '/')
		return '';
	else
		return loc.substring(1);
}

function getHashID() {
	var hash = window.location.hash;
	if(hash.length == 0)
		return '';
	else
		return hash.substring(2);
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
function root() {
	var e = document.getElementById('profile-image');
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
