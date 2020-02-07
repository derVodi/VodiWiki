//--
//-- FileImporter
//--

function FileImporter() {
}

FileImporter.onAfterRetrievingAWikiSource = function(importWorkItem, wikiHtmlSource) {
	importWorkItem.status = true;
	importWorkItem.incomingArticleStore = new ArticleStore();
	if (! importWorkItem.incomingArticleStore.importAllArticlesFromHtmlSource(wikiHtmlSource)) {
		importWorkItem.statusText = config.messages.invalidFileError.format([importWorkItem.file.name]);
		importWorkItem.status = false;
	}	
	importWorkItem.afterAsyncGoto.pop()(importWorkItem);
};

FileImporter.loadTiddlyWikiError = function(importWorkItem, jqXHR) {
	importWorkItem.status = false;
	importWorkItem.statusText = jqXHR.message;
	importWorkItem.afterAsyncGoto.pop()(importWorkItem);
};

FileImporter.retrieveArticleListAsync = function(importWorkItem) {
	
	importWorkItem.afterAsyncGoto.push(FileImporter.retrieveArticleList_WikiSourceRetrieved);
	
	var ajaxParameters = {
		type: "GET",
		file: importWorkItem.file,
		processData: false,
		success: function(data, textStatus, jqXHR) {FileImporter.onAfterRetrievingAWikiSource(importWorkItem, jqXHR.responseText);}, // DETOUR!
		error: function(jqXHR, textStatus, errorThrown) {importWorkItem.xhr = jqXHR;	FileImporter.loadTiddlyWikiError(importWorkItem, jqXHR);}
	};	
	ajaxReq(ajaxParameters);	
};

FileImporter.retrieveArticleList_WikiSourceRetrieved = function(importWorkItem, userParams) {
	if (importWorkItem.status) {
		if (importWorkItem.filter) { // todo: never true
			importWorkItem.ArticlesToBeImported = importWorkItem.incomingArticleStore.filterTiddlers(importWorkItem.filter);
		} else {
			importWorkItem.ArticlesToBeImported = [];
			importWorkItem.incomingArticleStore.forEachArticle(function(title,article) {
				if (title[0] != "`" && ! article.isTagged("systemConfig")) importWorkItem.ArticlesToBeImported.push(article); // Exclude internal stuff and legacy TiddlyWiki plugins
			});
		}
		importWorkItem.status = true;
	}
	
	importWorkItem.afterAsyncGoto.pop()(importWorkItem);	
};

FileImporter.retrieveArticleAsync = function(title, importWorkItem) { // todo: nur 1 verwender	
	importWorkItem.title = title;
	importWorkItem.afterAsyncGoto.push(FileImporter.retrieveArticle_WikiSourceRetrieved);
	if (importWorkItem.incomingArticleStore) { // todo: ever true?
		return importWorkItem.afterAsyncGoto.pop()(importWorkItem);
	}
	var ajaxParameters = {
		type: "GET",
		file: importWorkItem.file,
		processData: false,
		success: function(data, textStatus, jqXHR) { FileImporter.onAfterRetrievingAWikiSource(importWorkItem, jqXHR.responseText);	},
		error: function(jqXHR, textStatus, errorThrown) { FileImporter.loadTiddlyWikiError(importWorkItem, jqXHR); }
	};
	return ajaxReq(ajaxParameters);
};

FileImporter.retrieveArticle_WikiSourceRetrieved = function(importWorkItem, userParams) {
	var t = importWorkItem.incomingArticleStore.getArticle(importWorkItem.title);
	if (t) {
		importWorkItem.tiddler = t;
		importWorkItem.status = true;
	} else { //# tiddler does not exist in document
		importWorkItem.status = false;
	}
	if (importWorkItem.allowSynchronous) {
		importWorkItem.isSynchronous = true;
		importWorkItem.afterAsyncGoto.pop()(importWorkItem,userParams);
	} else {
		window.setTimeout(function() {importWorkItem.afterAsyncGoto.pop()(importWorkItem, userParams);},10);
	}
	return true;
};
