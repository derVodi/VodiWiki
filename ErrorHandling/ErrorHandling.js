// Returns a string containing the description of an exception, optionally prepended by a message
function exceptionText(e, message) {
	var s = e.description || e.toString();
	return message ? "%0:\n%1".format([message,s]) : s;
}

// Displays an alert of an exception description with optional message
function showException(e,message) {
	alert(exceptionText(e,message));
}

function alertAndThrow(m) {
	alert(m);
	throw(m);
}

// Renders a popup showing the error detail text.
function onClickError(ev) {
	var e = ev || window.event;
	var popup = Popup.create(this);
	var lines = this.getAttribute("errorDetails").split("\n");
	var t;
	for (t = 0; t < lines.length; t++)
		createTiddlyElement(popup, "li", null, null, lines[t]);
	Popup.show();
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
	return false;
}

// Renders a button showing the error (label) text and carrying the error detail text inside - which will be shown as popup when the button is clicked.
function createTiddlyError(place, label, details) {
	var btn = renderTiddlyButton(place, label, null, onClickError, "errorButton");
	if (details) btn.setAttribute("errorDetails", details);
}
