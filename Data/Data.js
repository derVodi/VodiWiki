function encodeBase64(data) {
	if (! data) return "";
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var out = "";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	for (var count = 0, i = 0; i < data.length; ) {
		chr1=data.charCodeAt(i++);
		chr2=data.charCodeAt(i++);
		chr3=data.charCodeAt(i++);
		enc1=chr1 >> 2;
		enc2=((chr1 & 3) << 4) | (chr2 >> 4);
		enc3=((chr2 & 15) << 2) | (chr3 >> 6);
		enc4=chr3 & 63;
		if (isNaN(chr2)) enc3 = enc4 = 64;
		else if (isNaN(chr3)) enc4 = 64;
		out += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		chr1 = chr2 = chr3 = enc1 = enc2 = enc3 = enc4 = "";
	}
	return out;
}

function convertUnicodeToHtmlEntities(s) {
	var re = /[^\u0000-\u007F]/g;
	return s.replace(re, function($0) {return "&#" + $0.charCodeAt(0).toString() + ";";});
}

function loadBuiltInArticlesFromHtmlIntoJsDictionary() {
	var shadows = new ArticleStore();
	shadows.loadFromDiv("builtInArticles", true);
	shadows.forEachArticle(function(title, tiddler) {config.shadowTiddlers[title] = tiddler.text;});
}
