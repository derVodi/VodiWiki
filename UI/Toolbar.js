//--
//-- Tiddler toolbar
//--

config.macros.toolbar.renderCommandButton = function(place, commandName, tiddler, className) {
	if (tiddler instanceof Tiddler) {
		var command = config.commands[commandName];
		if (command.isEnabled ? command.isEnabled(tiddler) : this.isCommandEnabled(command, tiddler)) {
			var text = command.getText ? command.getText(tiddler) : this.getCommandText(command, tiddler);
			var tooltip = command.getTooltip ? command.getTooltip(tiddler) : this.getCommandTooltip(command, tiddler);
			var cmd = command.type == "popup" ? this.onClickPopup : this.onClickCommand;
			var btn = renderTiddlyButton(null, text, tooltip, cmd);
			btn.setAttribute("commandName",commandName);
			btn.setArticleTitle(tiddler.title);
			jQuery(btn).addClass("command_" + commandName);
			if (className)
				jQuery(btn).addClass(className);
			place.appendChild(btn);
		}
	}
};

config.macros.toolbar.isCommandEnabled = function(command, tiddler) {
	var title = tiddler.title;
	var ro = tiddler.isReadOnly();
	var shadow = (title) && !store.tiddlerExists(title);
	return (!ro || (ro && !command.hideReadOnly)) && !(shadow && command.hideShadow);
};

config.macros.toolbar.getCommandText = function(command,tiddler) {
	return (tiddler.isReadOnly() && command.readOnlyText) || command.text;
};

config.macros.toolbar.getCommandTooltip = function(command, tiddler) {
	return (tiddler.isReadOnly() && command.readOnlyTooltip) || command.tooltip;
};

config.macros.toolbar.onClickCommand = function(ev) {
	var e = ev || window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
	var command = config.commands[this.getAttribute("commandName")];
	return command.handler(e, this, this.getArticleTitle()); // Expects ICommand.handler()
};

config.macros.toolbar.onClickPopup = function(ev) {
	var e = ev || window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
	var popup = Popup.create(this);
	var command = config.commands[this.getAttribute("commandName")];
	var title = this.getArticleTitle();
	popup.setArticleTitle(title);
	command.handlePopup(popup, title);
	Popup.show();
	return false;
};

// Invoke the first command encountered from a given place that is tagged with a specified class
config.macros.toolbar.invokeCommand = function(place, className, event) {
	var children = place.getElementsByTagName("a");
	var t;
	for (t = 0; t < children.length; t++) {
		var c = children[t];
		if (jQuery(c).hasClass(className) && c.getAttribute && c.getAttribute("commandName")) {
			if (c.onclick instanceof Function)
				c.onclick.call(c, event);
			break;
		}
	}
};

config.macros.toolbar.onClickMore = function(ev) {
	var e = this.nextSibling;
	e.style.display = "inline";
	this.style.display = "none";
	return false;
};

config.macros.toolbar.onClickLess = function(ev) {
	var e = this.parentNode;
	var m = e.previousSibling;
	e.style.display = "none";
	m.style.display = "inline";
	return false;
};

/**
	* This is the macro resolving handler for the "toolbar" macro. 
	* It will render toolbar buttons from an array of command names.
	*
	* @param {element}  place       - The target dom element (toolbar div), into which the toolbar buttons will be rendered.
	* @param {string}   macroName   - Always "toolbar".
	* @param {string}   wikifier    - Always null.
	* @param {string[]} params      - The command names to be rendered (as array).
	* @param {string}   paramString - The command names to be rendered (as unparsed string).
	* @param {Object}   tiddler     - The article for which the toolbar should be effecitve.
*/
config.macros.toolbar.handler = function(place, macroName, params, wikifier, paramString, tiddler) { // Implements IMacroResolver.handler()
	var i;
	for (i = 0; i < params.length; i++) {
		var btn;
		var commandName = params[i];
		switch (commandName) {
		case "!":
			createTiddlyText(place, this.separator);
			break;
		case "*":
			createTiddlyElement(place,"br");
			break;
		case "<":
			btn = renderTiddlyButton(place, this.lessLabel, this.lessPrompt, config.macros.toolbar.onClickLess);
			jQuery(btn).addClass("lessCommand");
			break;
		case ">":
			btn = renderTiddlyButton(place, this.moreLabel, this.morePrompt, config.macros.toolbar.onClickMore);
			jQuery(btn).addClass("moreCommand");
			var e = createTiddlyElement(place,"span",null,"moreCommand");
			e.style.display = "none";
			place = e;
			break;
		default:
			var className = "";
			switch (commandName.substr(0,1)) {
			case "+":
				className = "defaultCommand"; // ToDo: Get rid of the default command
				commandName = commandName.substr(1);
				break;
			case "-":
				className = "cancelCommand";
				commandName = commandName.substr(1);
				break;
			}
			if (config.commands[commandName]) {
				this.renderCommandButton(place, commandName, tiddler, className);
			} else {
				this.customCommand(place, commandName, wikifier, tiddler);
			}
			break;
		}
	}
};

// Overrideable function to extend toolbar handler
config.macros.toolbar.customCommand = function(place,command,wikifier,tiddler) {
};
