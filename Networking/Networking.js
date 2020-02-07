function requesAsync(responseType, url, cb){
	var request = new XMLHttpRequest;
	request.responseType = responseType;
	request.open('GET', url, true);
	request.onload = function(e){ cb(this.response, this.getResponseHeader("content-type")); };
	request.send();	
}

function ajaxReq(ajaxParameters) {
	// HACK: ".file" is not an official member of jQuery.ajax parameters (it would be "url")
	if (ajaxParameters.file) return localAjax(ajaxParameters);
	return jQuery.ajax(ajaxParameters); // https://api.jquery.com/jQuery.ajax/#jqXHR
}
