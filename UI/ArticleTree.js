config.macros.articleTree = {
	expand : "▷",
	collapse : "◿",
	collapsedTag : "collapsed"	
}

config.macros.articleTree.handler = function(place, macroName, params, wikifier, paramString, tiddler) { // Implements IMacroResolver.handler()
	var id = config.macros.articleTree.getId(place);
	config.macros.articleTree.createSubTree(place, id, "", 0);
}

var firstLeaf;

config.macros.articleTree.createSubTree = function(place, id, parentTitle, level) {
	var isOpen = true;
	
	var subArticles = store.getArticlesByField('parenttitle', true, parentTitle);
	
	if (! subArticles.length) {
		if (! firstLeaf) firstLeaf = parentTitle;
		createTiddlyText(renderLinkElement(place, parentTitle, false, "leaf"), parentTitle); // leaf
		return;
	}
		
	if (parentTitle != ""){
		var parentArticle = store.getArticle(parentTitle);
		if (parentArticle.tags.contains("collapsed")) isOpen = false;

		// render branch head (row with collapser button - will stay visible even when collapsed)
		var branchElement = createTiddlyElement(place , "div", null, "branch"); 
		renderTiddlyButton(branchElement, isOpen ? this.collapse : this.expand, null, this.onClick);
		renderLinkElement(branchElement, parentTitle, true);
	}
	
	var nodesWrapper; // the (collapsible) nodes are NOT nested inside their branch, they are underneath! Otherwise collapsing would be hard to realize.
	for (var i = 0; i < subArticles.length; i++){
		var title = subArticles[i].title;
		if (! nodesWrapper){
			nodesWrapper = createTiddlyElement(place, "div", null, "nodesWrapper");
			nodesWrapper.style.display = isOpen ? "block" : "none";
		}
		this.createSubTree(nodesWrapper, id, title, level + 1); // RECURSION
	}
}

config.macros.articleTree.onClick = function(e) {
	var n = this.parentNode.nextSibling;
	var isOpen = n.style.display != "none";
	n.style.display = isOpen ? "none" : "block";
	this.firstChild.nodeValue = isOpen ? config.macros.articleTree.expand : config.macros.articleTree.collapse;
	return false;
}

config.macros.articleTree.getId = function(element) {
	while (! element.id && element.parentNode) element = element.parentNode;
	return element.id ? element.id : "<html>";
}
