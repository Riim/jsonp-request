
(function(undefined) {

	var callbackIdCounter = 0;

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
		var callbackName = options.callbackName || '__callback' + (++callbackIdCounter);
		var preventCaching = options.preventCaching !== false;
		var cachingPreventionKey = options.cachingPreventionKey || 'noCache';
		var timeout = options.timeout || 120000;

		var script = document.createElement('script');

		script.src = url + (url.indexOf('?') == -1 ? '?' : '&') + callbackKey + '=' + callbackName +
			(preventCaching ? '&' + cachingPreventionKey + '=' + Math.random() : '');

		script.async = true;

		script.onerror = function() {
			dispose();
			cb(new Error('Script error'), null);
		};

		var timerId = setTimeout(function() {
			dispose();
			cb(new Error('Timeout error'), null);
		}, timeout);

		window[callbackName] = function(data) {
			dispose();
			cb(null, data);
		};

		var disposed = false;

		function dispose() {
			disposed = true;

			script.onerror = null;
			clearTimeout(timerId);
			delete window[callbackName];
			script.parentNode.removeChild(script);
		}

		(document.head || document.documentElement).appendChild(script);

		return {
			abort: function() {
				if (!disposed) {
					dispose();
					cb(new Error('Aborted'), null);
				}
			}
		};
	}

	window.jsonpRequest = {
		send: send
	};

})();
