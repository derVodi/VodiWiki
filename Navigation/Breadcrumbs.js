function renderBreadcrumbs() {
	var place = document.getElementById('breadcrumbsBox');
	while (place.firstChild) {
    place.removeChild(place.firstChild);
	}
	var article = store.currentTiddler;
	if (! article) return;
	var parentTitle;
	var parentTitles = [];
	do {
		parentTitle = article.fields['parenttitle'];
		if (parentTitle) {
			parentTitles.push(parentTitle);
			article = store.getArticle(parentTitle);
		}		
	} while (parentTitle && article);
	
	for (var i = parentTitles.length - 1; i >= 0; i--) {		
	 renderLinkElement(place, parentTitles[i], parentTitles[i]);
	 createTiddlyText(place, " ▸ ");
	}	
	createTiddlyText(place, store.currentTiddler.title);
};
