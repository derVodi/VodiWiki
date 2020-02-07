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

//--
//-- Message area
//--

function displayMessage(text, href, duration) {
	var messageAreaDiv = document.getElementById("messageArea");
	var textDiv;
	if (! messageAreaDiv.hasChildNodes()) {
		renderTiddlyButton(messageAreaDiv, "╳", "Close this popup", clearMessage);
		textDiv = createTiddlyElement(messageAreaDiv, "div", "messageText");
	}
	if (! textDiv) textDiv = document.getElementById("messageText");
	
	while (textDiv.firstChild) {textDiv.removeChild(textDiv.firstChild);}
	
	if (href) {
		var link = createTiddlyElement(textDiv, "a", null, null, text);
		link.href = href;
		link.target = "_blank";
	} else {
		textDiv.innerText = text;
	}
	
	messageAreaDiv.style.display = "block";

	if (! duration) duration = 3000;
	if (duration > 0 ) setTimeout(clearMessage, duration);
}

function clearMessage() {
	document.getElementById("messageArea").style.display = "none";
}
