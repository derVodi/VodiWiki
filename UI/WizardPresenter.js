//--
//-- WizardPresenter
//--

function WizardPresenter(anyElementInAnExistingWizardView) {
	if (anyElementInAnExistingWizardView) {
		this.formElem = navigateThroughDom(anyElementInAnExistingWizardView, "wizard", "className");
		this.bodyElem = navigateThroughDom(this.formElem.firstChild, "wizardBody", "className", "nextSibling");
		this.footElem = navigateThroughDom(this.formElem.firstChild, "wizardFooter", "className", "nextSibling");
	} else {
		this.formElem = null;
		this.bodyElem = null;
		this.footElem = null;
	}
}

WizardPresenter.prototype.setValue = function(name,value) {
	jQuery(this.formElem).data(name, value);
};

WizardPresenter.prototype.getValue = function(name) {
	return this.formElem ? jQuery(this.formElem).data(name) : null;
};

// Creates a new wizard view element (a form with class "wizard"). The view will carry all wizard states (the presenter is passive).
WizardPresenter.prototype.renderNewView = function(place, title) {
	this.formElem = createTiddlyElement(place, "form", null, "wizard");
	createTiddlyElement(this.formElem, "div", null, "title", title);
	this.bodyElem = createTiddlyElement(this.formElem, "div", null, "wizardBody");
	this.footElem = createTiddlyElement(this.formElem, "div", null, "wizardFooter");
	return this.formElem;
};

WizardPresenter.prototype.clear = function() {
	jQuery(this.bodyElem).empty();
};

WizardPresenter.prototype.renderFooterContent = function(buttonInfos, statusText) {
	jQuery(this.footElem).empty();
	
	var e = createTiddlyElement(this.footElem, "div", null, "status");
	if (statusText) e.innerHTML = statusText;
		
	for (var i = 0; i < buttonInfos.length; i++) {
		renderTiddlyButton(this.footElem, buttonInfos[i].caption, buttonInfos[i].tooltip, buttonInfos[i].onClick);
		insertSpacer(this.footElem);
	}
};

WizardPresenter.prototype.renderBodyContent = function(headlineText, html) {
	jQuery(this.bodyElem).empty();
	var wrapper = createTiddlyElement(this.bodyElem, "div");
	createTiddlyElement(wrapper, "h1", null, null, headlineText);
	var step = createTiddlyElement(wrapper, "div", null, "wizardStep");
	step.innerHTML = html;
	applyHtmlMacros(step);
};

WizardPresenter.prototype.getElement = function(name) {
	return this.formElem.elements[name];
};
