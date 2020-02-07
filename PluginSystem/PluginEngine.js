function loadPlugins() {
	
	if (safeMode)	return false;
	
	var tiddlers = store.getPlugins();	
	var toLoad = [];
	var nLoaded = 0;
	var map = {};
	var nPlugins = tiddlers.length;
	installedPlugins = [];
	for (var i = 0; i < nPlugins; i++) {
		var pluginInfo = getPluginInfo(tiddlers[i]);
		installedPlugins[i] = pluginInfo;
		var n = pluginInfo.Name || pluginInfo.title;
		if (n)
			map[n] = pluginInfo;
		n = pluginInfo.Source;
		if (n)
			map[n] = pluginInfo;
	}
	var visit = function(pluginInfo) {
		if (!pluginInfo || pluginInfo.done)
			return;
		pluginInfo.done = 1;
		var reqs = pluginInfo.Requires;
		if (reqs) {
			reqs = reqs.readBracketedList();
			var i;
			for (i = 0; i < reqs.length; i++)
				visit(map[reqs[i]]);
		}
		toLoad.push(pluginInfo);
	};
	for (i = 0; i < nPlugins; i++)
		visit(installedPlugins[i]);
	for (i = 0; i < toLoad.length; i++) {
		pluginInfo = toLoad[i];
		pluginInfo = pluginInfo;
		tiddler = pluginInfo.tiddler;
		if (isPluginEnabled(pluginInfo)) {
			pluginInfo.executed = true;
			var startTime = new Date();
			try {
				if (tiddler.text)
					window.eval(tiddler.text);
				nLoaded++;
			} catch(ex) {
				pluginInfo.log.push(config.messages.pluginError.format([exceptionText(ex)]));
				pluginInfo.error = true;
				if (!console.tiddlywiki) {
					console.log("error evaluating " + tiddler.title, ex);
				}
			}
			pluginInfo.startupTime = String((new Date()) - startTime) + "ms";
		} else {
			nPlugins--;
		}
	}
	return nLoaded != nPlugins;
}

function getPluginInfo(tiddler) {
	var p = store.getTiddlerSlices(tiddler.title, ["Name","Description","Version","Requires","CoreVersion","Date","Source","Author","License","Browsers"]);
	p.tiddler = tiddler;
	p.title = tiddler.title;
	p.log = [];
	return p;
}

function isPluginEnabled(plugin) {
	if (plugin.tiddler.isTagged("systemConfigDisable")) {
		plugin.log.push(config.messages.pluginDisabled);
		return false;
	}
	return true;
}
