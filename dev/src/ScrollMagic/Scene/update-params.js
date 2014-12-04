/**
 * Update the start and end scrollOffset of the container.
 * The positions reflect what the controller's scroll position will be at the start and end respectively.
 * Is called, when:
 *   - Scene event "change" is called with: offset, triggerHook, duration 
 *   - scroll container event "resize" is called
 *   - the position of the triggerElement changes
 *   - the controller changes -> addTo()
 * @private
 */
var updateScrollOffset = function () {
	_scrollOffset = {start: _triggerPos + _options.offset};
	if (_controller && _options.triggerElement) {
		// take away triggerHook portion to get relative to top
		_scrollOffset.start -= _controller.info("size") * Scene.triggerHook();
	}
	_scrollOffset.end = _scrollOffset.start + _options.duration;
};

/**
 * Updates the duration if set to a dynamic function.
 * This method is called when the scene is added to a controller and in regular intervals from the controller through scene.refresh().
 * 
 * @fires {@link Scene.change}, if the duration changed
 * @fires {@link Scene.shift}, if the duration changed
 *
 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
 * @private
 */
var updateDuration = function (suppressEvents) {
	// update duration
	if (_durationUpdateMethod) {
		var varname = "duration";
		if (changeOption(varname, _durationUpdateMethod.call(Scene)) && !suppressEvents) { // set
			Scene.trigger("change", {what: varname, newval: _options[varname]});
			Scene.trigger("shift", {reason: varname});
		}
	}
};

/**
 * Updates the position of the triggerElement, if present.
 * This method is called ...
 *  - ... when the triggerElement is changed
 *  - ... when the scene is added to a (new) controller
 *  - ... in regular intervals from the controller through scene.refresh().
 * 
 * @fires {@link Scene.shift}, if the position changed
 *
 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
 * @private
 */
var updateTriggerElementPosition = function (suppressEvents) {
	var
		elementPos = 0,
		telem = _options.triggerElement;
	if (_controller && telem) {
		var
			controllerInfo = _controller.info(),
			containerOffset = _util.get.offset(controllerInfo.container), // container position is needed because element offset is returned in relation to document, not in relation to container.
			param = controllerInfo.vertical ? "top" : "left"; // which param is of interest ?
			
		// if parent is spacer, use spacer position instead so correct start position is returned for pinned elements.
		while (telem.parentNode.dataset.isScrollMagicPinSpacer) {
			telem = telem.parentNode;
		}

		var elementOffset = _util.get.offset(telem);

		if (!controllerInfo.isDocument) { // container is not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
			containerOffset[param] -= _controller.scrollPos();
		}

		elementPos = elementOffset[param] - containerOffset[param];
	}
	var changed = elementPos != _triggerPos;
	_triggerPos = elementPos;
	if (changed && !suppressEvents) {
		Scene.trigger("shift", {reason: "triggerElementPosition"});
	}
};

/**
 * Trigger a shift event, when the container is resized and the triggerHook is > 1.
 * @private
 */
var onContainerResize = function (e) {
	if (Scene.triggerHook() > 0) {
		Scene.trigger("shift", {reason: "containerResize"});
	}
};