config.macros.transclude.titleStack = [];

config.macros.transclude.renderText = function(place, text, title) {
	wikify(text, place, null, store.getArticle(title));
};

/**
	* Renders an article (or parts of it) into another article (called "transclusion").
	* Optionally resolves placeholders like string.format() would do:
	* The included article may contain numbered placeholders like "$1, $2" which will be replaced by arguments after the keyword "with:"
	*
	* Examples: <<transclude 'PageTitle##SectionName'>>
	*           <<transclude [[PageTitle::SliceName]]>>
	*           <<transclude book with: "Dan Brown" "The DaVinci Code">> => would replace "$1" by "Dan Brown" and "$2" by "The DaVinci Code"
*/
config.macros.transclude.handler = function(place, macroName, params, wikifier, paramString, article) { // Implements IMacroResolver.handler()
	var allowEval = true;
	var stack = config.macros.transclude.titleStack;
	if (stack.length > 0 && config.evaluateMacroParameters == "system") {
		// included tiddler and "system" evaluation required, so check tiddler tagged appropriately
		var title = stack[stack.length - 1];
		var pos = title.indexOf(config.textPrimitives.sectionSeparator);
		if (pos != -1) {
			title = title.substr(0, pos); // get the base tiddler title
		}
		var t = store.getArticle(title);
		if (! t || t.tags.indexOf("systemAllowEval") == -1) {
			allowEval = false;
		}
	}
	params = paramString.parseParams("name", null, allowEval, false, true);
	var names = params[0]["name"];
	var titleAndSection = names[0]; // e.g. "foo", "foo##bar", "##bar"

	// Complete '##section' to 'thisTitle##section'
	var sep = config.textPrimitives.sectionSeparator;
	var parts = titleAndSection.split(sep);
	var title = parts[0];
	var sectionName = parts[1];
	if (sectionName) sectionName = sectionName.trim();
	if ((! title.length) && sectionName) {
		var articleView = story.getArticleViewByChild(place);
		title = articleView ? articleView.getAttribute('tiddler') : article ? article.title : '';
		titleAndSection = title + sep + sectionName;
	}

	var className = names[1] || null;
	var args = params[0]["with"];
	var wrapper = createTiddlyElement(place, "span", null, className, null, {
		refresh: "content", tiddler: titleAndSection
	});
	if (args !== undefined)
		wrapper.setAttribute("args", "[[" + args.join("]] [[") + "]]");
	this.transclude(wrapper, titleAndSection, args);
};

config.macros.transclude.transclude = function(wrapper, titleAndSection, args) {
	var text = store.getArticleTextPartOrSlice(titleAndSection);
	if (! text)
		return;
	var stack = config.macros.transclude.titleStack;
	if (stack.indexOf(titleAndSection) !== -1)
		return;
	stack.push(titleAndSection);
	try {
		if (typeof args == "string")
			args = args.readBracketedList();
		var n = args ? Math.min(args.length, 9) : 0;
		for (var i = 0; i < n; i++) {
			var placeholderRE = new RegExp("\\$" + (i + 1),"mg");
			text = text.replace(placeholderRE, args[i]);
		}
		config.macros.transclude.renderText(wrapper, text, titleAndSection);
	} finally {
		stack.pop();
	}
};
