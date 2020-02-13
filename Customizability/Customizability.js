// Renders a newly created element into place. The element type is looked up in option.types[optionTypeName].elementType
config.macros.option.genericCreate = function(place, optionTypeName, optionName, className, desc) {
	var typeInfo = config.macros.option.types[optionTypeName];
	var element = document.createElement(typeInfo.elementType);
	if (typeInfo.typeValue)
		element.setAttribute('type', typeInfo.typeValue);
	element[typeInfo.eventName] = typeInfo.onChange;
	element.setAttribute('option', optionName);
	element.className = className || typeInfo.className;
	if (config.optionsDesc[optionName])
		element.setAttribute('title', config.optionsDesc[optionName]);
	place.appendChild(element);
	if (desc != 'no')
		createTiddlyText(place, config.optionsDesc[optionName] || optionName);
	element[typeInfo.valueField] = config.options[optionName];
	return element;
};

config.macros.option.genericOnChange = function(e) {
	var opt = this.getAttribute('option');
	if (opt) {
		var optionTypeName = opt.substr(0, 3);
		var typeInfo = config.macros.option.types[optionTypeName];
		if (typeInfo.elementType && typeInfo.valueField)
			config.macros.option.propagateOption(opt, typeInfo.valueField, this[typeInfo.valueField], typeInfo.elementType, this);
	}
	return true;
};

config.macros.option.types = { // Dictionary(Of OptionTypeName, OptionTypeInfo)
	'txt': {
		elementType: 'input',
		valueField: 'value',
		eventName: 'onchange',
		className: 'txtOptionInput',
		create: config.macros.option.genericCreate,
		onChange: config.macros.option.genericOnChange
	},
	'chk': {
		elementType: 'input',
		valueField: 'checked',
		eventName: 'onclick',
		className: 'chkOptionInput',
		typeValue: 'checkbox',
		create: config.macros.option.genericCreate,
		onChange: config.macros.option.genericOnChange
	}
};

config.macros.option.propagateOption = function(opt, valueField, value, elementType, elem) {
	config.options[opt] = value;
	saveOption(opt);
	var t,nodes = document.getElementsByTagName(elementType);
	for (t = 0; t < nodes.length; t++) {
		var optNode = nodes[t].getAttribute('option');
		if (opt == optNode && nodes[t]!=elem) nodes[t][valueField] = value;
	}
};

config.macros.option.handler = function(place, macroName, params, wikifier, paramString) { // Implements IMacroResolver.handler()
	params = paramString.parseParams('anon', null, true, false, false);
	var opt = (params[1] && params[1].name == 'anon') ? params[1].value : getParam(params, 'name', null);
	var className = (params[2] && params[2].name == 'anon') ? params[2].value : getParam(params, 'class', null);
	var desc = getParam(params, 'desc', 'no');
	var optionTypeName = opt.substr(0,3);
	var optionTypeInfo = config.macros.option.types[optionTypeName];
	if (optionTypeInfo && optionTypeInfo.create)
		optionTypeInfo.create(place, optionTypeName, opt, className, desc);
};

// renders a wizard containing a list view containing all options
config.macros.options.handler = function(place, macroName, params, wikifier, paramString) { // Implements IMacroResolver.handler()
	params = paramString.parseParams('anon', null, true, false, false);
	var showUnknown = getParam(params, 'showUnknown', 'no');
	var presenter = new WizardPresenter();
	presenter.renderNewView(place, this.wizardTitle);
	presenter.renderBodyContent(this.step1Title, this.step1Html);
	var listViewPlaceholder = presenter.getElement('listViewPlaceholder');
	var chkUnknown = presenter.getElement('chkUnknown');
	chkUnknown.checked = showUnknown == 'yes';
	chkUnknown.onchange = this.onChangeUnknown;
	var listWrapper = document.createElement('div');
	listViewPlaceholder.parentNode.insertBefore(listWrapper, listViewPlaceholder);
	presenter.setValue('listWrapper', listWrapper);
	this.refreshOptions(listWrapper, showUnknown == 'yes');
};

// renders a listview representing the option entities
config.macros.options.refreshOptions = function(listWrapper, showUnknown) {
	var optionViews = [];
	for (var optionName in config.options) { // Reflection, iterate all members of "config" singleton
		var optionView = {};
		optionView.option = '';
		optionView.name = optionName;		
		if (config.optionsDesc[optionName]) {
			optionView.description = config.optionsDesc[optionName];
			optionViews.push(optionView);
		} else {
			if (showUnknown) {
				optionView.description = this.unknownDescription;
				optionViews.push(optionView);
			}
		}
	}
	optionViews.sort(function(a,b) {return a.name.substr(3) < b.name.substr(3) ? -1 : (a.name.substr(3) == b.name.substr(3) ? 0 : +1);});
	
	ListView.create(listWrapper, optionViews, this.listViewTemplate); // This is a bidirectional wire-up. A ListView will be rendered, but "optionViews" will receive a tableCellByFieldName dictionary!
	
	// The list view was created with read only elements.
	// The following code will render interactive input elements into table cells.
	
	for (var i = 0; i < optionViews.length; i++) {
		var optionTypeName = optionViews[i].name.substr(0, 3);
		var typeInfo = config.macros.option.types[optionTypeName];
		if (typeInfo && typeInfo.create) {
			typeInfo.create(optionViews[i].tableCellByFieldName['option'], optionTypeName, optionViews[i].name, null, 'no');
		}
	}
};

config.macros.options.onChangeUnknown = function(e) {
	var presenter = new WizardPresenter(this);
	var listWrapper = presenter.getValue('listWrapper');
	jQuery(listWrapper).empty();
	config.macros.options.refreshOptions(listWrapper, this.checked);
	return false;
};
