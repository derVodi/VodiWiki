//--
//-- ImportTiddlers macro
//--

config.macros.importTiddlers.handler = function(place, macroName, params, wikifier, paramString, tiddler) { // Implements IMacroResolver.handler()
	if (readOnly) {
		createTiddlyElement(place, "div", null, "marked", this.readOnlyWarning);
		return;
	}
	var presenter = new WizardPresenter();
	presenter.renderNewView(place, this.wizardTitle);
	this.restart(presenter);
};

config.macros.importTiddlers.onCancel = function(e) {
	var presenter = new WizardPresenter(this);
	presenter.clear();
	config.macros.importTiddlers.restart(presenter);
	return false;
};

config.macros.importTiddlers.onClose = function(e) {
	backstage.hidePanel();
	return false;
};

config.macros.importTiddlers.restart = function(presenter) {
	var me = config.macros.importTiddlers;
	presenter.renderBodyContent(this.step1Title, this.step1Html);
	var choseFileButton = presenter.getElement("choseFileButton");
	presenter.renderFooterContent([{caption: this.openLabel, tooltip: this.openPrompt, onClick: me.onInspectClicked}]);		
};

config.macros.importTiddlers.onInspectClicked = function(e) {
	var me = config.macros.importTiddlers;
	var presenter = new WizardPresenter(this); // "this" is the clicked <a> element
	var importWorkItem = {};
	importWorkItem.afterAsyncGoto = [];
	importWorkItem.presenter = presenter;
	
	presenter.setValue("importWorkItem", importWorkItem);
	
	var choseFileButton = presenter.getElement("choseFileButton");
	if (choseFileButton.files) importWorkItem.file = choseFileButton.files[0];
	
	importWorkItem.afterAsyncGoto.push(me.onAfterRetrievingArticleList);
	FileImporter.retrieveArticleListAsync(importWorkItem);
	
	presenter.renderFooterContent([{caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel}], me.statusRetrievingArticleList);
	return false;
};

config.macros.importTiddlers.onAfterRetrievingArticleList = function(importWorkItem) {
	var me = config.macros.importTiddlers;
	
	if (importWorkItem.status !== true) { // s.th. failed...		
		importWorkItem.presenter.renderFooterContent([{caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel}], me.errorRetrievingArticleListFromFile);
		return;
	}
	
	// Extract data for the listview
	var rowsToBeRendered = [];
	if (importWorkItem.ArticlesToBeImported) {
		for (var i = 0; i < importWorkItem.ArticlesToBeImported.length; i++) {
			var article = importWorkItem.ArticlesToBeImported[i];
			rowsToBeRendered.push({
				title: article.title,
				modified: article.modified,
				modifier: article.modifier,
				text: article.text ? wikifyPlainText(article.text, 100) : "",
				tags: article.tags,
				size: article.text ? article.text.length : 0,
				tiddler: article
			});			
		}
	}
	rowsToBeRendered.sort(function(a,b) {return a.title < b.title ? -1 : (a.title == b.title ? 0 : +1);});
	
	// Display the listview
	
	importWorkItem.presenter.renderBodyContent(me.step2Title, me.step2Html);
	var listViewPlaceholder = importWorkItem.presenter.getElement("listViewPlaceholder");
	var listWrapper = document.createElement("div");
	listViewPlaceholder.parentNode.insertBefore(listWrapper,listViewPlaceholder);
	var listView = ListView.create(listWrapper,rowsToBeRendered, me.listViewTemplate, null, "listView twtable toBeImported");
	importWorkItem.presenter.setValue("listView", listView);	
	importWorkItem.presenter.renderFooterContent([
		{caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel},
		{caption: me.importLabel, tooltip: me.importPrompt, onClick: me.onDoImportClicked}
	]);
};

config.macros.importTiddlers.onDoImportClicked = function(e) {
	var me = config.macros.importTiddlers;
	var presenter = new WizardPresenter(this);	
	var listView = presenter.getValue("listView");
	var titlesToBeImported = ListView.getSelectedRows(listView);
		
	// Let the user confirm overwriting of existing articles
	
	var existingTitles = [];
	for (var i = 0; i < titlesToBeImported.length; i++) {
		if (store.tiddlerExists(titlesToBeImported[i])) existingTitles.push(titlesToBeImported[i]);
	}
	if (existingTitles.length > 0) {
		if (! confirm(me.confirmOverwriteText.format([existingTitles.join(", ")]))) return false;
	}

	presenter.renderBodyContent(me.step3Title.format([titlesToBeImported.length]), me.step3Html);
	for (var i = 0; i < titlesToBeImported.length; i++) {
		var link = document.createElement("div");
		renderLinkElement(link, titlesToBeImported[i], true);
		var place = presenter.getElement("markReport");
		place.parentNode.insertBefore(link,place);
	}
	presenter.setValue("remainingImports", titlesToBeImported.length);
	presenter.renderFooterContent(
		[{caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel}],
		me.statusDoingImport
	);
		
	var importWorkItem = presenter.getValue("importWorkItem"); // this was the context which was populated while retrieving the article list
	var articles = importWorkItem ? importWorkItem.ArticlesToBeImported : [];
	for (var i = 0; i < titlesToBeImported.length; i++) {
		var context = { // todo: no need to pretend async loading of each incoming article!
			afterAsyncGoto: [],
			allowSynchronous: true,
			file: importWorkItem.file,
			presenter: presenter,
			tiddler: articles[articles.findByField("title", titlesToBeImported[i])] // todo: hä? - wird sowieso später überklatscht?!?
		};
		context.afterAsyncGoto.push(me.onArticleRetrieved);
		FileImporter.retrieveArticleAsync(titlesToBeImported[i], context);
	}
	return false;
};

config.macros.importTiddlers.onArticleRetrieved = function(context) {
	var me = config.macros.importTiddlers;
	if (! context.status) displayMessage("Error in importTiddlers.onArticleRetrieved: " + context.statusText);
	
	// Internalize incoming article
	
	var tiddler = context.tiddler;
	store.suspendNotifications();
	store.addOrUpdate(tiddler.title, tiddler.title, tiddler.text, tiddler.modifier, tiddler.modified, tiddler.tags, tiddler.fields, true, tiddler.created);
	store.resumeNotifications();
	
	// Notify
	
	if (! context.isSynchronous) store.notify(tiddler.title, true);
	
	// Update counter
	
	var remainingImports = context.presenter.getValue("remainingImports") - 1;
	context.presenter.setValue("remainingImports", remainingImports);
	
	// if this was the last one
	
	if (remainingImports == 0) {
		if (context.isSynchronous) {
			store.notifyAll();
			refreshDisplay();
		}
		context.presenter.renderFooterContent([{caption: me.doneLabel, tooltip: me.donePrompt, onClick: me.onClose}], me.statusDoneImport);
		autoSaveChanges();
	}
	
};
