config.commands.startEditing.handler = function(event, src, title) { // Implements ICommand.handler()

	var articleView;

	if (title){
		articleView = story.getArticleViewByTitle(title);
	} else {
		articleView = story.getCurrentArticleView();
		title = articleView ? articleView.getArticleTitle() : null;
	}

	if (! articleView || story.isDirty(title)) return;

	clearMessage();
		
	// Selected text: Count the number of occurances of the selected text until we reach the actually selected element
	recurseViewerOccurance = 0;
	var found = -1;
	var selectedText = window.getSelection().toString();
	if (selectedText.length) {
		var articleContentContainer = null;
		for (var i = 0; i < articleView.childNodes.length; i++) {
			if (articleView.childNodes[i].className == "articleContentContainer") { // HACK: Code dependency to CSS class name!
				articleContentContainer = articleView.childNodes[i];
				break;
			}
		}		
		recurseViewer(articleContentContainer, window.getSelection().anchorNode, selectedText);
	}

	var article = store.getArticle(title);
	if (article) article.rescuedScrollTop = articleView.scrollTop;
	
	//var fields = articleView.getAttribute("tiddlyFields");
	var fields = null;
	
	story.showArticle(title, DEFAULT_EDIT_TEMPLATE, fields);
	
	var textAreaElement = story.getTiddlerField(title, "text");	
	textAreaElement.onpaste = onPasted;
	
	// Selected text: Reconstruct the selection by locating the n-th occurance of the formerly selected text
	if (recurseViewerOccurance) {		
		found = -1;
		do {
			recurseViewerOccurance--;
			found = textAreaElement.value.indexOf(selectedText, found + 1);
		} while (recurseViewerOccurance && found >= 0)
	}
	if (found > -1) {
		setCaretPosition(textAreaElement, found);
	} else {
		setCaretPosition(textAreaElement, (articleView.rescuedCaretPosition ? articleView.rescuedCaretPosition : 0));
	}
	
	return false;
}

function insertAtCursor(input, textToInsert) {
  // get current text of the input
  const value = input.value;

  // save selection start and end position
  const start = input.selectionStart;
  const end = input.selectionEnd;

  // update the value with our text inserted
  input.value = value.slice(0, start) + textToInsert + value.slice(end);

  // update cursor to be at the end of insertion
  input.selectionStart = input.selectionEnd = start + textToInsert.length;
}

config.commands.finishEditing.handler = function(event, src, title) { // Implements ICommand.handler()
	var newTitle = story.acceptChanges(title); // todo - wieso kann sich title ändern?
	if (newTitle) story.showArticle(newTitle);
	return false;
};

config.commands.finishEditing.hijackedHandler = config.commands.finishEditing.handler; // ToDo: patch the base method instead of hijacking

config.commands.finishEditing.handler = function(event, src, title) { // Implements ICommand.handler()
	var pos = story.getTiddlerField(title, "text").selectionStart;
	var baseResult = config.commands.finishEditing.hijackedHandler(event, src, title);
	story.getArticleViewByTitle(title).rescuedCaretPosition = pos;
	return baseResult;
};

config.commands.cancelEditing.handler = function(event, src, title) { // Implements ICommand.handler()
	if (story.hasChanges(title) && ! readOnly) {
		if (! confirm(this.warning.format([title]))) return false;
	}
	story.setDirty(title, false);
	story.showArticle(title);
	return false;
};

config.commands.cancelEditing.handlerBase = config.commands.cancelEditing.handler; // ToDo: patch the base method instead of hijacking

config.commands.cancelEditing.handler = function(event, src, title) { // Implements ICommand.handler()
	var pos = story.getTiddlerField(title,"text").selectionStart;
	var baseResult = config.commands.cancelEditing.handlerBase(event, src, title);
	story.getArticleViewByTitle(title).rescuedCaretPosition = pos;
	return baseResult;
};

config.commands.deleteArticle.handler = function(event, src, title) { // Implements ICommand.handler()
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
