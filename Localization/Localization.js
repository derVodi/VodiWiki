//--
//-- Translateable strings
//--

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone

merge(config.tasks, {
	save: {text: "File", tooltip: "New, Save, ...", content: '<<fileTasks>>'},
	importTask: {text: "Import", tooltip: "Import content and plugins from other wiki files and servers", content: '<<importTiddlers>>'},
	tweak: {text: "Tweak", tooltip: "Tweak some options", content: '<<options>>'},
	upgrade: {text: "About / Upgrade", tooltip: "Upgrade integrated viewer and editor", content: '<<upgrade>>'},
	plugins: {text: "Plugins", tooltip: "Manage installed plugins", content: '<<plugins>>'}
});

// Options that can be set in the options panel and/or cookies
merge(config.optionsDesc, {
	chkAutoSave: "Automatically save changes",
	chkRegExpSearch: "Enable regular expressions for searches",
	chkCaseSensitiveSearch: "Case-sensitive searching",
	chkIncrementalSearch: "Incremental key-by-key searching",
	chkOpenInNewWindow: "Open external links in a new window",
	chkToggleLinks: "Clicking on links to open tiddlers causes them to close",
	chkHttpReadOnly: "Hide editing features when viewed over HTTP",
	chkConfirmDelete: "Require confirmation before deleting tiddlers",
	txtBackupFolder: "Name of folder to use for backups",
	txtFileSystemCharSet: "Default character set for saving changes (Firefox/Mozilla only)",
	txtMaxEditRows: "Maximum number of rows in edit boxes",
	txtTheme: "Name of the theme to use",
	txtUserName: "Username for signing your edits",
	txtWikiTitle: "The title of the wiki (used as window title)."
});

merge(config.messages,{
	customConfigError: "Problems were encountered loading plugins. See PluginManager for details",
	pluginError: "Error: %0",
	pluginDisabled: "Not executed because disabled via 'systemConfigDisable' tag",
	nothingSelected: "Nothing is selected. You must select one or more items first",
	savedSnapshotError: "It appears that this Wiki has been incorrectly saved. Please see http://www.tiddlywiki.com/#Download for details",
	externalLinkTooltip: "External link to %0",
	noTags: "There are no tags",
	cantSaveError: "It's not possible to save changes. Possible reasons include:\n- your browser doesn't support saving (Firefox, Internet Explorer, Safari and Opera all work if properly configured)\n- the pathname to your Wiki file contains illegal characters\n- the Wiki HTML file has been moved or renamed",
	invalidFileError: "The original file '%0' does not appear to be a valid Wiki",
	emptySaved: "Empty Wiki created in your download location.",
	emptyFailed: "Failed to create empty Wiki file",
	mainSavedViaDownload: "Wiki saved via download.\nFor better saving download and run VodiWikiSaver.",
	mainDownloadManual: "RIGHT CLICK HERE to download/save main Wiki file",
	macroError: "Error in macro <<%0>>",
	macroErrorDetails: "Error while executing macro <<%0>>:\n%1",
	missingMacro: "No such macro",
	overwriteWarning: "A tiddler named '%0' already exists. Choose OK to overwrite it",
	unsavedChangesWarning: "WARNING! There are unsaved changes in Wiki\n\nChoose OK to save\nChoose CANCEL to discard",
	confirmExit: "--------------------------------\n\nThere are unsaved changes in Wiki. If you continue you will lose those changes\n\n--------------------------------",
	unsupportedTWFormat: "Unsupported Wiki format '%0'",
	tiddlerSaveError: "Error when saving tiddler '%0'",
	tiddlerLoadError: "Error when loading tiddler '%0'",
	wrongSaveFormat: "Cannot save with storage format '%0'. Using standard format for save.",
	invalidFieldName: "Invalid field name %0",
	fieldCannotBeChanged: "Field '%0' cannot be changed",
	invalidCookie: "Invalid cookie '%0'"
});

config.messages.dates.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
config.messages.dates.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
config.messages.dates.shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st","nd","rd","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","st","nd","rd","th","th","th","th","th","th","th","st"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

merge(config.messages.tiddlerPopup,{});

merge(config.views.wikified.tag,{
	labelNoTags: "no tags",
	labelTags: "tags: ",
	tooltip: "Show articles tagged with '%0'",
	popupNone: "No other articles tagged with '%0'"
});

merge(config.views.wikified,{
	defaultText: "The article '%0' doesn't yet exist. Click 'Edit' to create it",
	defaultModifier: "(missing)",
	shadowModifier: "(built-in shadow tiddler)",
	dateFormat: "DD MMM YYYY",
	createdPrompt: "created"
});

merge(config.views.editor,{
	tagHint: "Type tags separated with spaces, [[use double square brackets]] if necessary, or add existing "
});

merge(config.views.editor.tagChooser,{
	text: "Tags",
	hint: "Choose existing tags to add to this tiddler",
	popupNone: "There are no tags defined",
	tagTooltip: "Add the tag '%0'"
});

merge(config.messages,{
	sizeTemplates: [
		{unit: 1024*1024*1024, template: "%0\u00a0GB"},
		{unit: 1024*1024, template: "%0\u00a0MB"},
		{unit: 1024, template: "%0\u00a0KB"},
		{unit: 1, template: "%0\u00a0B"}
	]
});

merge(config.macros.timeline, {
	dateFormat: "DD MMM YYYY"
});

merge(config.macros.allTags, {
	tooltip: "Show articles tagged with '%0'",
	noTags: "There are no tagged articles"
});

merge(config.macros.saveChanges, {
	label: "save changes",
	hint: "Save all articles to create a new Wiki",
	accessKey: "S"
});

config.macros.fileTasks = {};

config.macros.fileTasks.handler = function(place, macroName, params, wikifier, paramString) { // Implements IMacroResolver.handler()
	renderTiddlyButton(place, "New", "Create and save an empty wiki file.", function(e){createEmptyWikiAction();}, null, null, null, null, "📄")
	renderTiddlyButton(place, "Save", "Automatically find the best save method.", function(e){saveChangesAction();}, null, null, null, null, "💾")
	renderTiddlyButton(place, "Save Manually...", "Create a download link (in case normal saving doesn't work).", function(e){saveChangesAction(true);}, null, null, null, null, "⤓")
}

merge(config.macros.options, {
	wizardTitle: "Tweak advanced options",
	step1Title: "These options are saved in the wiki file itself.",
	step1Html: "<input id='chkUnknown' name='chkUnknown' type='checkbox' checked='false'/><label for='chkUnknown'>Show undocumented options</label><br/><input type='hidden' name='listViewPlaceholder'/>",
	unknownDescription: "//(unknown)//",
	listViewTemplate: {
		columns: [
			{name: 'Name', field: 'name', title: "Name", type: 'String'},
			{name: 'Option', field: 'option', title: "Option", type: 'String'},
			{name: 'Description', field: 'description', title: "Description", type: 'WikiText'}
		],
		rowClasses: []
	}
});

merge(config.macros.toolbar,{
	moreLabel: "…",
	morePrompt: "Show additional commands",
	lessLabel: "«",
	lessPrompt: "Hide additional commands",
	separator: "|"
});

merge(config.macros.refreshDisplay,{
	label: "refresh",
	hint: "Redraw the entire Wiki display"
});

merge(config.macros.importTiddlers,{
	readOnlyWarning: "You cannot import into a read-only Wiki file. Try opening it from a file:// URL",
	wizardTitle: "Import articles from another wiki file",
	step1Title: "Step 1: Locate the file",
	step1Html: "<input type='file' size=50 name='choseFileButton'>",
	openLabel: "Inspect...",
	openPrompt: "List up the articles of the chosen wiki.",
	cancelLabel: "Cancel",
	cancelPrompt: "Cancel this import",
	statusRetrievingArticleList: "Retrieving the list of available articles",
	errorRetrievingArticleListFromFile: "Error retrieving article list from local file!",
	step2Title: "Step 2: Choose the Articles to import",
	step2Html: "<input type='hidden' name='listViewPlaceholder'></input>",
	importLabel: "Import",
	importPrompt: "Import these Articles",
	confirmOverwriteText: "Are you sure you want to overwrite these Articles:\n\n%0",
	step3Title: "Step 3: Importing %0 article(s)",
	step3Html: "<input type='hidden' name='markReport'></input>", // DO NOT TRANSLATE
	doneLabel: "Done",
	donePrompt: "Close this wizard",
	statusDoingImport: "Importing articles",
	statusDoneImport: "All articles imported",
	listViewTemplate: {
		columns: [
			{name: 'Selected', field: 'Selected', rowName: 'title', type: 'Selector'},
			{name: 'Tiddler', field: 'tiddler', title: "Title", type: 'Tiddler'},
			{name: 'Size', field: 'size', tiddlerLink: 'size', title: "Size", type: 'Size'},
			{name: 'Tags', field: 'tags', title: "Tags", type: 'Tags'}
		],
		rowClasses: []
	}
});

merge(config.macros.upgrade,{
	wizardTitle: "VodiWiki",
	step1Title: "About",
	step1Html:
		"VodiWiki is a single page application developed and maintained by Mark Vodicka (<a href='http://www.vodi.de/VodiWiki/' target='_blank'>www.vodi.de</a>).<br/>" +
		"It contains parts of Jeremy Ruston's TiddlyWiki, abego Software's YourSearchPlugin.<br/><br/>" +
		"<h1>License</h1><span macro=\"licenseText\"></span><br/><br/>" +
		"<h1>Check for Upgrade (This Version: <span macro=\"version\"></span>)</h1>" +
		"Hitting the button will check for an update of the integrated viewer and editor.<br/>"+
		"Your content will be preserved.<br/>"+
	  "(Update source: <a href='%0' class='externalLink' target='_blank'>%0</a>).",
	errorNotSaved: "You must save changes before you can perform an upgrade",
	step2Title: "Confirm",
	step2Html_downgrade: "You are about to downgrade to Wiki version %0 from %1.<br><br>Downgrading to an earlier version of the core code is not recommended",
	step2Html_restore: "This Wiki appears to be already using the latest version of the core code (%0).<br><br>You can try to reload the core anyway - in case you damaged s.th. by editing the html file directly.",
	step2Html_upgrade: "You are about to upgrade to Wiki version %0 from %1",
	upgradeLabel: "Check...",
	upgradePrompt: "Prepare for the upgrade process",
	statusRetrievingUpdate: "Retrieving update...",
	errorLoadingCore: "Error retrieving update!",
	errorCoreFormat: "Error with the recieved update code!",
	statusSavingCore: "Saving the updated wiki",
	statusUpdateSaved: "The updated wiki has been saved to your download location.",
	startLabel: "Upgrade Now",
	startPrompt: "Start the upgrade process",
	cancelLabel: "Cancel",
	cancelPrompt: "Cancel the upgrade process",
	step3Title: "Upgrade cancelled",
	step3Html: "You have cancelled the upgrade process"
});

merge(config.commands.startEditing,{
	text: "✎ Edit",
	tooltip: "Edit This Article\n[Ctrl - Enter]",
	readOnlyText: "view",
	readOnlyTooltip: "View the source of this article"
});

merge(config.commands.finishEditing,{
	text: "✔ Done",
	tooltip: "Save changes to this article\n[Ctrl - Enter]"
});

merge(config.commands.cancelEditing,{
	text: "⨯ Cancel",
	tooltip: "Undo Changes to This Article",
	warning: "Are you sure you want to abandon your changes to '%0'?",
	readOnlyText: "done",
	readOnlyTooltip: "View this article normally"
});

merge(config.commands.deleteArticle,{
	text: "⨯ Delete",
	tooltip: "Delete This Article",
	warning: "Are you sure you want to delete '%0'?"
});

merge(config.commands.permalink,{
	text: "Permalink",
	tooltip: "Permalink for this article"
});

merge(config.commands.references,{
	text: "➷ References",
	tooltip: "Show article that link to this one",
	popupNone: "No references"
});

merge(config.commands.jump,{
	text: "Jump",
	tooltip: "Jump to another open article"
});

merge(config.commands.fields,{
	text: "Fields",
	tooltip: "Show the extended fields of this article",
	emptyText: "There are no extended fields for this article",
	listViewTemplate: {
		columns: [
			{name: 'Field', field: 'field', title: "Field", type: 'String'},
			{name: 'Value', field: 'value', title: "Value", type: 'String'}
		],
		rowClasses: [],
		buttons: []
	}
});

merge(config.internalArticles,{
	SiteUrl: "",
	SideBarTabs: '<<tabs sideBarTabSet "Missing" "Missing links & pages" TabMoreMissing "Tags" "All tags" TabTags "Resources" "Images And Stuff" TabResources>>'
});
