function blobToNewArticle(blob, cb){
	blobToDataUrlAsync(blob, function(dataUrl){
		article = new Tiddler();
		var now = new Date();
		var title = now.convertToYYYYMMDDHHMMSSMMM();
		article.set(title, dataUrl, config.views.wikified.defaultModifier, now, null, now);
		article.kind = "$";
		store.addTiddler(article);
		if (cb) cb(title, article);
	});
}

config.macros.licenseText = {};

config.macros.licenseText.handler = function(place) { // Implements IMacroResolver.handler()
	var s = createTiddlyElement(place, "span", null, "licenseText");
	s.innerHTML =  document.querySelector('meta[name="copyright"]').content.lineBreaksToBr();
};

config.macros.version.handler = function(place) { // Implements IMacroResolver.handler()
	jQuery("<span/>").text(formatVersion()).appendTo(place);
};

config.macros.today.handler = function(place, macroName, params) { // Implements IMacroResolver.handler()
	var now = new Date();
	var text = params[0] ? now.formatString(params[0].trim()) : now.toLocaleString();
	jQuery("<span/>").text(text).appendTo(place);
};
