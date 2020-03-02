config.macros.navigate = {};

config.macros.navigate.handler = function(place, macroName, params) { // Implements IMacroResolver.handler()
	renderTiddlyButton(place, '←', "Navigate Backwards", function() {config.commands.navigateBack.handler();},	null, null, null);
	renderTiddlyButton(place, '→', "Navigate Foward", function() {config.commands.navigateForward.handler();},	null, null, null);
};

config.commands.navigateBack = {
	text: 'Back',
	tooltip: 'View the previous page.',
	handler: function(event, src, title) { // Implements ICommand.handler()
		story.history.back();
		return false;
	}
};

config.commands.navigateForward = {
	text: 'Forward',
	tooltip: 'View the previous page.',
	handler: function(event, src, title) { // Implements ICommand.handler()
		story.history.forward();
		return false;
	}
};
