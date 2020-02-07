
//--
//-- Upgrade macro
//--

config.macros.upgrade.handler = function(place) { // Implements IMacroResolver.handler()
	var presenter = new WizardPresenter();
	presenter.renderNewView(place, this.wizardTitle);
	presenter.renderBodyContent(this.step1Title.format(formatVersion()), this.step1Html.format([this.source]));
	presenter.renderFooterContent([{caption: this.upgradeLabel, tooltip: this.upgradePrompt, onClick: this.onClickUpgrade}]);
};

config.macros.upgrade.onClickUpgrade = function(e) {
	var me = config.macros.upgrade;
	var presenter = new WizardPresenter(this);	
	if (story.areAnyDirty() || store.isDirty()) {
		alert(me.errorNotSaved);
		return false;
	}	
	presenter.renderFooterContent([], me.statusRetrievingUpdate);

	var secondTry = function(jqXHR, textStatus, errorThrown) {
		me.tryRetrieveUpdateAsync(presenter, version.major, function(jqXHR, textStatus, errorThrown) {me.onUpgradeRetrieved(false, presenter, null, jqXHR);})
	}
	
	me.tryRetrieveUpdateAsync(presenter, version.major + 1, secondTry);
	
	return false;
};

config.macros.upgrade.tryRetrieveUpdateAsync = function(presenter, majorVersion, onFail){
	var me = config.macros.upgrade;
	var ajaxParameters = {
		type: "GET",
		url: me.updateSourceUrl.format(majorVersion),
		dataType: 'text',
		processData: false,
		success: function(data, textStatus, jqXHR) {me.onUpgradeRetrieved(true, presenter, jqXHR.responseText, jqXHR);},
		error: onFail
	};
	ajaxReq(ajaxParameters);
}

config.macros.upgrade.onUpgradeRetrieved = function(sucess, presenter, newHtmlSource, xhr) {
	var me = config.macros.upgrade;
		
	var errMsg;	
	guards: {
		if (! sucess) {errMsg = me.errorLoadingCore; break guards; }
		
		var newVer = me.extractVersion(newHtmlSource);
		if (! newVer) {errMsg = me.errorCoreFormat; break guards; }
	}		
	if (errMsg) {
		presenter.renderFooterContent([], errMsg);
		alert(errMsg);
		return;
	}
	
	var onStartUpgrade = function(e) {
		presenter.renderFooterContent([],me.statusSavingCore);
		var localPath = getLocalPath(document.location.toString());
		injectArticlesAndSave(localPath, newHtmlSource);
		presenter.renderFooterContent([], me.statusUpdateSaved);
	};
	
	var step2 = [me.step2Html_downgrade, me.step2Html_restore, me.step2Html_upgrade][compareVersions(version, newVer) + 1];
	presenter.renderBodyContent(me.step2Title, step2.format([formatVersion(newVer), formatVersion(version)]));
	presenter.renderFooterContent([{caption: me.startLabel, tooltip: me.startPrompt, onClick: onStartUpgrade}, {caption: me.cancelLabel, tooltip: me.cancelPrompt, onClick: me.onCancel}]);
};

config.macros.upgrade.onCancel = function(e) {
	var me = config.macros.upgrade;
	var w = new WizardPresenter(this);
	w.renderBodyContent(me.step3Title,me.step3Html);
	w.renderFooterContent([]);
	return false;
};

config.macros.upgrade.extractVersion = function(htmlSource) {
	var re = /^var version = \{title: "([^"]+)", major: (\d+), minor: (\d+), revision: (\d+)/mg;
	var m = re.exec(htmlSource);
	return m ? {title: m[1], major: m[2], minor: m[3], revision: m[4], beta: m[6], date: new Date(m[7])} : null;
};
