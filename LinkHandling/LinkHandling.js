/**
	* Renders a link element (<a>)
	*
	* @param  {element} place                - Container element in which the link should be created
	* @param  {string}  titleAndSection      - Target. E.g. "##SectionName"
	* @param  {boolean} useTitleAsLabel      - If true, the title will become the inner html of the <a>...</a> tag. Otherwise it'll be left empty, so one has to insert stuff afterwards.
	* @param  {string}  additionalClassNames - Additional CSS class names (to be added after default class names).
	*                                          Defaults for internal links: "tiddlyLink", "tiddlyLinkExisting", "tiddlyLinkNonExisting"
	*                                          Defaults for external links: "externalLink"
	* @param  {boolean} isStatic             - Set true for external links.
	*
	* @return {element} - An <a> element.
*/
function renderLinkElement(place, titleAndSection, useTitleAsLabel, additionalClassNames, isStatic) {
	var parts = titleAndSection.split(config.textPrimitives.sectionSeparator);
	var title = parts[0]; 
	var section = parts[1]; 
	if (section) section = section.trim();
	
	if (! title.length) { // Fallback: if title is empty => use title of the article in which the link is rendered
		var articleView = story.getArticleViewByChild(place);
		title = articleView ? articleView.getAttribute('tiddler') : '';
	}
	
	title = title.trim();
	var label = useTitleAsLabel ? title : null;
	var classNames = buildClassNames(title, additionalClassNames);
	var btn;
	if (isStatic) {
		btn = renderExternalLink(place, store.getArticleTextPartOrSlice("SiteUrl", null) + "#" + title) 
		btn.className += ' ' + additionalClassNames;
	} else {
		btn = renderTiddlyButton(place, label, null, onLinkElementClicked, classNames);
	}
	btn.setAttribute("refresh", "link");
	btn.setAttribute("tiddlyLink", title);
	if (section) {
		btn.setAttribute('section', section);
		if (! store.getArticleTextPartOrSlice(title + config.textPrimitives.sectionSeparator + section))
			addClass(btn, 'tiddlyLinkNonExistingSection');
	}
	return btn;
}

function renderExternalLink(place, url, label) {
	var link = document.createElement("a");
	link.className = "externalLink";
	link.href = url;
	var f = config.messages.externalLinkTooltip;
	link.title = f ? f.format([url]) : url;
	if (config.options.chkOpenInNewWindow)
		link.target = "_blank";
	place.appendChild(link);
	if (label)
		createTiddlyText(link, label);
	return link;
}

function onLinkElementClicked(ev) {
	var e = ev || window.event;
	var sender = resolveSender(e);
	var title = sender.getAttribute("tiddlyLink");
	var sectionName = sender.getAttribute('section');
	var articleView = story.getArticleViewByChild(sender); 
	var senderTitle = articleView ? articleView.getAttribute('tiddler') : '';
	
	if (title != senderTitle || ! sectionName) { // link target is not on the current page
		story.showArticle(title);
	}
	
	clearMessage();
	
	// Select section element
	
	if (sectionName) {
		var sectionElement = story.scrollToSection(title, sectionName);
		if (sectionElement){
			var range = document.createRange();
			range.selectNodeContents(sectionElement);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}
			
	return false;
}

config.macros.anchor = {};

// params[0] - Name
// params[1] - Label
// e.g. <<anchor 'MyAnchorName' 'Here is an explicite anchor'>>, can be linked to by
// e.g. [[Local link to a named anchor|##MyAnchorName]]
config.macros.anchor.handler = function(place, macroName, params) { // Implements IMacroResolver.handler()
	var e =	createTiddlyElement(place, "a");
	e.name = params[0];
	e.text = params[1];
	e.className = "anchor";
};
