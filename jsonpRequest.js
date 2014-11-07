
(function(undefined) {

	var idCounter = 0;

	/**
	 * @param {string} url
	 * @param {Object} [[options]]
	 * @param {string} [options.callbackKey='callback']
	 * @param {string} [options.callbackName]
	 * @param {boolean} [options.preventCaching=true]
	 * @param {boolean} [options.cachingPreventionKey='noCache']
	 * @param {int} [options.timeout=120000]
	 * @param {Function} cb
	 * @returns {{ abort:Function; }}
	 */
	function send(url, options, cb) {
		if (!cb) {
			cb = options;
			options = {};
		} else if (!options) {
			options = {};
		}

		var callbackKey = options.callbackKey || 'callback';
		var callbackName = options.callbackName || '__callback' + (++idCounter);
		var preventCaching = options.preventCaching !== false;
		var cachingPreventionKey = options.cachingPreventionKey || 'noCache';
		var timeout = options.timeout || 120000;

		var expired = false;
		var aborted = false;
		var loaded = false;
		var success = false;
		var disposed = false;

		var script = document.createElement('script');

		script.src = url + (url.indexOf('?') == -1 ? '?' : '&') + callbackKey + '=' + callbackName +
			(preventCaching ? '&' + cachingPreventionKey + '=' + Math.random() : '');

		script.async = true;

		script.onload = script.onreadystatechange = function() {
			if ((script.readyState && script.readyState != 'complete' && script.readyState != 'loaded') || loaded) {
				return;
			}

			loaded = true;

			setTimeout(function() {
				if (success) {
					return;
				}

				dispose();

				if (expired || aborted) {
					return;
				}

				cb(new Error('Invalid response or loading error'), null);
			}, 1);
		};

		script.onerror = function() {
			if (success) {
				return;
			}

			dispose();

			if (expired || aborted) {
				return;
			}

			cb(new Error('Script error'), null);
		};

		var timerId = setTimeout(function() {
			if (aborted) {
				return;
			}

			expired = true;

			cb(new Error('Timeout error'), null);
		}, timeout);

		window[callbackName] = function(data) {
			dispose();

			if (expired || aborted) {
				return;
			}

			success = true;
			cb(null, data);
		};

		function dispose() {
			if (disposed) {
				return;
			}

			disposed = true;

			script.onload = script.onreadystatechange = script.onerror = null;
			clearTimeout(timerId);
			delete window[callbackName];
			script.parentNode.removeChild(script);
		}

		(document.head || document.documentElement).appendChild(script);

		return {
			abort: function() {
				aborted = true;
			}
		};
	}

	window.jsonpRequest = {
		send: send
	};

})();
