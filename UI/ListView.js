//--
//-- ListView gadget
//--

var ListView = {};

// Create a listview

ListView.create = function(place, dataSource, listTemplate, callback, className) {
	var table = createTiddlyElement(place, "table", null, className || "listView twtable");
	var thead = createTiddlyElement(table, "thead");
	var tr = createTiddlyElement(thead, "tr");
	
	// Render header cells
	
	for (var i = 0; i < listTemplate.columns.length; i++) {
		var columnTemplate = listTemplate.columns[i];
		var td = createTiddlyElement(tr, "th");
		var colType = ListView.columnTypes[columnTemplate.type];
		if (colType && colType.createHeader) {
			colType.createHeader(td, columnTemplate, i);
			if (columnTemplate.className) jQuery(td).addClass(columnTemplate.className);
		}
	}
	
	// Render rows
	
	var i, tbody = createTiddlyElement(table, "tbody");
	for (i = 0; i < dataSource.length; i++) {
		var item = dataSource[i];
		tr = createTiddlyElement(tbody, "tr");
		for (var j = 0; j < listTemplate.rowClasses.length; j++) {
			if (item[listTemplate.rowClasses[j].field]) // if the item contains a non-null-property mathing the name of any "rowClasses" field...
				jQuery(tr).addClass(listTemplate.rowClasses[j].className); // ...add the CSS class of rowClasses[td].className to the whole tr
		}
		item.rowElement = tr;
		item.tableCellByFieldName = {};
		for (x = 0; x < listTemplate.columns.length; x++) { // cells
			td = createTiddlyElement(tr, "td");
			columnTemplate = listTemplate.columns[x];
			var field = columnTemplate.field;
			colType = ListView.columnTypes[columnTemplate.type];
			if (colType && colType.createItem) {
				colType.createItem(td,item,field,columnTemplate,x,i);
				if (columnTemplate.className)
					jQuery(td).addClass(columnTemplate.className);
			}
			item.tableCellByFieldName[field] = td; // HACK: bi-directional wire-up from view model to UI element
		}
	}
	
	if (callback && listTemplate.actions) createTiddlyDropDown(place, ListView.getCommandHandler(callback), listTemplate.actions);
	
	if (callback && listTemplate.buttons) {
		for (x = 0; x < listTemplate.buttons.length; x++) {
			var a = listTemplate.buttons[x];
			if (a && a.name != "")
				renderTiddlyButton(place, a.caption, null, ListView.getCommandHandler(callback, a.name, a.allowEmptySelection));
		}
	}
	return table;
};

ListView.getCommandHandler = function(callback, name, allowEmptySelection) {
	return function(e) {
		var view = navigateThroughDom(this, "TABLE", null, "previousSibling");
		var tiddlers = [];
		ListView.forEachSelectedCheckbox(view,function(e, rowName) {
			if (e.checked)
				tiddlers.push(rowName);
		});
		if (tiddlers.length == 0 && !allowEmptySelection) {
			alert(config.messages.nothingSelected);
		} else {
			if (this.nodeName.toLowerCase() == "select") {
				callback(view,this.value,tiddlers);
				this.selectedIndex = 0;
			} else {
				callback(view,name,tiddlers);
			}
		}
	};
};

// Invoke a callback for each selected checkbox in the listview
ListView.forEachSelectedCheckbox = function(view, callback) { // view is a table element
	var checkboxes = view.getElementsByTagName("input");
	var hadOne = false;
	for (var i = 0; i < checkboxes.length; i++) {
		var cb = checkboxes[i];
		if (cb.getAttribute("type") == "checkbox") {
			var rn = cb.getAttribute("rowName");
			if (rn) {
				callback(cb, rn);
				hadOne = true;
			}
		}
	}
	return hadOne;
};

ListView.getSelectedRows = function(view) {
	var rowNames = [];
	ListView.forEachSelectedCheckbox(view,function(e, rowName) {
		if (e.checked)
			rowNames.push(rowName);
	});
	return rowNames;
};

ListView.columnTypes = {};

ListView.columnTypes.String = {
	createHeader: function(place, columnTemplate, col) {
		createTiddlyText(place, columnTemplate.title);
	},
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		if (v != undefined)
			createTiddlyText(place,v);
	}
};

ListView.columnTypes.WikiText = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		if (v != undefined)
			wikify(v,place,null,null);
	}
};

ListView.columnTypes.Tiddler = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place, listObject, field, columnTemplate, col, row) {
		var v = listObject[field];
		if (v != undefined && v.title)
			renderLinkElement(place, v.title, true);
	}
};

ListView.columnTypes.Size = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var msg = config.messages.sizeTemplates;
		var v = listObject[field];
		if (v != undefined) {
			var t = 0;
			while (t<msg.length-1 && v<msg[t].unit)
				t++;
			createTiddlyText(place,msg[t].template.format([Math.round(v/msg[t].unit)]));
		}
	}
};

ListView.columnTypes.Link = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		var c = columnTemplate.text;
		if (v != undefined)
			renderExternalLink(place,v,c || v);
	}
};

ListView.columnTypes.Date = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		if (v != undefined)
			createTiddlyText(place,v.formatString(columnTemplate.dateFormat));
	}
};

ListView.columnTypes.StringList = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		if (v != undefined) {
			var t;
			for (t=0; t<v.length; t++) {
				createTiddlyText(place,v[t]);
				createTiddlyElement(place,"br");
			}
		}
	}
};

ListView.columnTypes.Selector = {
	createHeader: function(place,columnTemplate,col) {
		createTiddlyCheckbox(place,null,false,this.onHeaderChange);
	},
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var e = createTiddlyCheckbox(place,null,listObject[field],null);
		e.setAttribute("rowName",listObject[columnTemplate.rowName]);
	},
	onHeaderChange: function(e) {
		var state = this.checked;
		var view = navigateThroughDom(this, "TABLE");
		if (!view)
			return;
		ListView.forEachSelectedCheckbox(view, function(e, rowName) {
			e.checked = state;
		});
	}
};

ListView.columnTypes.Tags = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var tags = listObject[field];
		createTiddlyText(place,String.buildInternalLinksTuple(tags));
	}
};

ListView.columnTypes.Boolean = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		if (listObject[field] == true)
			createTiddlyText(place,columnTemplate.trueText);
		if (listObject[field] == false)
			createTiddlyText(place,columnTemplate.falseText);
	}
};

ListView.columnTypes.TagCheckbox = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place, listObject, field, columnTemplate, col, row) {
		var e = createTiddlyCheckbox(place, null, listObject[field], this.onChange);
		e.setAttribute("tiddler", listObject.title);
		e.setAttribute("tag", columnTemplate.tag);
	},
	onChange : function(e) {
		var tag = this.getAttribute("tag");
		var title = this.getAttribute("tiddler");
		store.setTiddlerTag(title, this.checked, tag);
	}
};

ListView.columnTypes.TiddlerLink = {
	createHeader: ListView.columnTypes.String.createHeader,
	createItem: function(place,listObject,field,columnTemplate,col,row) {
		var v = listObject[field];
		if (v != undefined) {
			var link = renderLinkElement(place, listObject[columnTemplate.tiddlerLink]);
			createTiddlyText(link, listObject[field]);
		}
	}
};
