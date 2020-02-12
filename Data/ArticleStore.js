//--
//-- ArticleStore
//--

// Returns true if path is a valid field name (path),
// i.e. a sequence of identifiers, separated by "."
ArticleStore.isValidFieldName = function(name) {
	var match = /[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*/.exec(name);
	return match && (match[0] == name);
};

// Throws an exception when name is not a valid field name.
ArticleStore.checkFieldName = function(name) {
	if (!ArticleStore.isValidFieldName(name))	throw config.messages.invalidFieldName.format([name]);
};

function ArticleStore(params) {
	var tiddlers = {}; // Hashmap by name of articles (internal articles not included here!)
	if (params && params.config) {
		this.config = config;
	}
	this.tiddlersUpdated = false;
	this.namedNotifications = []; // Array of {name:,notify:} of notification functions
	this.notificationLevel = 0;
	this.slices = {}; // map tiddlerName->(map sliceName->sliceValue). Lazy.
	this.clear = function() {
		tiddlers = {};
		this.setDirty(false);
	};
	this.getArticle = function(title) {
		var t = tiddlers[title];
		return t instanceof Tiddler ? t : null;
	};
	this.deleteArticle = function(title) {
		delete this.slices[title];
		delete tiddlers[title];
	};
	this.addTiddler = function(tiddler) {
		delete this.slices[tiddler.title];
		tiddlers[tiddler.title] = tiddler;
	};
	// Internal articles not supported
	this.forEachArticle = function(callback) {
		var title;
		for (title in tiddlers) {
			var article = tiddlers[title];
			if (article instanceof Tiddler)	callback.call(this, title, article);
		}
	};
}

// Fetches a filtered list of articles from the store.
//#   filter - filter expression (eg "title [[multi word title]] [tag[systemConfig]]")
//# Returns an array of articles that match the filter expression
ArticleStore.prototype.filterTiddlers = function(filter) {
	var re = /([^\s\[\]]+)|(?:\[([ \w\.\-]+)\[([^\]]+)\]\])|(?:\[\[([^\]]+)\]\])/mg;

	var results = [];
	if (filter) {
		var match = re.exec(filter);
		while (match) {
			var handler = (match[1] || match[4]) ? 'tiddler' : config.filters[match[2]] ? match[2] : 'field';
			results = config.filters[handler].call(this, results, match);
			match = re.exec(filter);
		}
	}
	return results;
};

ArticleStore.prototype.setDirty = function(dirty) {
	this.dirty = dirty;
};

ArticleStore.prototype.isDirty = function() {
	return this.dirty;
};

// Finds only normal articles
ArticleStore.prototype.tiddlerExists = function(title) {
	var t = this.getArticle(title);
	return t != undefined;
};

function isShadowTiddler(title) { // todo look for "kind" property instead of this
	return config.internalArticles[title] === undefined ? false : true;
};

// Finds normal and internal articles
ArticleStore.prototype.isAvailable = function(title) {
	if (! title) return false;
	var s = title ? title.indexOf(config.textPrimitives.sectionSeparator) : -1;
	if (s != -1) title = title.substr(0, s);
	return this.tiddlerExists(title) || isShadowTiddler(title);
};

ArticleStore.prototype.getOrAddNewArticle = function(title) {
	var article = this.getArticle(title);
	if (article) return article;
		
	article = new Tiddler(title);
	this.addTiddler(article);
	this.setDirty(true);
	return article;
};

ArticleStore.prototype.getShadowTiddlerText = function(title) {
	if (typeof config.internalArticles[title] == "string")
		return config.internalArticles[title];
	else
		return "";
};

// Returns stuff from an article (or internal article)
ArticleStore.prototype.getArticleTextPartOrSlice = function(titleWithPartOrSlice, defaultText) {
	
	if (! titleWithPartOrSlice) return defaultText;
	
	// If a slice was requested, look for that first. (like "SomePageTitle::SliceName")
	
	var pos = titleWithPartOrSlice.indexOf(config.textPrimitives.sliceSeparator);
	if (pos != -1) {
		var slice = this.getTiddlerSlice(titleWithPartOrSlice.substr(0, pos), titleWithPartOrSlice.substr(pos + config.textPrimitives.sliceSeparator.length));
		if (slice) return slice;
	}
	
	// Check if a section was requested (like "SomePageTitle##SliceName")
	
	var sectionName = null;
	var pos = titleWithPartOrSlice.indexOf(config.textPrimitives.sectionSeparator);
	var title;
	if (pos != -1) {
		sectionName = titleWithPartOrSlice.substr(pos + config.textPrimitives.sectionSeparator.length);
		title = titleWithPartOrSlice.substr(0, pos);
	} else {
		title = titleWithPartOrSlice;
	}
	
	var article = this.getArticle(title);
	var text = article ? article.text : null;
	if (! article && isShadowTiddler(title)) text = this.getShadowTiddlerText(title); // Fallback to internal article
	if (text) {
		if (! sectionName) return text; // POI: Return the whole article
		var re = new RegExp("(^!{1,6}[ \t]*" + sectionName.escapeRegExp() + "[ \t]*\n)","mg");
		re.lastIndex = 0;
		var match = re.exec(text);
		if (match) {
			var t = text.substr(match.index + match[1].length);
			var re2 = /^!/mg;
			re2.lastIndex = 0;
			match = re2.exec(t); //# search for the next heading
			if (match) t = t.substr(0,match.index-1);//# don't include final \n
			return t.trim(); // POI: Return a section
		}
		// return defaultText;
	}
	if (defaultText != undefined) return defaultText;
	return null;
};

// if the returned text would contain an included title like this [[NestedArticleTitle]] it will be resolved (recursively).
// Internal articles supported.
ArticleStore.prototype.getArticleRawTextResolveIncludes = function(titleWithPartOrSlice, defaultText, depth) {
	var text = this.getArticleTextPartOrSlice(titleWithPartOrSlice, null);
	if (text == null) return defaultText;
	var textOut = [];
	var match, lastPos = 0;
	var bracketRegExp = new RegExp("(?:\\[\\[([^\\]]+)\\]\\])", "mg");
	do {
		match = bracketRegExp.exec(text);
		if (match) {
			textOut.push(text.substr(lastPos, match.index - lastPos));
			if (match[1]) {
				if (depth <= 0)	{
					textOut.push(match[1]);
				} else {
					textOut.push(this.getArticleRawTextResolveIncludes(match[1], "", depth - 1));
				}
			}
			lastPos = match.index + match[0].length;
		} else {
			textOut.push(text.substr(lastPos));
		}
	} while (match);
	return textOut.join("");
};

//ArticleStore.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1[\t\x20]*([^\n]+)[\t\x20]*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|[\t\x20]*([^\n]+)[\t\x20]*\|$)/gm;
ArticleStore.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1[\t\x20]*([^\n]*)[\t\x20]*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|[\t\x20]*([^\|\n]*)[\t\x20]*\|$)/gm;
// @internal
ArticleStore.prototype.calcAllSlices = function(title) {
	var slices = {};
	var text = this.getArticleTextPartOrSlice(title,"");
	this.slicesRE.lastIndex = 0;
	var m = this.slicesRE.exec(text);
	while (m) {
		if (m[2])
			slices[m[2]] = m[3];
		else
			slices[m[5]] = m[6];
		m = this.slicesRE.exec(text);
	}
	return slices;
};

// Returns the slice of text of the given name
ArticleStore.prototype.getTiddlerSlice = function(title,sliceName) {
	var slices = this.slices[title];
	if (!slices) {
		slices = this.calcAllSlices(title);
		this.slices[title] = slices;
	}
	return slices[sliceName];
};

// Build an hashmap of the specified named slices of a tiddler
ArticleStore.prototype.getTiddlerSlices = function(title,sliceNames) {
	var t,r = {};
	for (t = 0; t < sliceNames.length; t++) {
		var slice = this.getTiddlerSlice(title,sliceNames[t]);
		if (slice)
			r[sliceNames[t]] = slice;
	}
	return r;
};

ArticleStore.prototype.suspendNotifications = function() {
	this.notificationLevel--;
};

ArticleStore.prototype.resumeNotifications = function() {
	this.notificationLevel++;
};

// Invoke the notification handlers for a particular tiddler
ArticleStore.prototype.notify = function(title, doBlanket) {
	if (! this.notificationLevel) {
	    var t;
		for (t = 0; t < this.namedNotifications.length; t++) {
			var n = this.namedNotifications[t];
			if ((n.name == null && doBlanket) || (n.name == title))
				n.notify(title);
		}
	}
};

// Invoke the notification handlers for all tiddlers
ArticleStore.prototype.notifyAll = function() {
	if (!this.notificationLevel) {
	    var t;
		for (t = 0; t < this.namedNotifications.length; t++) {
			var n = this.namedNotifications[t];
			if (n.name)
				n.notify(n.name);
		}
	}
};

// Add a notification handler to a tiddler
ArticleStore.prototype.addNotification = function(title, fn) {
	var i;
	for (i = 0; i < this.namedNotifications.length; i++) {
		if ((this.namedNotifications[i].name == title) && (this.namedNotifications[i].notify == fn))
			return this;
	}
	this.namedNotifications.push({name: title, notify: fn});
	return this;
};

ArticleStore.prototype.removeTiddler = function(title) {
	var tiddler = this.getArticle(title);
	if (tiddler) {
		this.deleteArticle(title);
		this.notify(title, true);
		this.setDirty(true);
	}
};

ArticleStore.prototype.setTiddlerTag = function(title, status, tag) {
	var tiddler = this.getArticle(title);
	if (tiddler) {
		var t = tiddler.tags.indexOf(tag);
		if (t != -1) tiddler.tags.splice(t,1);
		if (status) tiddler.tags.push(tag);
		tiddler.changed();
		tiddler.incChangeCount();
		this.notify(title,true);
		this.setDirty(true);
	}
};

ArticleStore.prototype.addTiddlerFields = function(title, fields) {
	var tiddler = this.getArticle(title);
	if (! tiddler)	return;
	merge(tiddler.fields,fields);
	tiddler.changed();
	tiddler.incChangeCount();
	this.notify(title,true);
	this.setDirty(true);
};

// Put an article into the store
ArticleStore.prototype.addOrUpdate = function(title, newTitle, newBody, modifier, modified, tags, fields, clearChangeCount, created, creator) {
	var article;
	if (title instanceof Tiddler) {
		article = title;
		title = article.title; // HACK: Implicite type change from Article to String
		newTitle = title;
	} else {
		article = this.getArticle(title);
		if (article) {
			created = created || article.created; // Preserve created date
			creator = creator || article.creator;
			this.deleteArticle(title);
		} else {
			created = created || modified;
			article = new Tiddler();
		}		
		article.set(newTitle, newBody, modifier, modified, tags, created, fields, creator);
	}
	this.addTiddler(article);
	if (clearChangeCount)
		article.clearChangeCount();
	else
		article.incChangeCount();
	if (title != newTitle) this.notify(title, true);
	this.notify(newTitle, true);
	this.setDirty(true);
	return article;
};

ArticleStore.prototype.incChangeCount = function(title) {
	var tiddler = this.getArticle(title);
	if (tiddler)
		tiddler.incChangeCount();
};

ArticleStore.prototype.getLoader = function() {
	if (! this.loader) this.loader = new TW21Loader();
	return this.loader;
};

ArticleStore.prototype.getSaver = function() {
	if (! this.saver) this.saver = new TW21Saver();
	return this.saver;
};

// Return all articles formatted as an HTML string
ArticleStore.prototype.allTiddlersAsHtml = function() {
	return this.getSaver().transformAllArticlesToDivs(store);
};

// Load articles of a Wiki from an HTML DIV element containing articles (e.g. "storeArea" or "internalArticles")
ArticleStore.prototype.loadFromDiv = function(divElement, noUpdate) {
	var articles = this.getLoader().loadArticles(divElement.childNodes, this);
	this.setDirty(false);
	if (! noUpdate)	for (var i = 0; i < articles.length; i++){ articles[i].changed(); }
};

// Load contents of a Wiki from a string
// Returns null if there's an error
ArticleStore.prototype.importAllArticlesFromHtmlSource = function(htmlSource) {
	var me = this;
	var storeAreaRange = locateStoreArea(htmlSource);
	if (! storeAreaRange)	return null;
	var content = "<" + "html><" + "body>" + htmlSource.substring(storeAreaRange[0], storeAreaRange[1] + storeAreaEndString.length) + "<" + "/body><" + "/html>";
	processHtmlSourceAsDocument(content, function(doc){
		var storeDiv = doc.getElementById("storeArea");
		me.loadFromDiv(storeDiv);	
	});
	return this;
};

function processHtmlSourceAsDocument(htmlSource, cb){
	var iframe = document.createElement("iframe"); // Create an iframe as tool for converting the htmlSource to a DOM
	iframe.style.display = "none";
	document.body.appendChild(iframe); // sonst ist aus "Sicherheitsgründen" contentDocument null
	var doc = iframe.contentDocument;
	doc.open();
	doc.writeln(htmlSource);
	doc.close();
	cb(doc);	
	iframe.parentNode.removeChild(iframe); // Get rid of the iframe
}

ArticleStore.prototype.updateTiddlers = function() {
	this.tiddlersUpdated = true;
	this.forEachArticle(function(title, article) {
		article.changed();
	});
};

// Returns a list of all tags in use
//   excludeTag - if present, excludes tags that are themselves tagged with excludeTag
// Returns an array of arrays where [tag][0] is the name of the tag and [tag][1] is the number of occurances
ArticleStore.prototype.getTags = function() {
	var results = [];
	this.forEachArticle(function(title, article) {
		for (var g = 0; g < article.tags.length; g++) {
			var tag = article.tags[g];
			var add = true;
			for (var c = 0; c < results.length; c++) {
				if (results[c][0] == tag) {
					add = false;
					results[c][1]++;
				}
			}			
			if (add) results.push([tag, 1]);
		}
	});
	results.sort(function(a,b) {return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : (a[0].toLowerCase() == b[0].toLowerCase() ? 0 : +1);});
	return results;
};

// Return an array of the articles that are tagged with a given tag
ArticleStore.prototype.getArticlesByTag = function(tag) {
	return this.getArticlesByField("tags", true, tag);
};

// Return an array of the articles that link to a given tiddler
ArticleStore.prototype.getReferringTiddlers = function(title, unusedParameter, sortField) {
	if (! this.tiddlersUpdated) this.updateTiddlers();
	return this.getArticlesByField("links", true, title, sortField);
};

// Return an array of the articles that do (or must not) have a specified value in the specified field
// If the field type is a collection, a match is found if lookupValue is present at least once in the collection.
// matchMode == true to select matching articles, false to select all others
// sortBy - Field name. May have a "+" or "-" prefix. Default: "title"
// optionalPredicate decides whether the article should be included in the result set
//
// Internal articles not supported.
ArticleStore.prototype.getArticlesByField = function(lookupField, matchMode, lookupValue, sortBy, includeInternal) {
	var results = [];
	this.forEachArticle(function(title, article) {
		if (includeInternal || ! article.isInternal()) {
			var include = ! matchMode;
			var values;
			if (["links", "tags"].contains(lookupField)) { // yoda
				values = article[lookupField];
			} else {
				var accessor = ArticleStore.standardFieldAccess[lookupField];
				if (accessor) {
					values = [accessor.get(article)];
				} else {
					values = article.fields[lookupField] ? [article.fields[lookupField]] : [""]; // Remeber: JS interprets an empty string as "false", so the right part will be executed!
				}
			}
			for (var i = 0; i < values.length; i++) {
				if (values[i] == lookupValue){
					include = matchMode;
					break;
				}
			}
			if (include) results.push(article);
		}
	});
	if (! sortBy) sortBy = "title";
	return this.sortTiddlers(results, sortBy);
};

/**
		* Gets a (sorted) collection of articles without those carrying the excludeTag.
		*
		* @param {string} sortBy     - Field name. Must be a hard coded field. May NOT have a "+" or "-" prefix. Default: Unsorted.
		* @param {string} excludeTag - Filter out articles by this tag.
		*
		* @return {array} - Array of articles.
	*/
ArticleStore.prototype.getArticlesQuickly = function(sortBy, includeInternal) {
	var results = [];
	this.forEachArticle(function(title, article) {
		if (includeInternal || ! article.isInternal()) {
			results.push(article);
		}
	});
	if (sortBy) results.sort(function(a,b) {return a[sortBy] < b[sortBy] ? -1 : (a[sortBy] == b[sortBy] ? 0 : +1);});
	return results;
};

// Return array of names of tiddlers that are referred to but not defined
ArticleStore.prototype.getMissingLinks = function() {
	if (! this.tiddlersUpdated) this.updateTiddlers();
	var results = [];
	this.forEachArticle(function (title, tiddler) {
		if (tiddler.isTagged("excludeMissing") || tiddler.isTagged("systemConfig")) return; // aaa
		var n;
		for (n = 0; n < tiddler.links.length; n++) {
			var link = tiddler.links[n];
			if (this.getArticleTextPartOrSlice(link, null) == null && ! isShadowTiddler(link) && !config.macros[link]) results.pushUnique(link);
		}
	});
	results.sort();
	return results;
};

// Return an array of names of tiddlers that are defined but not referred to
ArticleStore.prototype.getOrphans = function() {
	var results = [];
	this.forEachArticle(function (title, article) {
		if (this.getReferringTiddlers(title).length == 0 && ! article.isInternal()) results.push(title);
	});
	results.sort();
	return results;
};

ArticleStore.prototype.getPlugins = function() {
	var results = [];
	this.forEachArticle(function (title, article) {
		if (article.kind == "!") results.push(article);
	});
	results.sort(function(a,b) {return a.title < b.title ? -1 : (a.title == b.title ? 0 : 1);});
	return results;
}

ArticleStore.prototype.getResourceTitles = function() {
	var results = [];
	this.forEachArticle(function (title, article) {
		if (article.kind == "$") results.push(title);
	});
	results.sort();
	return results;
}

// Return an array of names of all the shadow tiddlers
ArticleStore.prototype.getShadowed = function() {
	var t,results = [];
	for (t in config.internalArticles) {
		if (isShadowTiddler(t))	results.push(t); // xxx if statement is always true
	}
	results.sort();
	return results;
};

// Return an array of tiddlers that have been touched since they were downloaded or created
ArticleStore.prototype.getTouched = function() {
	var results = [];
	this.forEachArticle(function(title, tiddler) {
		if (tiddler.isTouched())
			results.push(tiddler);
		});
	results.sort();
	return results;
};

// Resolves a Tiddler reference or tiddler title into a Tiddler object, or null if it doesn't exist
ArticleStore.prototype.resolveTiddler = function(articleOrTitle) {
	var t = (typeof articleOrTitle == "string") ? this.getArticle(articleOrTitle) : articleOrTitle;
	return t instanceof Tiddler ? t : null;
};

// Sort an array of articles. 
// sortBy - Field name. May have a "+" or "-" prefix
ArticleStore.prototype.sortTiddlers = function(articles, sortBy) {
	var asc = +1;
	switch(sortBy.substr(0,1)) {
	case "-":
		asc = -1;
		sortBy = sortBy.substr(1);
		break;
	case "+":
		sortBy = sortBy.substr(1);
		break;
	}
	if (ArticleStore.standardFieldAccess[sortBy]) {
		if (sortBy == "title") {
			articles.sort(function(a,b) {return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -asc : (a[sortBy].toLowerCase() == b[sortBy].toLowerCase() ? 0 : asc);});
		} else {
			articles.sort(function(a,b) {return a[sortBy] < b[ sortBy] ? -asc : (a[sortBy] == b[sortBy] ? 0 : asc);});
		}
	} else {
		articles.sort(function(a,b) {return a.fields[sortBy] < b.fields[sortBy] ? -asc : (a.fields[sortBy] == b.fields[sortBy] ? 0 : +asc);});
	}
	return articles;
};
