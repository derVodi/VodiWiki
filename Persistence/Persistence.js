// Save this tiddlywiki with the pending changes
function saveChangesAction(forceManualMode) {
	clearMessage();	
	var msg = config.messages;
	var originalUrl = decodeURIComponent(document.location.toString()); // document.location is URL escaped like "file:///C:/Foo/V%C3%B6di%F0%9F%92%ADWiki.html"
	var localPath = getLocalPath(originalUrl);
	var outdatedHtmlSource = getHtmlSourceWithoutDynamicallyAddedContent();
	if (outdatedHtmlSource == null) {
		alert(msg.cantSaveError);
		return;
	}		
	var couldBeSavedAutomatically = injectArticlesAndSave(localPath, outdatedHtmlSource, forceManualMode);
	if (couldBeSavedAutomatically){
		store.setDirty(false);	
		displayMessage(config.messages.mainSaved);
	}
}

function injectArticlesAndSave(localPath, htmlSource, forceManualMode) {
	try {
		var revisedHtmlSource = injectAllArticles(htmlSource);
		return saveFile(localPath, revisedHtmlSource, forceManualMode);
	} catch (ex) {
		showException(ex);
		return false;
	}
}

// Returns true, if saving was possible unattendedly (without forcing the user to download manually)
window.saveFile = window.saveFile || function(fileUrl, htmlSource, forceManualMode) {
	
	if (! forceManualMode) if (saveFileViaBlobApi(fileUrl, htmlSource)) return true;
		
	// Fallback: Create data URL link for manual download
		
	var dataUrl = "data:text/html;charset=UTF-8;base64," + encodeBase64(unescape(encodeURIComponent(htmlSource)));
	// JavaScript strings are UTF-16.
	// encodeURIComponent() will re-encode the UTF-16 string to UTF-8, but unfortunalely escape all URL-poison-chars/spaces
	// after calling unescape() you get pure UTF-8
	
	displayMessage(config.messages.mainDownloadManual, dataUrl, -1);		
	return false;
}

function saveFileViaBlobApi(fileUrl, htmlSource) {	
	if (document.createElement("a").download == undefined) return null;
	try {
		
		var slashpos = fileUrl.lastIndexOf("/");
		if (slashpos == -1) slashpos = fileUrl.lastIndexOf("\\"); 
		var filename = fileUrl.substr(slashpos + 1);
		
		var blob = new Blob([htmlSource], {encoding: "UTF-8", type: "data:text/html; charset=UTF-8"});
		var uri = window.URL.createObjectURL(blob);
		
		var link = document.createElement("a");
		// link.setAttribute("target", "_blank");
		link.setAttribute("href", uri);
		link.setAttribute("download", filename);
		document.body.appendChild(link);		
		link.click();
		document.body.removeChild(link);
		// window.URL.revokeObjectURL(uri); // todo: normally this should be done - edge won't save with this - maybe a timing problem, solution could be using a callback (if possible)
	} catch(ex) {
		return false;
	}	
	return true;
}

function saveTest() {
	var s = document.getElementById("saveTest");
	if (s.hasChildNodes()) alert(config.messages.savedSnapshotError);
	s.appendChild(document.createTextNode("savetest"));
}

//--
//-- LoaderBase and SaverBase
//--

function LoaderBase() {}

LoaderBase.prototype.loadTiddler = function(sourceElement, destinationStore, articles) {
	var title = this.getTitle(sourceElement);
	if (! title) return;
	if (safeMode && isShadowTiddler(title)) return;
		
	var article = destinationStore.getOrAddNewArticle(title);
	this.populateArticleFromElement(article, title, sourceElement);
	articles.push(article);
};

LoaderBase.prototype.loadArticles = function(sourceElements, destinationStore) {
	var articles = [];
	for (var i = 0; i < sourceElements.length; i++) {
		try {
			this.loadTiddler(sourceElements[i], destinationStore, articles);
		} catch(ex) {
			showException(ex, config.messages.tiddlerLoadError.format([this.getTitle(sourceElements[i])]));
		}
	}
	return articles;
};

function SaverBase() {}

SaverBase.prototype.transformAllArticlesToDivs = function(store) {
	var divBlocks = [];
	var articles = store.getArticlesQuickly("title", true); // sorted by "title", include hidden
	for (var i = 0; i < articles.length; i++) {
		divBlocks.push(this.transformArticleToDiv(store, articles[i]));
	}
	return divBlocks.join("\n");
};

//--
//-- TW21Loader (inherits from LoaderBase)
//--

function TW21Loader() {}

TW21Loader.prototype = new LoaderBase();

TW21Loader.prototype.getTitle = function(node) {
	// Line breaks in HTML source appear as "text elements" here which don't have "getAttribute" and must be ignored
	return (node.getAttribute) ? node.getAttribute("title") : null;	
};

TW21Loader.prototype.populateArticleFromElement = function(targetArticle, title, sourceDivElement) {
	var preElement = sourceDivElement.firstChild;
	while (preElement.nodeName != "PRE" && preElement.nodeName != "pre") { // Line breaks in HTML source appear as "text elements" here which must be skipped
		preElement = preElement.nextSibling;
	}
	var text = preElement.innerHTML.replace(/\r/mg,"").htmlDecode(); // Remove CR (keep LF), unescape HTML stuff like "&lt;&gt;" to "<>"

	var kind = sourceDivElement.getAttribute("kind");
	var creator = sourceDivElement.getAttribute("creator");
	var modifier = sourceDivElement.getAttribute("modifier");
	var c = sourceDivElement.getAttribute("created");
	var m = sourceDivElement.getAttribute("modified");
	var created = c ? Date.convertFromYYYYMMDDHHMMSS(c) : new Date();
	var modified = m ? Date.convertFromYYYYMMDDHHMMSS(m) : created;
	var tags = sourceDivElement.getAttribute("tags");
	var fields = {};
	var attrs = sourceDivElement.attributes;
	for (var i = attrs.length-1; i >= 0; i--) {
		var name = attrs[i].name;
		if (attrs[i].specified && ! ArticleStore.isStandardField(name)) {
			fields[name] = attrs[i].value.unescapeLineBreaks();
		}
	}
	targetArticle.assign(title, text, modifier, modified, tags, created, fields, creator);
	targetArticle.kind = kind;
};

//--
//-- TW21Saver (inherits from SaverBase)
//--

function TW21Saver() {}

TW21Saver.prototype = new SaverBase();

TW21Saver.prototype.transformArticleToDiv = function(store, article) {
	try {
		var attributes =
			(article.kind ? ' kind="' + article.kind + '"' : "") +
			' created="' + article.created.convertToYYYYMMDDHHMM() + '"' +
 			' modified="' + article.modified.convertToYYYYMMDDHHMM() + '"' +
			' modifier="' + article.modifier.htmlEncode() + '"'
		;
		var tags = article.getTagsTuple();
		if (tags) attributes += ' tags="' + tags.htmlEncode() + '"';
		
		var extendedAttributes = ""; // changecount parenttitle
		
		store.forEachField(article,
			function(article, fieldName, value) {
				// don't store stuff from the temp namespace
				if (typeof value != "string") value = "";
				if (value && ! fieldName.match(/^temp\./)) extendedAttributes += ' %0="%1"'.format([fieldName, value.escapeLineBreaks().htmlEncode()]);
			}, true
		);
		
		return ('<div title="%0"%1%2>\n<pre>%3</pre>\n</'+'div>').format([
			article.title.htmlEncode(),
			attributes,
			extendedAttributes,
			article.text.htmlEncode()
		]);
	} catch (ex) {
		throw exceptionText(ex, config.messages.tiddlerSaveError.format([article.title]));
	}
};
