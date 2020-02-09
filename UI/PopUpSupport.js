//--
//-- Message area
//--

function displayMessage(text, href, duration) {
	var messageAreaDiv = document.getElementById("messageArea");
	var textDiv;
	if (! messageAreaDiv.hasChildNodes()) {
		renderTiddlyButton(messageAreaDiv, "╳", "Close this popup", clearMessage);
		textDiv = createTiddlyElement(messageAreaDiv, "div", "messageText");
	}
	if (! textDiv) textDiv = document.getElementById("messageText");
	
	while (textDiv.firstChild) {textDiv.removeChild(textDiv.firstChild);}
	
	if (href) {
		var link = createTiddlyElement(textDiv, "a", null, null, text);
		link.href = href;
		link.target = "_blank";
	} else {
		textDiv.innerText = text;
	}
	
	messageAreaDiv.style.display = "block";

	if (! duration) duration = 3000;
	if (duration > 0 ) setTimeout(clearMessage, duration);
}

function clearMessage() {
	document.getElementById("messageArea").style.display = "none";
}

inputDialog = {
	createElement: function(tag, innerHtml) { // todo: better UX, focus handling (especially after closing the dialog), default selection...
		var element = document.createElement(tag);
		element.innerHTML = innerHtml;
		return element;
	},
	close: function(isOk) {
		this.cloak.style.display = 'none';
		document.body.removeChild(this.inputPanel);
		if (isOk) this.okHandler(this.labelsAndValues);
	},
	cloak: document.getElementById("backstageCloak"),
	rescuedCloakClickHandler: null,
	inputPanel:null,
	labelsAndValues: null,
	okHandler:null,
	keyPressed: function(e) {		
		var allFields = this.inputPanel.getElementsByClassName('inputDialogPanel-field');		
		for (i = 0; i < allFields.length; i++) {
			this.labelsAndValues[allFields[i].getAttribute('name')] = allFields[i].value;
		}
		switch(e.keyCode) {
			case 13:
				inputDialog.close(true);
				break;
			case 27: // Escape
				inputDialog.close(false);
				break;
			}
	},
	awaitUserInput: function(labelsAndValues, focusingIndex, okHandler) {
		this.rescuedCloakClickHandler = this.cloak.onmousedown;
		this.cloak.onmousedown = null;
		
		var inputPanel = document.createElement("div");
		inputPanel.onkeydown = this.keyPressed.bind(this);
		inputPanel.setAttribute('class','inputDialogPanel');
		document.body.appendChild(inputPanel);
		
		var title = this.createElement("h1", 'Edit Link');
		inputPanel.appendChild(title);
		
		var focusingField;
		var i = 0;
		for (labelText in labelsAndValues) {
			var label = this.createElement("div", labelText);
			label.setAttribute('class','inputDialogPanel-label');
			inputPanel.appendChild(label);
			
			var field = document.createElement("input");
			field.setAttribute('name', labelText);
			field.setAttribute('class', 'inputDialogPanel-field');
			field.value = labelsAndValues[labelText];
			if (i == focusingIndex) focusingField = field;
			//field.onkeypress = this.keyPressed;
			
			inputPanel.appendChild(field);
			i++;			
		}
					
		var buttonsPanel = document.createElement("div");
		buttonsPanel.setAttribute('class', 'inputDialogPanel-buttonsPanel');
		
		var okButton = this.createElement('button', 'Ok');
		okButton.onclick = function() {inputDialog.close(true);}
		buttonsPanel.appendChild(okButton);
		
		var cancelButton = this.createElement('button', 'Cancel');
		cancelButton.onclick = function() {inputDialog.close(false);}
		buttonsPanel.appendChild(cancelButton);
		
		inputPanel.appendChild(buttonsPanel);
		
		this.cloak.style.display = 'block';

		this.inputPanel = inputPanel;
		this.labelsAndValues = labelsAndValues;
		this.okHandler = okHandler;

		focusingField.focus();
		focusingField.select();
	}
}
