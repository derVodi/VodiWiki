/**
	* Event handler after clicking on a tag - will pop up a list of articles matching the clicked tag.
	*
	* @param  {element} ev - the <a> which represented the tag
*/
function onClickTag(ev) { // (do not mix up with onTagClick)
	var e = ev || window.event;
	var popup = Popup.create(this);
	jQuery(popup).addClass("taggedTiddlerList");
	var tag = this.getAttribute("tag");
	var title = this.getArticleTitle();
	if (popup && tag) {
		var foundArticles = tag.indexOf("[") == -1 ? store.getArticlesByTag(tag) : store.filterTiddlers(tag);
		var sortBy = this.getAttribute("sortby");
		if (sortBy && sortBy.length) {
			store.sortTiddlers(foundArticles, sortBy);
		}
		var titles = [];
		var r;
		for (r = 0; r < foundArticles.length; r++) {
			if (foundArticles[r].title != title)
				titles.push(foundArticles[r].title);
		}
		var lingo = config.views.wikified.tag;
		if (titles.length > 0) {
			createTiddlyElement(createTiddlyElement(popup, "li", null, "listBreak"), "div");
			for (r = 0; r < titles.length; r++) {
				renderLinkElement(createTiddlyElement(popup, "li"), titles[r], true);
			}
		} else {
			createTiddlyElement(popup, "li", null, "disabled", lingo.popupNone.format([tag])); // HACK: Kann theoretisch niemals vorkommen, dass tags aufgelistet werden, für die es keine Artikel gibt.
		}		
	}
	Popup.show();
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
	return false;
}

// Create a button for a tag with a popup listing all the tiddlers that it tags
function createTagButton(place, tag, excludeTiddler, title, tooltip) {
	var btn = renderTiddlyButton(place, title || tag, (tooltip || config.views.wikified.tag.tooltip).format([tag]), onClickTag);
	btn.setAttribute("tag", tag);
	if (excludeTiddler)
		btn.setAttribute("tiddler", excludeTiddler);
	return btn;
}
