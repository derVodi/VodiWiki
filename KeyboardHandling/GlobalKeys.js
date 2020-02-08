// Global Keyboard Handling

window.onkeydown = function(e) {
	if (e.ctrlKey && e.keyCode == 69) { // [Ctrl]-[E]
		var searchField = document.getElementsByClassName('searchField')[0];
		if (! searchField.onkeypress) {
			searchField.onkeypress = function(e) { // todo patch this directly into search code
				if (e.keyCode == 13) {
					// document.getElementsByClassName('yourSearchTitle')[0].firstChild.focus();
					var foundTiddlers = abego.YourSearch.getFoundTiddlers();
					story.showArticle(foundTiddlers[0].title);
					abego.YourSearch.closeResult();
					return false;
				};
			};
		}
		searchField.focus();
		searchField.select();
		return false;
	}
	if (e.ctrlKey && e.keyCode == 13) { // [Ctrl]-[Enter]
		config.commands.editTiddler.handler(e);  // Expects ICommand.handler()
    return false;
  };
};
