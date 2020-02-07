merge(config.macros.plugins, {
	wizardTitle: "Manage plugins",
	step1Title: "Currently loaded plugins",
	step1Html: "<input type='hidden' name='listViewPlaceholder'></input>", // DO NOT TRANSLATE
	skippedText: "(This plugin has not been executed because it was added since startup)",
	noPluginText: "There are no plugins installed",
	confirmDeleteText: "Are you sure you want to delete these plugins:\n\n%0",
	removeLabel: "Remove systemConfig Tag", // xxx
	removePrompt: "Remove systemConfig tag",
	deleteLabel: "Delete",
	deletePrompt: "Delete these tiddlers forever",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Description", type: 'String'},
			{name: 'Version', field: 'Version', title: "Version", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Size", type: 'Size'},
			{name: 'Disabled', field: 'disabled', title: "Disabled", tag: 'systemConfigDisable', type: 'TagCheckbox'},
			{name: 'Executed', field: 'executed', title: "Loaded", type: 'Boolean', trueText: "Yes", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Startup Time", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Error", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
		],
		rowClasses: [
			{className: 'error', field: 'error'}
		]
	},
	listViewTemplateReadOnly: {
		columns: [
			{name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'Tiddler'},
			{name: 'Description', field: 'Description', title: "Description", type: 'String'},
			{name: 'Version', field: 'Version', title: "Version", type: 'String'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Size", type: 'Size'},
			{name: 'Executed', field: 'executed', title: "Loaded", type: 'Boolean', trueText: "Yes", falseText: "No"},
			{name: 'Startup Time', field: 'startupTime', title: "Startup Time", type: 'String'},
			{name: 'Error', field: 'error', title: "Status", type: 'Boolean', trueText: "Error", falseText: "OK"},
			{name: 'Log', field: 'log', title: "Log", type: 'StringList'}
		],
		rowClasses: [
			{className: 'error', field: 'error'}
		]
	}
});

config.macros.plugins.handler = function(place, macroName, params, wikifier, paramString) { // Implements IMacroResolver.handler()
	var presenter = new WizardPresenter();
	presenter.renderNewView(place, this.wizardTitle);
	presenter.renderBodyContent(this.step1Title, this.step1Html);
	
	// Resolve list view placeholder (preparation, will not yet render the actual list)
	
	var listViewPlaceholder = presenter.getElement("listViewPlaceholder");
	var listWrapper = document.createElement("div");
	listViewPlaceholder.parentNode.insertBefore(listWrapper, listViewPlaceholder);
	listWrapper.setAttribute("refresh", "macro");
	listWrapper.setAttribute("macroName", "plugins");
	listWrapper.setAttribute("params", paramString);
	
	this.refresh(listWrapper, paramString);
};

config.macros.plugins.refresh = function(listWrapper, params) {
	var me = config.macros.plugins;
	var presenter = new WizardPresenter(listWrapper);
	var selectedTitles = [];
	ListView.forEachSelectedCheckbox(listWrapper, function(checkbox, rowName) {
		if (checkbox.checked) selectedTitles.push(checkbox.getAttribute("rowName"));
	});
	jQuery(listWrapper).empty();
	params = params.parseParams("anon");
	var pluginInfos = installedPlugins.slice(0); // .slice(0) is argot for creating a shallow copy of the array.
	var t, tiddler, p;
	
	// Search for unloaded plugins and add them to the pluginInfos list
	
	var configTiddlers = store.getArticlesByTag("systemConfig");	
	for (t = 0; t < configTiddlers.length; t++) {
		tiddler = configTiddlers[t];
		if (pluginInfos.findByField("title", tiddler.title) == null) {
			p = getPluginInfo(tiddler);
			p.executed = false;
			p.log.splice(0, 0, this.skippedText);
			pluginInfos.push(p);
		}
	}
	
	for (t = 0; t < pluginInfos.length; t++) {
		p = pluginInfos[t];
		p.size = p.tiddler.text ? p.tiddler.text.length : 0;		
		p.disabled = p.tiddler.isTagged("systemConfigDisable");
		p.Selected = selectedTitles.indexOf(pluginInfos[t].title) != -1;
	}
	if (pluginInfos.length == 0) {
		createTiddlyElement(listWrapper, "em", null, null, this.noPluginText);
		presenter.renderFooterContent([]);
	} else {
		var template = readOnly ? this.listViewTemplateReadOnly : this.listViewTemplate;
		var listView = ListView.create(listWrapper, pluginInfos, template, this.onSelectCommand);
		presenter.setValue("listView", listView);
		if (!readOnly) {
			presenter.renderFooterContent([
				{caption: me.removeLabel, tooltip: me.removePrompt, onClick: me.doRemoveTag},
				{caption: me.deleteLabel, tooltip: me.deletePrompt, onClick: me.doDelete}
			]);
		}
	}
};

config.macros.plugins.doRemoveTag = function(e) {
	var presenter = new WizardPresenter(this);
	var listView = presenter.getValue("listView");
	var rowNames = ListView.getSelectedRows(listView);
	if (rowNames.length == 0) {
		alert(config.messages.nothingSelected);
	} else {
		for (var i = 0; i < rowNames.length; i++) {
			store.setTiddlerTag(rowNames[i], false, "systemConfig");
		}
		autoSaveChanges();
	}
};

config.macros.plugins.doDelete = function(e) {
	var wizard = new WizardPresenter(this);
	var listView = wizard.getValue("listView");
	var rowNames = ListView.getSelectedRows(listView);
	if (rowNames.length == 0) {
		alert(config.messages.nothingSelected);
	} else {
		if (confirm(config.macros.plugins.confirmDeleteText.format([rowNames.join(", ")]))) {
			for (i = 0; i < rowNames.length; i++) {
				store.removeTiddler(rowNames[i]);
				story.closeView(rowNames[i]);
			}
		}
		autoSaveChanges();
	}
};
