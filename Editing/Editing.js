config.commands.saveTiddler.handler = function(event, src, title) { // Implements ICommand.handler()
	var newTitle = story.acceptChanges(title); // todo - wieso kann sich title ändern?
	if (newTitle) story.showArticle(newTitle);
	return false;
};

config.commands.saveTiddler.hijackedHandler = config.commands.saveTiddler.handler; // ToDo: patch the base method instead of hijacking

config.commands.saveTiddler.handler = function(event, src, title) { // Implements ICommand.handler()
	var pos = story.getTiddlerField(title, "text").selectionStart;
	var baseResult = config.commands.saveTiddler.hijackedHandler(event, src, title);
	story.getArticleViewByTitle(title).rescuedCaretPosition = pos;
	return baseResult;
};

config.commands.cancelTiddler.handler = function(event, src, title) { // Implements ICommand.handler()
	if (story.hasChanges(title) && ! readOnly) {
		if (! confirm(this.warning.format([title])))
			return false;
	}
	story.setDirty(title, false);
	story.showArticle(title);
	return false;
};

config.commands.deleteTiddler.handler = function(event, src, title) { // Implements ICommand.handler()
	var deleteIt = true;
	if (config.options.chkConfirmDelete)
		deleteIt = confirm(this.warning.format([title]));
	if (deleteIt) {
		store.removeTiddler(title);
		story.closeView(title);
		autoSaveChanges();
	}
	return false;
};
