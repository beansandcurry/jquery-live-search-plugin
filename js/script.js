/* Author: Beans & Curry
*/
$(function () {
	$(".live-search").bcLiveSearch({
		source : 'query.json',
		textChangeDelay : 0,
		onActionClick : function (e, query) {
			//e.preventDefault();
			//document.location.href = "ask.html?q=" + escape(query);
			alert("Open the Q&A form with this question: " + query);
			//return false;
		}
	});
});