//--
//-- Backstage
//--

var backstage = {
	tabBar: null,
	button: null,
	showButton: null,
	hideButton: null,
	cloak: null,
	panel: null,
	currentTaskName: null,
	currentTaskButton: null,

	init: function() {
		
		this.button = document.getElementById("backstageButton");
		this.cloak = document.getElementById("backstageCloak");
		this.tabBar = document.getElementById("backstageTabBar");
		this.panel = document.getElementById("backstagePanel");
		
		this.showButton = renderTiddlyButton(this.button, "⌵", null, function(e) {backstage.show(); return false;}, null, "backstageShow");
		this.hideButton = renderTiddlyButton(this.button, "⨯", null,	function(e) {backstage.hide(); return false;}, null, "backstageHide");
		
		this.cloak.onmousedown = function(e) {backstage.showTaskView(null);};
		
		this.panelBody = createTiddlyElement(this.panel, "div", null, "backstagePanelBody");
		
		appendTextNodeTo(this.tabBar, "Backstage: ");
		
		// If a task has an action, then it's button will be rendered without an arrow and it'll be performed immediately
		// Otherwise a wizard will pop up.
		// e.g. config.tasks.save.action = saveChangesAction;
		
		for (var i = 0; i < config.backstageTasks.length; i++) {
			var taskName = config.backstageTasks[i];
			var task = config.tasks[taskName];
			
			var onButtonClicked = (
				task.action ?
				function(e) {
					backstage.showTaskView(null);
					config.tasks[this.getAttribute("task")].action();
					return false;
				} : 
				function(e) {
					backstage.showTaskView(this.getAttribute("task"));
					return false;
				}
			);
			
			var text = task.text + (task.action ? "" : "▾");
			var btn = renderTiddlyButton(this.tabBar, text, task.tooltip, onButtonClicked, "backstageTabHead");
			jQuery(btn).addClass(task.action ? "backstageAction" : "backstageTask");
			btn.setAttribute("task", taskName);
		}
		
		appendTextNodeTo(this.tabBar, formatVersion());
		
		this.hide();
	},

	isVisible: function() {
		return this.tabBar ? this.tabBar.style.display == "block" : false;
	},

	show: function() {
		this.tabBar.style.display = "block";	
		this.showButton.style.display = "none";
		this.hideButton.style.display = "block";
	},

	hide: function() {
		if (this.currentTaskButton) {
			this.showTaskView(null);
		} else {
			this.tabBar.style.display = "none";			
			this.showButton.style.display = "block";
			this.hideButton.style.display = "none";
		}
	},

	// Switch to a given taskView, or none if null is passed
	showTaskView: function(taskName) {
		
		 // Toggle show/hide for repetetive taskName
		
		if (taskName == backstage.currentTaskName) {
			backstage.hidePanel();
			return;
		}
		
		// Locate the upcoming menu Button
		
		var taskButton = null;
		var e = this.tabBar.firstChild;
		while (e) {
			if (e.getAttribute && e.getAttribute("task") == taskName) taskButton = e;
			e = e.nextSibling;
		}
		
		// Fulfill changing the current view
		
		if (backstage.currentTaskButton) jQuery(this.currentTaskButton).removeClass("backstageSelTab");
		
		if (taskButton && taskName) {
			backstage.preparePanel();
			jQuery(taskButton).addClass("backstageSelTab");			
			wikify(config.tasks[taskName].content, backstage.panelBody, null, null); // POI: Task content template will be rendered
			backstage.showPanel();
		} else if (backstage.currentTaskButton) {
			backstage.hidePanel();
		}
		
		backstage.currentTaskName = taskName;
		backstage.currentTaskButton = taskButton;
	},

	isPanelVisible: function() {
		return backstage.panel ? backstage.panel.style.display == "block" : false;
	},

	preparePanel: function() {
		backstage.cloak.style.display = "block";
		jQuery(backstage.panelBody).empty();
		return backstage.panelBody;
	},

	showPanel: function() {
		backstage.panel.style.display = "block";
	},

	hidePanel: function() {
		if (backstage.currentTaskButton)
			jQuery(backstage.currentTaskButton).removeClass("backstageSelTab");
		backstage.currentTaskButton = null;
		backstage.currentTaskName = null;
		backstage.panel.style.display = "none";
		backstage.cloak.style.display = "none";
	}
};

config.macros.backstage = {};

config.macros.backstage.handler = function(place,macroName,params) { // Implements IMacroResolver.handler()
	var backstageTask = config.tasks[params[0]];
	if (backstageTask)
		renderTiddlyButton(place, backstageTask.text, backstageTask.tooltip, function(e) {backstage.showTaskView(params[0]); return false;});
};
