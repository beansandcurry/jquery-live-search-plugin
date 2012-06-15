$.fn.bcLiveSearch = function (options) {
	var id = 0,
		defaultOptions = {
			textChangeDelay : 500,
			source : "",
			ajaxOptions : {
				parameterName : '',
				type : 'GET'
			},
			markup : {
				resultsClass : '',
				action : {
					text : "Ask a Question",
					class : "bcls-btn"
				}
			},
			/* URL to go to when click on the action button. Is overrided by onActionClick option */
			ActionUrl : "#",
			/* Define a click event for the action button */
			onActionClick : function (currentSearchTerm) {
			}
		};

	
	return this.each(function () {
		var searchTerm,
			thisId = id,
			input = $(this),
			clearSearchResults = function () {
				$("#bcls-results-" + thisId).hide();
			},
			/*
			 Function taken from jQuery Autocomplete Plugin by JÖRN ZAEFFERER
			 http://bassistance.de/jquery-plugins/jquery-plugin-autocomplete/

			 Highlights the search terms in the result strings.
			 */
			highlightSearch = function (value, term) {
				return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
			},
			getMarkup = function (searchTerm, results, options) {
				var markup = "";

				markup = '<div class="bcls-results ' + options.markup.resultsClass + '" id="bcls-results-' + thisId + '">';
					markup += '<ul class="bcls-results-list">';
						if (results.length > 0) {
							$.each(results, function (index, value) {
								markup += '<li class="bcls-result">';
									markup += '<a href="/ask-an-advisor/' + value.permalink + '">';
										markup += '<span class="bcls-result-title">' + value.highlightedSearch() + '</span> <span class="bcls-result-type">' + value.type + '</span>';
									markup += '</a>';
								markup += '</li>';
							});
						}
						markup += '<li class="bcls-result bcls-action">';
							markup += '<span class="bcls-search-term">&ldquo;' + searchTerm + '&rdquo;</span> <a href="' + options.ActionUrl + '" class="bcls-action-btn ' + options.markup.action.class + '" id="bcls-action-btn-' + thisId + '">' + options.markup.action.text + '</a>';
						markup += '</li>';
					markup += '</ul>';
				markup += '</div>';
				return markup;
			};

		/* Convert options.source to a function, in case it's a string */
		options.getSource = function (searchTerm) {
			return options.source;
		}
		options = $.extend(defaultOptions, options);
		
		(function () {
			var results = [],
				resultsElement = '#bcls-results-' + thisId,
				currentElement = null,
				parentForm = input.parents("form"),
				ajaxCall,
				ajaxTimeout;


			clearSearchResults();
			/* Disable auto-complete for the search input field */
			input.attr("autocomplete", "off");

			input.bind("keydown", function (e) {
				switch (e.keyCode) {
					/* Tab: Exit the function, but continue propagation of the event */
					case 9:
						return;
						break;

					// Down key
					case 40:
						e.preventDefault();
						e.stopPropagation();

						/* Display the search results if they were hidden */
						$(resultsElement).css("display", "block");

						if (currentElement === null || currentElement.length <= 0) {
							currentElement = $(resultsElement).find("li").first().addClass("is-current");
						} else {
							/* If there are no more elements below, select the first item */
							currentElement.removeClass("is-current");
							if (currentElement.next("li").length <= 0) {
								currentElement = $(resultsElement).find("li").first().addClass("is-current");
							} else {
								currentElement = currentElement.next("li").addClass("is-current");
							}
						}
						return false;
						break;

					// Up key
					case 38:
						e.preventDefault();
						e.stopPropagation();

						if (currentElement === null || currentElement.length <= 0) {
							currentElement = $(resultsElement).find("li").last().addClass("is-current");
						} else {
							/* If there are no more elements above, select the last item */
							currentElement.removeClass("is-current");
							if (currentElement.prev("li").length <= 0) {
								currentElement = $(resultsElement).find("li").last().addClass("is-current");
							} else {
								currentElement = currentElement.prev("li").addClass("is-current");
							}
						}
						return false;

						break;

					// Enter key
					case 13:
						if ($(resultsElement).find(".is-current").length > 0) {
							currentElement = $(resultsElement).find(".is-current");
						}
						console.log(currentElement);
						if (currentElement !== null && currentElement.length > 0) {

							e.preventDefault();
							e.stopPropagation();

							if (currentElement.hasClass('bcls-action')) {
								/*
								If you passed a click even handler for the action button,
								this is where it'll be executed, otherwise go to the ActionUrl
								*/
								if (typeof options.onActionClick === "function") {
									options.onActionClick(e, input.val());
								} else {
									document.location.href = options.ActionUrl;
								}
							} else {
								document.location.href = currentElement.find("a").first().attr('href');
							}

							clearSearchResults();

							/* Reset the currentElement variable */
							currentElement.removeClass("is-current");
							currentElement = null;

							/* Stop it so it doesn't continue executing the script */
							return false;
						} else {
							//alert("Submit?");
							parentForm.submit();
						}
						return false;
						break;

					default:
						break;
				}
			});

			parentForm.submit(function (e) {
				e.preventDefault();
				e.stopPropagation();
			});

			$(window).bind("load", function () {
				setTimeout(function () {
					if (input.val().length > 0) {
						input.prev().addClass("has-text");
					}
				}, 200);
			});

			input.focus(function () {
				input.prev("label.label-inline").addClass("has-focus");
			});

			input.keypress(function () {
				input.prev("label.label-inline").addClass("has-text").removeClass("has-focus");
			});

			input.blur(function () {
				if(input.val() === "") {
					input.prev("label.label-inline").removeClass("has-text").removeClass("has-focus");
				}
			});

			/* Call the API everytime the text changes */
			input.bind("textchange", function () {
				if (typeof ajaxTimeout !== "undefined") {
					clearTimeout(ajaxTimeout);
				}
				ajaxTimeout = setTimeout(function () {
					currentElement = null;
					if (input.val().length > 0) {
						if (typeof ajaxCall !== "undefined") {
							/* Cancel the ajax call if there was a previous ajax call that hasn't been responded */
							ajaxCall.abort();
						}

						ajaxCall = $.ajax(options.getSource(input.val()), {
							type : options.ajaxOptions.type,
							data : options.ajaxOptions.parameterName!==""?options.ajaxOptions.parameterName + "=" + escape(input.val()):""
						});
						ajaxCall.done(function (data) {
							var html,
								view = {},
								markup;

							$(resultsElement).remove();
							view.results = data;
							$.each(view.results, function (index, result) {
								view.results[index].highlightedSearch = function (){
									return highlightSearch(view.results[index].title, input.val());
								}
							});

							html = getMarkup(input.val(), data, options);

							input.after(html);
							$(resultsElement).find(".bcls-action-btn").click(function () {
								if (typeof options.onActionClick === "function") {
									$('.bcls-action').click(function (e) {
										options.onActionClick(e, input.val());
									});
								} else {
									document.location.href = options.ActionUrl;
								}
							});
						});

					} else {
						input.blur().focus();
						$(resultsElement).remove();
					}
				}, options.textChangeDelay);
			});
			input.focus();
		})();

		/* Increase the global id by 1 */
		id++;
	});
};