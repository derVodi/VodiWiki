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
