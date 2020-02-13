/**
	* @typedef {Object} Story
	*
	* UI layer. Controller which manages the visible article representations.
	*
*/
function Story(articleWrapperId) {
	this.articleWrapperId = articleWrapperId;
	this.highlightRegExp = null;
	
	/**
		* Transforms a user friendly title to an internal id by replacing spaces by underscores.
		*
		* @param {string} title - The title as seen by the user (e.g. 'My great foo_article')
		*
		* @return {string} - The title usable as internal id (e.g. 'articleMy_great_foo__article')
	*/
	this.createIdFromTitle = function(title) {
		return "article" + title.replace(/_/g, "__").replace(/ /g, "_");		
	};

}

Story.prototype.editLink = function() {	
	story.linkInfo = this.getLinkUnderCursor();
  var okHandler = function(labelsAndValues) {
		var textAreaElement = story.getTiddlerField(store.currentTiddler.title, "text");
		var newExpression;		
		if (labelsAndValues.Link.length > 0) {			
			newExpression = '[[' + labelsAndValues.Text + '|'+ labelsAndValues.Link + ']]';
		} else {
			newExpression = labelsAndValues.Text;
		}
		textAreaElement.value = (
			textAreaElement.value.substring(0, story.linkInfo.expressionStart) + 
			newExpression + 
			textAreaElement.value.substring(story.linkInfo.expressionEnd + 1)
		);		
	};	
	inputDialog.awaitUserInput({Text: story.linkInfo.displayText, Link: story.linkInfo.link}, 1, okHandler);
}

Story.prototype.getLinkUnderCursor = function() {
	// ToDo: getWordUnderCursor
	var textAreaElement = this.getTiddlerField(store.currentTiddler.title, "text");
	var left = textAreaElement.selectionStart;
	var right = textAreaElement.selectionEnd;
	var leftLinkSeparator = left;
	var rightLinkSeparator = right;
	var linkInfo = {link: ''};
	if (left === right) {
  	while (leftLinkSeparator >= 0 && textAreaElement.value[leftLinkSeparator] != "[" && textAreaElement.value[leftLinkSeparator] != "\n") {
			leftLinkSeparator--;
		}
		while (rightLinkSeparator < textAreaElement.textLength && textAreaElement.value[rightLinkSeparator] != "]" && textAreaElement.value[rightLinkSeparator] != "\n") {
			rightLinkSeparator++;
		}
    if (textAreaElement.value[leftLinkSeparator] != "[" || textAreaElement.value[rightLinkSeparator] != "]") {
			while (left >= 0 && textAreaElement.value[left] != " " && textAreaElement.value[left] != "\n") {
				left--;
			}
			while (right < textAreaElement.textLength && textAreaElement.value[right] != " " && textAreaElement.value[right] != "\n") {
				right++;
			}
			left++;
			linkInfo.expressionStart = left;
			linkInfo.expressionEnd = right - 1;
			linkInfo.displayText = textAreaElement.value.substring(left, right);
		} else {
			linkInfo.expressionStart = leftLinkSeparator -1;
			linkInfo.expressionEnd = rightLinkSeparator +1;
			left = leftLinkSeparator + 1;
			right = rightLinkSeparator;
			var innerExpression = textAreaElement.value.substring(left, right);
			var splitPos = innerExpression.indexOf('|');
			if (splitPos < 0) {
				linkInfo.displayText = textAreaElement.value.substring(left, right);
				linkInfo.link = textAreaElement.value.substring(left, right);	
			} else {
				linkInfo.displayText = innerExpression.substring(0, splitPos);
				linkInfo.link = innerExpression.substring(splitPos + 1);
			}			
		}
	} else {
		linkInfo.expressionStart = left;
		linkInfo.expressionEnd = right - 1;
		linkInfo.displayText = textAreaElement.value.substring(left, right);
	}
	
	return linkInfo;
}

/**
	* @return {Element} - The element representing the article. Null, if no article is currently opened.
*/
Story.prototype.getCurrentArticleView = function() {
	return this.getArticleWrapper().firstChild;
};
	
/**
	* Returns the dom element representing an opened article (one could say the 'tab page').
	*
	* @param  {string}  title - The title of an article.
	*
	* @return {Element} - The element (div) containing the article elements. Null, if the article is currently not opened.
*/
Story.prototype.getArticleViewByTitle = function(title) {
	return document.getElementById(this.createIdFromTitle(title));
};

Story.prototype.getArticleViewByChild = function(nestedElement) {
	while (nestedElement && ! jQuery(nestedElement).hasClass("articleView")) {
		nestedElement = jQuery(nestedElement).hasClass("popup") && Popup.stack[0] ? Popup.stack[0].root : nestedElement.parentNode;
	}
	return nestedElement;
};

Story.prototype.getArticleWrapper = function() {
	return document.getElementById(this.articleWrapperId);
};

Story.prototype.getArticleViewByAttribute = function(attributeName, value){
	var foundElement;
	story.forEachArticleView(function(title, element) {
		if (element.getAttribute(attributeName) == value){
			foundElement = element;
			return true; // true => "cancel loop"
		}
	});
	return foundElement;
}

Story.prototype.forEachArticleView = function(callbackFunction) {
	var place = this.getArticleWrapper();
	if (! place) return;
	var e = place.firstChild;
	var cancel = false;
	while (e) {
		var n = e.nextSibling;
		var title = e.getArticleTitle();
		if (title) {
			cancel = callbackFunction.call(this, title, e);
		}
		if (cancel) return;
		e = n;
	}
};

Story.prototype.history = {
	currentIdx: -1,
	backStopper: -1,
	fowardStopper: -1,
	limit: 10,
	titles: [],
	add: function(title) {
		if (title == this.titles[this.currentIdx]) return;
		var mayMoveBackStopper = false;
		if (this.currentIdx == this.backStopper) mayMoveBackStopper = true;
		this.currentIdx++;
		if (this.currentIdx == this.limit) this.currentIdx = 0;
		this.titles[this.currentIdx] = title;
		this.fowardStopper = this.currentIdx;
		if (mayMoveBackStopper) this.backStopper = this.currentIdx;
	},
	back: function() {
		var index = this.currentIdx - 1;
		if (index < 0) index = this.limit - 1;
		if (index == this.backStopper || this.titles[index] == undefined) return;
		this.currentIdx = index;
		story.showArticle(this.titles[index]);
	},
	forward: function() {
		if (this.currentIdx == this.fowardStopper) return;
		var index = this.currentIdx + 1;
		if (index >= this.limit) index = 0;
		this.currentIdx = index;
		story.showArticle(this.titles[index]);
	}
}

Story.prototype.displayTiddlers = function(unused, articles, templateNameOrNumber, unused, unused) {
	for (var t = articles.length - 1; t >= 0; t--) this.showArticle(articles[t].title, templateNameOrNumber);
};

// title - Title of an existing or new article
Story.prototype.showArticle = function(title, templateNameOrNumber, customFields) {
	var parts = title.split(config.textPrimitives.sectionSeparator);
	title = parts[0]; 
	var sectionName = parts[1];
	if (sectionName) sectionName = sectionName.trim();

	// Handle situation when currently editing

	var desiredView, returningView;
	var closingTitles = [];
	
	// close all views - part 1: Collect permissions...

	story.forEachArticleView(function(t, element) {
		if (element.getAttribute("dirty") == "true") {
			if (t == title){
				returningView = element;
				return true; // break loop;
			}
			var text = "'" + title + "' is currently being edited.\n\nPress OK to save and close this tiddler\nor press Cancel to leave it opened";
			if (! confirm(text)) {
				returningView = element;
				return true; // break loop;
			} else {
				story.acceptChanges(t);
			}
		}
		if (t == title) {
			desiredView = element;
		} else {
			closingTitles.push(t);
		}
	});

	if (returningView) return returningView; // abort, because we're currently editing and the user chose to cancel the navigation action

	// close all views - part 2: Actually close views

	closingTitles.forEach(function(t) {story.closeView(t);})
	
	// open or refresh the desired article
	
	var place = this.getArticleWrapper();

	if (! title) {
		createTiddlyElement(place, "div", "articleFallbackTitle", "articleView", "👀 Click on \"New Article\" on the left.", {tiddler: "FallbackTitle"});
		// HACK: Internal knowledge used to create a fake article view
		return null;
	}

	if (desiredView) {
		returningView = desiredView;
		this.populateViewOrChangeTemplate(title, templateNameOrNumber, false, customFields);
	} else {		
		returningView = this.renderNewView(place, title, templateNameOrNumber, customFields);
	}
	story.scrollToSection(title, sectionName);
	
	store.currentTiddler = store.getArticle(title); // HACK: CURRENT state doesn't belong in store - it has to be kept in the UI layer!
	if (store.currentTiddler) returningView.scrollTop = store.currentTiddler.rescuedScrollTop;
	story.history.add(title);
	renderBreadcrumbs();
	highlightArticleTree();
	
	return returningView;
};

//# Create a tiddler frame at the appropriate place in a story column. If the tiddler doesn't exist, triggers an attempt to load it as a missing tiddler
//# place - reference to parent element
//# before - null, or reference to element before which to insert new tiddler
//# title - title of new tiddler
//# templateNameOrNumber - the name of the tiddler containing the template or one of the constants DEFAULT_VIEW_TEMPLATE and DEFAULT_EDIT_TEMPLATE
//# customFields - an optional list of name:"value" pairs to be assigned as tiddler fields
Story.prototype.renderNewView = function(place, title, templateNameOrNumber, customFields) {
	var articleView = createTiddlyElement(null, "div", this.createIdFromTitle(title), "articleView");
	articleView.setAttribute("refresh", "tiddler");
	// if (customFields) articleView.setAttribute("tiddlyFields", customFields);
	place.appendChild(articleView);
	this.populateViewOrChangeTemplate(title, templateNameOrNumber, false, customFields);
	return articleView;
};

Story.prototype.chooseTemplateForTiddler = function(templateNameOrNumber) {
	
	if (! templateNameOrNumber) templateNameOrNumber = DEFAULT_VIEW_TEMPLATE; // true when null or 0
		
	if (templateNameOrNumber == DEFAULT_VIEW_TEMPLATE || templateNameOrNumber == DEFAULT_EDIT_TEMPLATE)
		templateNameOrNumber = config.tiddlerTemplates[templateNameOrNumber]; // actually transform 1 or 2 to "ViewTemplate" or "EditTemplate"
	return templateNameOrNumber; // return type is always string
};

// Renders an article viewer / editor - for existing articles as well as for non-existing articles
//# title - Title of an existing or new article.
//# templateNameOrNumber - null, the name of the article containing the template or one of the constants DEFAULT_VIEW_TEMPLATE and DEFAULT_EDIT_TEMPLATE
//# force - if true, forces the refresh even if the template hasn't changed
//# customFields - an optional list of name/value pairs to be assigned as tiddler fields (for edit templates)
Story.prototype.populateViewOrChangeTemplate = function(title, templateNameOrNumber, force, customFields) {
	var articleView = this.getArticleViewByTitle(title);
	if (! articleView) return;
	
	if (articleView.getAttribute("dirty") == "true" && ! force)	return articleView;
	
	var templateName = this.chooseTemplateForTiddler(templateNameOrNumber);
	
	var currTemplate = articleView.getAttribute("template");
	if ((templateName != currTemplate) || force) {
		var article = store.getArticle(title);
		
		if (! article) {
			article = new Tiddler();
			var now = new Date();
			if (isShadowTiddler(title)) {
				var tags = [];
				article.set(title, store.getArticleTextPartOrSlice(title), config.views.wikified.shadowModifier, now, tags, now);
			} else {
				// HACK: Weil das Template rein deklarativ ist und es keine dyn. TemplateHandler gibt, muss hier ein Brocken Intelligenz an die falsche Stelle geschissen werden.
				var text = (templateName != "EditTemplate") ? config.views.wikified.defaultText.format([title]) : null;
				var fields = customFields ? customFields.decodeHashMap() : null;
				article.set(title, text, config.views.wikified.defaultModifier, now, [], now, fields);
			}
		}
		articleView.setAttribute("tags", article.tags.join(" "));
		articleView.setArticleTitle(title);
		articleView.setAttribute("template", templateName);
		articleView.onmouseover = this.onTiddlerMouseOver;
		articleView.onmouseout = this.onTiddlerMouseOut;
		articleView.ondblclick = this.onTiddlerDblClick;
		articleView[window.event ? "onkeydown" : "onkeypress"] = this.onTiddlerKeyPress;
		
		// Load the template and resolve dynamic stuff:
		articleView.innerHTML = store.getArticleRawTextResolveIncludes(templateName, null, 10); // Template articles must be HTML syntax
		applyHtmlMacros(articleView, article); // This will add dynamic content to specially marked HTML tags

		if (store.tiddlerExists(title)) {
			jQuery(articleView).removeClass("shadow");
			jQuery(articleView).removeClass("missing");
		} else {
			jQuery(articleView).addClass(isShadowTiddler(title) ? "shadow" : "missing");
		}
		if (customFields)
			this.addCustomFields(articleView, customFields);
	}
	return articleView;
};


// renders hidden fields for customFields (alias "extended fields"), because later on it will be synced back to the entity (see mergeInputElementsToEditBuffer)
Story.prototype.addCustomFields = function(place, customFields) { // todo: get rid of all custom fields stuff and make parenttitle a native property (alias "ArticleStore.isStandardField")
	var fields = customFields.decodeHashMap();
	var w = createTiddlyElement(place, "div", null, "customFields");
	w.style.display = "none";
	for (var t in fields) {
		var e = document.createElement("input");
		e.setAttribute("type", "text");
		e.setAttribute("value", fields[t]);
		w.appendChild(e);
		e.setAttribute("edit", t);
	}
};

Story.prototype.refreshAllTiddlers = function(force) {
	var e = this.getArticleWrapper().firstChild;
	while (e) {
		var templateNameOrNumber = e.getAttribute("template");
		if (templateNameOrNumber && e.getAttribute("dirty") != "true") {
			this.populateViewOrChangeTemplate(e.getArticleTitle(), force ? null : templateNameOrNumber, true);
		}
		e = e.nextSibling;
	}
};

Story.prototype.scrollToSection = function(title, sectionName) {
	
	if (! title || ! sectionName) return;
	
	var articleView = this.getArticleViewByTitle(title);
	if (! articleView) return null;
	
	var elems = articleView.getElementsByTagName('*');
	var heads = [];
	var anchors = [];
	var cells = [];
	
	for (var i = 0; i < elems.length; i++)
		if (['H1','H2','H3','H4','H5'].contains(elems[i].nodeName)) heads.push(elems[i]); // todo: optimize this - don't create unnecessary collections
	
	for (var i = 0; i < elems.length; i++)
		if (elems[i].nodeName == 'A' && (elems[i].getAttribute('name')||'').length) anchors.push(elems[i]);
	
	for (var i = 0; i < elems.length; i++)
		if (elems[i].nodeName == 'TD') cells.push(elems[i]);
	
	var foundElement = null;
	
	for (var i = 0; i < heads.length; i++)
		if (getPlainText(heads[i]).trim() == sectionName) { foundElement = heads[i]; break; }
	
	if (! foundElement) for (var i = 0; i < anchors.length; i++)
		if (anchors[i].getAttribute('name') == sectionName) { foundElement = anchors[i]; break; }
	
	if (! foundElement) for (var i = 0; i < cells.length; i++)
		if (getPlainText(cells[i]).trim() == sectionName) { foundElement = cells[i]; break; }
	
	if (foundElement) {
		articleView.scrollTop = findPosY(foundElement) - articleView.clientHeight / 2;		
		return foundElement;
	}
}

Story.prototype.onTiddlerMouseOver = function(e) {
	jQuery(this).addClass("selected");
};

Story.prototype.onTiddlerMouseOut = function(e) {
	jQuery(this).removeClass("selected");
};

Story.prototype.onTiddlerDblClick = function(ev) { // ToDo: Get rid of the default command
	var e = ev || window.event;
	var sender = resolveSender(e);
	if (sender && sender.nodeName.toLowerCase() != "input" && sender.nodeName.toLowerCase() != "textarea") {
		if (document.selection && document.selection.empty)
			document.selection.empty();
		config.macros.toolbar.invokeCommand(this, "defaultCommand", e);
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
		return true;
	}
	return false;
};

// Handle keyboard events when editing
Story.prototype.onTiddlerKeyPress = function(ev) {
	var e = ev || window.event;
	clearMessage();
	var consume = false;
	var title = this.getArticleTitle(); // "this" was bound to the articleView in which the key was pressed (see Story.prototype.populateViewOrChangeTemplate)
	var sender = resolveSender(e);
	switch (e.keyCode) {
		case 9: { // [Tab]
			var textAreaElement = story.getTiddlerField(title, "text");
			if (sender.tagName.toLowerCase() == "input" && textAreaElement.value == config.views.editor.defaultText.format([title])) {
				// moving from input field and editor still contains default text, so select it
				textAreaElement.focus();
				textAreaElement.select();
				consume = true;
			}
			if (! e.shiftKey && sender.tagName.toLowerCase() == "textarea") {
				replaceSelection(sender, String.fromCharCode(9));
				consume = true;
			}
			break;
		}
		case 75: { // [Ctrl]-[K]
			if (e.ctrlKey) {
				story.forEachArticleView(
					function(title, tiddler) {
						if (hasClass(tiddler, 'selected') && story.isDirty(title)) story.editLink();
					}
				);
				consume = true;
			}
			break;
		}
		case 10: case 13: case 77: { // LF, CR, M => [Ctrl]-[Enter] (on different browsers)
			if (e.ctrlKey) {
				blurElement(this);
				config.macros.toolbar.invokeCommand(this, "defaultCommand", e);
				consume = true;
			}
			break;
		}
		case 27: { // [Esc]
			blurElement(this);
			config.macros.toolbar.invokeCommand(this, "cancelCommand", e);
			consume = true;
			break;
		}
	}
	e.cancelBubble = consume;
	if (consume) {
		if (e.stopPropagation) e.stopPropagation(); // Stop Propagation
		e.returnValue = true; // Cancel The Event in IE
		if (e.preventDefault ) e.preventDefault(); // Cancel The Event in Moz
	}
	return !consume;
};

/**
	* Searches for a data bound input or textarea element.
	*
	* @param {string} title 				- The article's title (obsolete, since we can edit only 1 article at a time)
	* @param {string} dataFieldName - A field name of the article entity (e.g. "title", "text", "tags", "parenttitle").
	*
	* @return {element} - The input or textarea element that is bound to dataFieldName. Fallback: The first element that is bound to any data field. Null, if there's no bound element at all.
*/
Story.prototype.getTiddlerField = function(title, dataFieldName) {
	var articleElement = this.getArticleViewByTitle(title);
	
	if (! articleElement) return null;	
	
	var children = articleElement.getElementsByTagName("*");
	var foundElement = null;	
	for (var i = 0; i < children.length; i++) {
		var c = children[i];
		if (c.tagName.toLowerCase() == "input" || c.tagName.toLowerCase() == "textarea") {
			if (! foundElement) foundElement = c; // rescue first hit as fallback. xxx why?
			if (c.getAttribute("edit") == dataFieldName) {
				foundElement = c;
				break;
			}
		}
	}
	return foundElement;
};

Story.prototype.focusTiddler = function(title, dataFieldName) {
	var e = this.getTiddlerField(title, dataFieldName);
	if (e) {
		e.focus();
		e.select();
	}
};

Story.prototype.blurTiddler = function(title) {
	var articleView = this.getArticleViewByTitle(title);
	if (articleView && articleView.focus && articleView.blur) {
		articleView.focus();
		articleView.blur();
	}
};

//# Adds a specified value to the edit controls (if any) of a particular
//# array-formatted field of a particular tiddler (eg "tags")
//#  title - name of tiddler
//#  tag - value of field, without any [[brackets]]
//#  mode - +1 to add the tag, -1 to remove it, 0 to toggle it
//#  field - name of field (eg "tags")
Story.prototype.setTiddlerField = function(title, tag, mode, dataFieldName) {
	var editingElement = this.getTiddlerField(title, dataFieldName);
	var tags = editingElement.value.readBracketedList();
	tags.addOrRemoveOrToggle(tag, mode);
	editingElement.value = String.buildInternalLinksTuple(tags);
};

Story.prototype.setTiddlerTag = function(title, tag, mode) {
	this.setTiddlerField(title, tag, mode, "tags");
};

Story.prototype.closeView = function(title) {
	
	var articleView = this.getArticleViewByTitle(title);
	if (! articleView) {
		return;
	}
	
	var article = store.getArticle(title);
	if (article) article.rescuedScrollTop = articleView.scrollTop;
	
	clearMessage();
	articleView.id = null;
	jQuery(articleView).remove();
};

Story.prototype.setDirty = function(title, dirty) {
	var articleView = this.getArticleViewByTitle(title);
	if (articleView)
		articleView.setAttribute("dirty", dirty ? "true" : "false");
};

Story.prototype.isDirty = function(title) {
	var articleView = this.getArticleViewByTitle(title);
	if (articleView) return articleView.getAttribute("dirty") == "true";
	return null;
};

Story.prototype.areAnyDirty = function() {
	var r = false;
	this.forEachArticleView(function(title, element) {
		if (this.isDirty(title))
			r = true;
	});
	return r;
};

Story.prototype.isEmpty = function() {
	var place = this.getArticleWrapper();
	return place && place.firstChild == null;
};

Story.prototype.mergeInputElementsToEditBuffer = function(element, editBuffer) {
	if (element && element.getAttribute) {
		var f = element.getAttribute("edit");
		if (f) editBuffer[f] = element.value.replace(/\r/mg, "");
		if (element.hasChildNodes()) {
			var c = element.childNodes;
			for (var i = 0; i < c.length; i++) this.mergeInputElementsToEditBuffer(c[i], editBuffer);
		}
	}
};

Story.prototype.hasChanges = function(title) {
	var articleView = this.getArticleViewByTitle(title);
	if (articleView) {
		var editBuffer = {};
		this.mergeInputElementsToEditBuffer(articleView, editBuffer);
		if (store.getArticle(title)) {
			for (var fieldName in editBuffer) {
				if (store.getValue(title, fieldName) != editBuffer[fieldName]) //# tiddler changed
					return true;
			}
		} else {
			if (isShadowTiddler(title) && store.getShadowTiddlerText(title) == editBuffer.text) { //# not checking for title or tags
				return false;
			} else { //# changed shadow or new tiddler
				return true;
			}
		}
	}
	return false;
};

/**
		* function story.acceptChanges() - 
		*
		* @param {string} title - The title as seen by the user (e.g. 'My great foo_article')
		*
		* @return {string} - The title usable as internal id (e.g. 'articleMy_great_foo__article')
	*/
Story.prototype.acceptChanges = function(title) {
	
	var articleView = this.getArticleViewByTitle(title);	
	if (! articleView) return null;
	
	var editBuffer = {};
	this.mergeInputElementsToEditBuffer(articleView, editBuffer);
	
	var newTitle = editBuffer.title || title;
	if (! store.tiddlerExists(newTitle)) {
		newTitle = newTitle.trim();
		var creator = config.options.txtUserName;
	}
	if (store.tiddlerExists(newTitle) && newTitle != title) {
		if (! confirm(config.messages.overwriteWarning.format([newTitle.toString()]))) return null;
		title = newTitle;
	}
	
	if (newTitle != title) this.closeView(newTitle);
	
	articleView.id = this.createIdFromTitle(newTitle);
	articleView.setArticleTitle(newTitle);
	articleView.setAttribute("template", DEFAULT_VIEW_TEMPLATE); // hack hier wird ein integer eingesetzt - sollte aber besser string sein!
	articleView.setAttribute("dirty", "false");
	var newDate = new Date();
	var extendedFields = {};
	if (store.tiddlerExists(title)) {
		var article = store.getArticle(title);
		extendedFields = article.fields; // article.fields is actually only extended fields. Other fields are real properties.
		creator = article.creator;
	}
	for (var fieldName in editBuffer) {
		if (! ArticleStore.isStandardField(fieldName)) extendedFields[fieldName] = editBuffer[fieldName];
	}
	store.addOrUpdate(title, newTitle, editBuffer.text, config.options.txtUserName, newDate, editBuffer.tags, extendedFields, null, null, creator);
	autoSaveChanges();
	return newTitle;
};
