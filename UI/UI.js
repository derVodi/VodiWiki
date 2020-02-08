// Fix document.documentElement.outerHTML returning a crappy mutation of the original HTML source
function recreateOriginal() {
	
	//  DOCTYPE is completely missing and has to be rebuilt from scratch
	
	var content = "<!DOCTYPE ";
	var t = document.doctype;
	if (! t) {
		content += "html"
	} else {
		content += t.name;
		if      (t.publicId) content += ' PUBLIC "' + t.publicId + '"';
		else if (t.systemId) content += ' SYSTEM "' + t.systemId + '"';
	}
	content += ' "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"';
	content += '>\n';

	// Append browser's output of "original" HTML (broken)
	content += document.documentElement.outerHTML;

	// Fix stuff

	content = content.replace(/<div id="saveTest">savetest<\/div>/, '<div id="saveTest"></div>'); // clear 'savetest' marker
	// todo hier mehr krempel leeren, dann kann in main() auf den riesen snapshot der Ursprungsseite verzichtet werden
	// alles was dynamisch erzeugt wurde
	// z.B. der ganze Backstage-Kram (suche nach "var backstage =")
	
	content = content.replace(/><head>/, '>\n<head>'); //newline before head tag
	content = content.replace(/\n\n<\/body><\/html>$/, '</body>\n</html>\n'); // newlines before/after end of body/html tags
	content = content.replace(/(<(meta) [^\>]*[^\/])>/g, '$1 />'); // meta tag terminators
	content = content.replace(/<noscript>[^\<]*<\/noscript>/,	function(m) {return m.replace(/&lt;/g,'<').replace(/&gt;/g,'>');}); // decode LT/GT entities in noscript (obsolete?)
	
	return content;
}

function recurseDom(nodes, cb) {
	for (var i = 0, len = nodes.length; i < len; i++) {
		var node = nodes[i], ret = cb(node)
		if (ret) return ret
		if (node.childNodes.length) {
			var ret = recurseDom(node.childNodes, cb)
			if (ret) return ret
		}
	}
}

// Resolve the element that triggered an event
function resolveSender(e) {
	var obj;

	if (e.target)
		obj = e.target;
	else if (e.srcElement)
		obj = e.srcElement;

	if (obj.nodeType == 3) // xxx still necessary? defeat Safari bug
		obj = obj.parentNode;
	return obj;
}

function addEvent(obj, type, fn) {
	if (obj.attachEvent) {
		obj["e"+type+fn] = fn;
		obj[type+fn] = function() {obj["e"+type+fn](window.event);};
		obj.attachEvent("on"+type,obj[type+fn]);
	} else {
		obj.addEventListener(type,fn,false);
	}
}

function removeEvent(obj,type,fn) {
	if (obj.detachEvent) {
		obj.detachEvent("on"+type,obj[type+fn]);
		obj[type+fn] = null;
	} else {
		obj.removeEventListener(type,fn,false);
	}
}

// Navigate through me and my parents until a tag of name <value> is found.
// value                  - 
// searchBy               - Normally the element's tagName is inspected (like "div, span, table, ..."). By specifying searchBy you can e.g. search by "className".
// navigationPropertyName - Normally, the crawler navigates invoking "parentNode" - you can specify any suitable element property name here.
function navigateThroughDom(e, value, searchBy, navigationPropertyName) {
	searchBy = searchBy || "tagName";
	navigationPropertyName = navigationPropertyName || "parentNode";
	if (searchBy == "className") {
		while (e && !jQuery(e).hasClass(value)) {
			e = e[navigationPropertyName]; // Reflection! The string value in the square brackets will be invoked!
		}
	} else {
		while (e && e[searchBy] != value) {
			e = e[navigationPropertyName]; // Reflection! The string value in the square brackets is invoked!
		}
	}
	return e;
}

// Get the scroll position for window.scrollTo necessary to scroll a given element into view
function ensureVisible(e) {
	var posTop = findPosY(e);
	var posBot = posTop + e.offsetHeight;
	var winTop = findScrollY();
	var winHeight = findWindowHeight();
	var winBot = winTop + winHeight;
	if (posTop < winTop) {
		return posTop;
	} else if (posBot > winBot) {
		if (e.offsetHeight < winHeight)
			return posTop - (winHeight - e.offsetHeight);
		else
			return posTop;
	} else {
		return winTop;
	}
}

// Get the current width of the display window
function findWindowWidth() {
	return window.innerWidth || document.documentElement.clientWidth;
}

// Get the current height of the display window
function findWindowHeight() {
	return window.innerHeight || document.documentElement.clientHeight;
}

// Get the current height of the document
function findDocHeight() {
	var D = document;
	return Math.max(
			Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
			Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
			Math.max(D.body.clientHeight, D.documentElement.clientHeight)
	);
}

// Get the current horizontal page scroll position
function findScrollX() {
	return window.scrollX || document.documentElement.scrollLeft;
}

// Get the current vertical page scroll position
function findScrollY() {
	return window.scrollY || document.documentElement.scrollTop;
}

function findPosX(obj) {
	var curleft = 0;
	while (obj.offsetParent) {
		curleft += obj.offsetLeft;
		obj = obj.offsetParent;
	}
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	while (obj.offsetParent) {
		curtop += obj.offsetTop;
		obj = obj.offsetParent;
	}
	return curtop;
}

// Blur a particular element
function blurElement(e) {
	if (e && e.focus && e.blur) {
		e.focus();
		e.blur();
	}
}

// Create a non-breaking space
function insertSpacer(place) {
	var e = document.createTextNode(String.fromCharCode(160));
	if (place) place.appendChild(e);
	return e;
}

// Replace the current selection of a textarea or text input and scroll it into view
function replaceSelection(e, text) {
	if (e.setSelectionRange) {
		var oldpos = e.selectionStart;
		var isRange = e.selectionEnd > e.selectionStart;
		e.value = e.value.substr(0,e.selectionStart) + text + e.value.substr(e.selectionEnd);
		e.setSelectionRange(isRange ? oldpos : oldpos + text.length,oldpos + text.length);
		var linecount = e.value.split("\n").length;
		var thisline = e.value.substr(0,e.selectionStart).split("\n").length-1;
		e.scrollTop = Math.floor((thisline - e.rows / 2) * e.scrollHeight / linecount);
	} else if (document.selection) {
		var range = document.selection.createRange();
		if (range.parentElement() == e) {
			var isCollapsed = range.text == "";
			range.text = text;
			if (!isCollapsed) {
				range.moveStart("character", -text.length);
				range.select();
			}
		}
	}
}

// Set the caret position in a text area
function setCaretPosition(e, pos) {
	if (e.selectionStart || e.selectionStart == '0') {
		e.selectionStart = pos;
		e.selectionEnd = pos;
		e.focus();
	} else if (document.selection) {
		// IE support xxx
		e.focus ();
		var sel = document.selection.createRange();
		sel.moveStart('character', -e.value.length);
		sel.moveStart('character',pos);
		sel.moveEnd('character',0);
		sel.select();
	}
}

// Returns the text of the given (text) node, possibly merging subsequent text nodes
function getNodeText(e) {
	var t = "";
	while (e && e.nodeName == "#text") {
		t += e.nodeValue;
		e = e.nextSibling;
	}
	return t;
}

// Returns true if the element e has a given ancestor element
function isDescendant(e,ancestor) {
	while (e) {
		if (e === ancestor)
			return true;
		e = e.parentNode;
	}
	return false;
}

// deprecate the following...

// Prevent an event from bubbling
function stopEvent(e) {
	var ev = e || window.event;
	ev.cancelBubble = true;
	if (ev.stopPropagation) ev.stopPropagation();
	return false;
}

// Remove any event handlers or non-primitve custom attributes
function scrubNode(e) {
	if (!config.browser.isIE) return;
	var att = e.attributes;
	if (att) {
		var t;
		for (t=0; t<att.length; t++) {
			var n = att[t].name;
			if (n !== "style" && (typeof e[n] === "function" || (typeof e[n] === "object" && e[n] != null))) {
				try {
					e[n] = null;
				} catch(ex) {
				}
			}
		}
	}
	var c = e.firstChild;
	while (c) {
		scrubNode(c);
		c = c.nextSibling;
	}
}

function setStylesheet(s,id,doc) {
	jQuery.twStylesheet(s,{id:id,doc:doc});
}

function removeStyleSheet(id) {
	jQuery.twStylesheet.remove({id:id});
}
