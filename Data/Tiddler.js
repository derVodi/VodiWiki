//--
//-- Tiddler() object
//--

function Tiddler(title) {
	this.title = title;
	this.text = "";
	this.creator = null;
	this.modifier = null;
	this.created = new Date();
	this.modified = this.created;
	this.links = [];
	this.linksUpdated = false;
	this.tags = [];
	this.fields = {}; // changecount parenttitle - coming from EditTemplate, consumed by transformArticleToDiv
	return this;
}

Tiddler.prototype.getLinks = function() {
	if (this.linksUpdated==false)
		this.changed();
	return this.links;
};

// Increment the changeCount of a tiddler
Tiddler.prototype.incChangeCount = function() {
	var c = this.fields['changecount'];
	c = c ? parseInt(c, 10) : 0;
	this.fields['changecount'] = String(c + 1);
};

// Clear the changeCount of a tiddler
Tiddler.prototype.clearChangeCount = function() {
	if (this.fields['changecount']) {
		delete this.fields['changecount'];
	}
};

// Returns true if the tiddler has been updated since the tiddler was created or downloaded
Tiddler.prototype.isTouched = function() {
	var changecount = this.fields.changecount || 0;
	return changecount > 0;
};

// Change the text and other attributes of a tiddler
Tiddler.prototype.set = function(title, text, modifier, modified, tags, created, fields, creator) {
	this.assign(title, text, modifier, modified, tags, created, fields, creator);
	this.changed();
	return this;
};

// Change the text and other attributes of a tiddler without triggered a tiddler.changed() call
Tiddler.prototype.assign = function(title, text, modifier, modified, tags, created, fields, creator) {
	if (title != undefined)	this.title = title;
	if (text != undefined) this.text = text;
	if (modifier != undefined) this.modifier = modifier;
	if (modified != undefined) this.modified = modified;
	if (creator != undefined) this.creator = creator;
	if (created != undefined) this.created = created;
	if (fields != undefined) this.fields = fields;
	
	if (tags != undefined) {
		this.tags = (typeof tags == "string") ? tags.readBracketedList() : tags;
	} else if (this.tags == undefined) {
		this.tags = [];
	}
	return this;
};

// Get the tags as a string tuple (space delimited, using [[brackets]] for tags containing spaces)
// E.g. "foo [[uh oh]] bar"
Tiddler.prototype.getTagsTuple = function() {
	return String.buildInternalLinksTuple(this.tags);
};

// Test if an article carries a tag
Tiddler.prototype.isTagged = function(tag) {
	return this.tags.indexOf(tag) != -1;
};

// Static method to convert "\n" to newlines, "\s" to "\"
Tiddler.unescapeLineBreaks = function(text) {
	return text ? text.unescapeLineBreaks() : "";
};

// Convert newlines to "\n", "\" to "\s"
Tiddler.prototype.escapeLineBreaks = function() {
	return this.text.escapeLineBreaks();
};

// Updates the secondary information (like links[] array, containing titles of linked articles) after a change to a tiddler
Tiddler.prototype.changed = function() {
	this.links = [];
	var text = this.text;
	// remove 'quoted' text before scanning tiddler source
	text = text.replace(/\/%((?:.|\n)*?)%\//g,"").
		replace(/\{{3}((?:.|\n)*?)\}{3}/g,"").
		replace(/"""((?:.|\n)*?)"""/g,"").
		replace(/<nowiki\>((?:.|\n)*?)<\/nowiki\>/g,"").
		replace(/<html\>((?:.|\n)*?)<\/html\>/g,"").
		replace(/<script((?:.|\n)*?)<\/script\>/g,""
	);
	var tiddlerLinkRegExp = config.textPrimitives.tiddlerForcedLinkRegExp;
	tiddlerLinkRegExp.lastIndex = 0;
	var formatMatch = tiddlerLinkRegExp.exec(text);
	while (formatMatch) {
		var lastIndex = tiddlerLinkRegExp.lastIndex;
		var targetTitle = null;
		if (formatMatch[1] && !config.formatterHelpers.isExternalLink(formatMatch[2]))	{ // labeledBrackettedLink
			targetTitle = formatMatch[2];
		} else if (formatMatch[3] && formatMatch[3] != this.title) { // brackettedLink
			targetTitle = formatMatch[3];
		}
		if (targetTitle){
			targetTitle = targetTitle.split(config.textPrimitives.sectionSeparator)[0]; // remove section (e.g. "foo##bar" => "foo" or "##bar" => "")
			if (targetTitle.length) this.links.pushUnique(targetTitle); 
		}
		tiddlerLinkRegExp.lastIndex = lastIndex;
		formatMatch = tiddlerLinkRegExp.exec(text);
	}
	this.linksUpdated = true;
};

Tiddler.prototype.isReadOnly = function() {
	return readOnly;
};
