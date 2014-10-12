
(function(undefined) {

	var idCounter = 0;

	/**
	 * @param {string} url
	 * @param {Function} cb
	 * @param {Object} [options]
	 * @param {string} [options.callbackKey='callback']
	 * @param {string} [options.callbackName]
	 * @param {boolean} [options.preventCaching=true]
	 * @param {boolean} [options.cachingPreventionKey='_r']
	 * @param {int} [options.timeout=120000]
	 * @param {Function} [options.onFailure]
	 * @returns {{ abort:Function; }}
	 */
	function send(url, cb, options) {
		if (options == null) {
			options = {};
		}

		var callbackKey = options.callbackKey || 'callback';
		var callbackName = options.callbackName || '__callback' + (++idCounter);
		var preventCaching = options.preventCaching !== false;
		var cachingPreventionKey = options.cachingPreventionKey || '_r';
		var timeout = options.timeout || 120000;
		var onFailure = options.onFailure;

		var script = document.createElement('script');

		script.src = url + (url.indexOf('?') != -1 ? '&' : '?') + callbackKey + '=' + callbackName +
			(preventCaching ? '&' + cachingPreventionKey + '=' + Math.random() : '');

		script.async = true;

		script.onerror = function() {
			dispose();

			if (onFailure) {
				onFailure.call(window);
			}
		};

		var timerId = setTimeout(function() {
			dispose();

			if (onFailure) {
				onFailure.call(window);
			}
		}, timeout);

		window[callbackName] = function() {
			dispose();
			cb.apply(this, arguments);
		};

		var disposed = false;

		function dispose() {
			if (disposed) {
				return;
			}

			disposed = true;

			clearTimeout(timerId);
			delete window[callbackName];
			script.onerror = null;
			script.parentNode.removeChild(script);
		}

		(document.head || document.documentElement).appendChild(script);

		return {
			abort: function() {
				if (disposed) {
					return;
				}

				dispose();

				if (onFailure) {
					onFailure.call(window);
				}
			}
		};
	}

	window.jsonpRequest = {
		send: send
	};

})();
