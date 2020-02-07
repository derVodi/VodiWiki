var config = {
	numRssItems: 20 // Number of items in the RSS feed	
};

// Hashmap of alternative parsers for the wikifier
config.parsers = {};

// Backstage tasks
config.tasks = {};

// Messages
config.messages = {
	dates: {},
	tiddlerPopup: {}
};

// Options that can be set in the options panel and/or cookies
config.options = {
	chkRegExpSearch: false,
	chkCaseSensitiveSearch: false,
	chkIncrementalSearch: true,	
	chkAutoSave: true,
	chkOpenInNewWindow: true,
	chkToggleLinks: false,
	chkHttpReadOnly: true,
	chkConfirmDelete: true,
	txtBackupFolder: "",
	txtMaxEditRows: "30",
	txtFileSystemCharSet: "UTF-8",
	txtTheme: "",
	txtUserName: "Anonymous",
	txtWikiTitle: "VodiWiki"
};
config.optionsDesc = {};

config.optionsSource = {};

// Default tiddler templates
var DEFAULT_VIEW_TEMPLATE = 1;
var DEFAULT_EDIT_TEMPLATE = 2;
config.tiddlerTemplates = {
	1: "ViewTemplate",
	2: "EditTemplate"
};

// More messages (rather a legacy layout that should not really be like this)
config.views = {
	wikified: {
		tag: {}
	},
	editor: {
		tagChooser: {}
	}
};

// Backstage tasks
config.backstageTasks = ["save", "importTask", "tweak", "plugins", "upgrade"];

// Extensions
config.extensions = {};

// Macros; each has a 'handler' member that is inserted later
config.macros = {
	today: {},
	version: {},
	search: {},
	tiddler: {},
	tag: {},
	tags: {},
	timeline: {},
	allTags: {},
	list: {
		all: {},
		missing: {},
		orphans: {},
		resources: {},
		shadowed: {},
		touched: {},
		filter: {}
	},
	saveChanges: {},	
	option: {},
	options: {},
	tabs: {},
	message: {},
	view: {defaultView: "text"},
	edit: {},
	tagChooser: {},
	toolbar: {},
	plugins: {},
	refreshDisplay: {},
	importTiddlers: {},
	upgrade: {
		updateSourceUrl: "http://vodi.de/VodiWiki/Updates/%0.html"
	}
};

// Commands supported by the toolbar macro
config.commands = {
	editTiddler: {},
	saveTiddler: {hideReadOnly: true},
	cancelTiddler: {},
	deleteTiddler: {hideReadOnly: true},
	permalink: {},
	references: {type: "popup"},
	jump: {type: "popup"},
	syncing: {type: "popup"},
	fields: {type: "popup"}
};

// Control of macro parameter evaluation
config.evaluateMacroParameters = "all";

// Basic regular expressions
config.textPrimitives = {
	upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
	lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
	anyLetter:   "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]"
};
if (!((new RegExp("[\u0150\u0170]","g")).test("\u0150"))) {
	config.textPrimitives = {
		upperLetter: "[A-Z\u00c0-\u00de]",
		lowerLetter: "[a-z0-9_\\-\u00df-\u00ff]",
		anyLetter:   "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff]",
		anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff]"
	};
}
config.textPrimitives.sliceSeparator = "::";
config.textPrimitives.sectionSeparator = "##";
config.textPrimitives.urlPattern = "(?:file|http|https|mailto|ftp|irc|news|data):[^\\s'\"]+(?:/|\\b)";
config.textPrimitives.unWikiLink = "~";

config.textPrimitives.cssLookahead = "(?:(" + config.textPrimitives.anyLetter + "+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:(" + config.textPrimitives.anyLetter + "+):([^;\\|\\n]+);)";
config.textPrimitives.cssLookaheadRegExp = new RegExp(config.textPrimitives.cssLookahead,"mg");

config.textPrimitives.brackettedLink = "\\[\\[([^\\]]+)\\]\\]";
config.textPrimitives.labeledBrackettedLink = "\\[\\[([^\\[\\]\\|]+)\\|([^\\[\\]\\|]+)\\]\\]";
config.textPrimitives.tiddlerForcedLinkRegExp = new RegExp("(?:" + config.textPrimitives.labeledBrackettedLink + ")|(?:" +
	config.textPrimitives.brackettedLink + ")|(?:" +
	config.textPrimitives.urlPattern + ")","mg");

//--
//-- Built-in articles - these are programmatic, in contrast to those which were collected from the "builtInArticles" div. See loadBuiltInArticlesFromHtmlIntoJsDictionary()
//--

config.shadowTiddlers = {	
	ArticleTreePanel: '{{articleTreePanel{<<articleTree>>{{articleTreeButtons{<<newArticleButton "New Article" true>><<newArticleButton " Sub Article" false>>}}}}}}',
	NavigationPanel: '<<tabs navigationTabSetWrapper "╘" "Structured tree" ArticleTreePanel "A-Z" "Sorted list" SortedListPanel "🕓" "Timeline" TimelinePanel>>',
	PluginManager: '<<plugins>>',
	SortedListPanel: '<<list all>>',
	SystemSettings: '',
	TabTags: '<<allTags>>',
	TabMoreMissing: 'Pages with no menu entry: <<list orphans>> Broken Links <<list missing>>',
	TabResources: '<<list resources>>',
	TimelinePanel: '<<timeline>>',	
};

// Browser detection... In a very few places, there's nothing else for it but to know what browser we're using.
config.userAgent = navigator.userAgent.toLowerCase();
config.browser = {
	isIE: config.userAgent.indexOf("msie") != -1 && config.userAgent.indexOf("opera") == -1,
	ieVersion: /MSIE (\d{1,2}.\d)/i.exec(config.userAgent), // config.browser.ieVersion[1], if it exists, will be the IE version string, eg "6.0"
	isSafari: config.userAgent.indexOf("applewebkit") != -1,
	isOpera: config.userAgent.indexOf("opera") != -1,	
};
