config.macros.newArticleButton = {};

// This will render the button
config.macros.newArticleButton.handler = function(place, macroName, params) { // Implements IMacroResolver.handler()
	// process command line parameters
	var label = params[0];
	var createRoot = params[1];
	if (createRoot == "true") {
		renderTiddlyButton(place, label, "Create a new root level page", function() {config.macros.newArticleButton.onClick(true);},	null, null, null);
	} else{
		renderTiddlyButton(place, label, "Create a sub page for the current page", function() {config.macros.newArticleButton.onClick(false);},	null, null, null);
	}
};

config.macros.newArticleButton.onClick = function(createRoot) {
	var parentTitle = store.currentTiddler ? store.currentTiddler.title : null;
	if (createRoot || ! parentTitle || parentTitle == "Untitled")	parentTitle = "";
	story.showArticle("Untitled", DEFAULT_EDIT_TEMPLATE, parentTitle ? "parenttitle:[[" + parentTitle + "]]" : null);
	story.focusTiddler("Untitled", "title");
};

function createEmptyWikiAction() {
	
	var originalPath = document.location.toString();
	var localPath = getLocalPath(originalPath);
	
	var emptyPath, p;
	if ((p = localPath.lastIndexOf("/")) != -1)
		emptyPath = localPath.substr(0,p) + "/";
	else if ((p = localPath.lastIndexOf("\\")) != -1)
		emptyPath = localPath.substr(0,p) + "\\";
	else
		emptyPath = localPath + ".";
	
	emptyPath += "New Wiki.html";
	
	var original = window.originalHTML;
	var storeAreaRange = locateStoreArea(original);
	var empty = original.substr(0, storeAreaRange[0] + storeAreaStartString.length) + original.substr(storeAreaRange[1]);
	
	var emptySave = saveFile(emptyPath, empty);
			
	if (emptySave){
		emptyPath = "file:///" + emptyPath;
		displayMessage(config.messages.emptySaved, emptyPath, -1);
	} else {
		alert(config.messages.emptyFailed);
	}
}
