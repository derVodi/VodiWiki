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
