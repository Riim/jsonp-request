
(function(undefined) {

	var idCounter = 0;

	/**
	 * @param {string} url
	 * @param {Object} [[opts]]
	 * @param {string} [opts.callbackKey='callback']
	 * @param {string} [opts.callbackName]
	 * @param {boolean} [opts.preventCaching=true]
	 * @param {boolean} [opts.cachingPreventionKey='noCache']
	 * @param {int} [opts.timeout=120000]
	 * @param {Function} cb
	 * @returns {{ abort: Function }}
	 */
	function send(url, opts, cb) {
		if (!cb) {
			cb = opts;
			opts = {};
		} else if (!opts) {
			opts = {};
		}

		var callbackKey = opts.callbackKey || 'callback';
		var callbackName = opts.callbackName || '__callback' + (++idCounter);
		var preventCaching = opts.preventCaching !== false;
		var cachingPreventionKey = opts.cachingPreventionKey || 'noCache';
		var timeout = opts.timeout || 120000;

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

			try {
				delete window[callbackName];
			} catch (err) {
				window[callbackName] = undefined;
			}

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
