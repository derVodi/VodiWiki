function blobToNewArticle(blob, cb){
	blobToDataUrlAsync(blob, function(dataUrl){
		article = new Tiddler();
		var now = new Date();
		var title = now.convertToYYYYMMDDHHMMSSMMM();
		article.set(title, dataUrl, config.views.wikified.defaultModifier, now, null, now);
		article.kind = "$";
		store.addTiddler(article);
		if (cb) cb(title, article);
	});
}

function blobToDataUrlAsync(blob, cb){
	var reader = new FileReader();
	reader.onloadend = function() { cb(reader.result); }
	reader.readAsDataURL(blob);
}

// Fix document.documentElement.outerHTML returning a crappy mutation of the original HTML source
function recreateOriginal() {
		
	var content = "<!DOCTYPE html>\n"; //  DOCTYPE is completely missing and has to be rebuilt from scratch
	
	content += document.documentElement.outerHTML; // Append browser's output of "original" HTML (broken)

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

function injectAllArticles(htmlSource) {
	
	storeAreaRange = locateStoreArea(htmlSource);
	if (! storeAreaRange) throw "storeAreaRange not found!";
	
	var revisedHtmlSource = htmlSource.substr(0, storeAreaRange[0] + storeAreaStartString.length) + "\n" +
													store.allTiddlersAsHtml() + "\n" +
													htmlSource.substr(storeAreaRange[1]);
								
	var newSiteTitle = getPageTitle().htmlEncode();
	revisedHtmlSource = revisedHtmlSource.replaceChunk("<title"+">", "</title"+">", " " + newSiteTitle + " ");
	return revisedHtmlSource;
}

function locateStoreArea(original) {
	// Locate the storeArea divs
	if (! original) return null;
	var posOpeningDiv = original.search(storeAreaStartRE);
	var limitClosingDiv = original.indexOf("<" + "!--POST-STOREAREA--" + ">");
	if (limitClosingDiv == -1) limitClosingDiv = original.indexOf("<" + "!--POST-BODY-START--" + ">");
	var start = limitClosingDiv == -1 ? original.length : limitClosingDiv;
	var posClosingDiv = original.lastIndexOf(storeAreaEndString, start);
	if (posClosingDiv == -1) posClosingDiv = original.lastIndexOf(storeAreaEndStringUpperCase, start);
	return (posOpeningDiv != -1 && posClosingDiv != -1) ? [posOpeningDiv, posClosingDiv] : null;
}

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

function populateInternalArticlesFromStaticHtml() {
	var dummyStore = new ArticleStore();
	dummyStore.loadFromDiv(document.getElementById("internalArticles"), true);
	dummyStore.forEachArticle(
		function(title, article) {
			config.internalArticles[title] = article.text;
		}
	);
}
