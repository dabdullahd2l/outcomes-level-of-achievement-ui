/**
`d2l-squishy-button-selector`
Polymer Web-Component for a responsive list of selectable buttons

@demo demo/d2l-squishy-button-selector.html
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-colors/d2l-colors.js';
import 'd2l-polymer-behaviors/d2l-focusable-arrowkeys-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-squishy-button-selector">
	<template strip-whitespace="">
		<style>
			:host {
				display: flex;
				height: 1.6rem;
				background: white;
				position: relative;
				border-radius: 6px;
			}

			::slotted(d2l-squishy-button:last-of-type) {
				border-top-right-radius: 6px;
				border-bottom-right-radius: 6px;
			}

			:host(:dir(rtl)) ::slotted(d2l-squishy-button:last-of-type),
			:host-context([dir="rtl"]) ::slotted(d2l-squishy-button:last-of-type) {
				border-top-left-radius: 6px;
				border-bottom-left-radius: 6px;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}

			::slotted(d2l-squishy-button:first-of-type) {
				border-top-left-radius: 6px;
				border-bottom-left-radius: 6px;
			}

			:host(:dir(rtl)) ::slotted(d2l-squishy-button:first-of-type),
			:host-context([dir="rtl"]) ::slotted(d2l-squishy-button:first-of-type) {
				border-top-right-radius: 6px;
				border-bottom-right-radius: 6px;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}

			:host([disabled]) {
				cursor: default;
				pointer-events: none;
			}

			[hidden] {
				display: none !important;
			}
		</style>

		<slot></slot>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);
Polymer({
	is: 'd2l-squishy-button-selector',

	properties: {
		selectedIndex: {
			type: Number,
			notify: true,
			observer: '_updateButtonSelectedAttribute'
		},
		disabled: {
			type: Boolean,
			value: false,
			reflectToAttribute: true,
			observer: '_disabledChanged'
		},
		ariaDisabled: {
			type: Boolean,
			reflectToAttribute: true,
			readOnly: true,
			computed: '_getDisabled(disabled)'
		},
		ariaLabel: {
			type: String,
			reflectToAttribute: true
		},
		tooltipPosition: {
			type: String,
			reflectToAttribute: true
		}
	},

	hostAttributes: {
		tabindex: '0',
		role: 'radiogroup'
	},

	behaviors: [
		D2L.PolymerBehaviors.FocusableArrowKeysBehavior
	],

	listeners: {
		'd2l-squishy-button-selection-changed': '_onItemSelected',
		'squishy-button-text-changed': '_setShortTextIfAppropriate'
	},

	ready: function() {
		afterNextRender(this, /* @this */ function() {
			this._handleDomChanges();
			this._slotObserver = dom(this).observeNodes(this._handleDomChanges);
			this.addEventListener('focus', this._onFocus, true);
			this.addEventListener('blur', this._onBlur, true);
			this.addEventListener('mouseover', this._onHover, true);

			this.arrowKeyFocusablesContainer = this;
			this.arrowKeyFocusablesProvider = function() {
				return Promise.resolve(this._buttons);
			}.bind(this);

			this._updateButtonSelectedAttribute(this.selectedIndex);
			this._setShortTextIfAppropriate();
		});

		this._disabledChanged(this.disabled);
	},

	detached: function() {
		if (this._slotObserver) {
			dom(this).unobserveNodes(this._slotObserver);
		}
		this.removeEventListener('focus', this._onFocus);
		this.removeEventListener('blur', this._onBlur);
		this.removeEventListener('mouseover', this._onHover);
	},

	_getDisabled: function(disabled) {
		return disabled;
	},

	_handleDomChanges: function() {
		this._getListOfAllButtons();
		this._setButtonProperties();
		this._updateButtonSelectedAttribute();
	},

	_getListOfAllButtons: function() {
		var childrenArray = this.getEffectiveChildren();
		this._buttons = childrenArray.filter(function(tag) {
			return tag.nodeName === 'D2L-SQUISHY-BUTTON';
		}) || [];
	},

	_setButtonProperties: function() {
		if (!this._buttons) {
			return;
		}

		for (var i = 0; i < this._buttons.length; i++) {
			var button = this._buttons[i];
			button.setAttribute('index', i);
			if (this.disabled) {
				button.setAttribute('disabled', '');
			} else {
				button.removeAttribute('disabled');
			}
			if (this.tooltipPosition) {
				button.setAttribute('tooltip-position', this.tooltipPosition);
			}
		}
	},

	_updateButtonSelectedAttribute: function(selectedIndex) {
		if (!this._buttons) {
			return;
		}

		if (selectedIndex === undefined) {
			var selected = this._buttons.filter(function(button) {
				return button.hasAttribute('selected');
			});
			if (selected.length > 0) {
				this.selectedIndex = selected[0].index;
				return;
			}
		}

		for (var i = 0; i < this._buttons.length; i++) {
			if (i === selectedIndex) {
				this._buttons[i].setAttribute('selected', '');
				this._buttons[i].setAttribute('aria-checked', 'true');
			} else {
				this._buttons[i].removeAttribute('selected');
				this._buttons[i].setAttribute('aria-checked', 'false');
			}
		}
	},

	_onItemSelected: function(event) {
		if (event.detail.selected) {
			this.selectedIndex = event.detail.index;
		} else if (this.selectedIndex === event.detail.index) {
			this.selectedIndex = undefined;
		}
		event.preventDefault();
	},

	_setShortTextIfAppropriate: function() {
		if (!this._buttons || this._buttons.length === 0) {
			return;
		}

		var regex = /([^\d]*)(\d+)$/;

		var toMatch;
		var prevNum;

		var toSet = [];
		var hasShortText = true;

		for (var i = 0; i < this._buttons.length; i++) {
			var text = this._buttons[i].getAttribute('text');
			var match = regex.exec(text || '');
			if (!match) {
				hasShortText = false;
				break;
			}
			var preText = match[1];
			var num = Number.parseInt(match[2]);
			if (!toMatch) {
				toMatch = preText;
				prevNum = num;
			} else {
				if (preText !== toMatch || num !== ++prevNum) {
					hasShortText = false;
					break;
				}
			}

			toSet.push({
				button: this._buttons[i],
				text: num
			});
		}

		if (hasShortText) {
			toSet.forEach(function(item) {
				item.button.setAttribute('short-text', item.text);
			});
		} else {
			this._buttons.forEach(function(button) {
				button.removeAttribute('short-text');
			});
		}
	},

	_onFocus: function(event) {
		if (this.disabled || this._focused) {
			return;
		}

		this._pushTabIndex('-1');

		var focusIndex = (this.selectedIndex > -1 && this.selectedIndex) || 0;
		if ((this._buttons || [])[focusIndex] && event.target.nodeName === 'D2L-SQUISHY-BUTTON-SELECTOR') {
			this._buttons[focusIndex].focus();
		}
		this._focused = true;
	},

	_onBlur: function() {
		this._focused = false;
		this._popTabIndex('-1');
	},

	_pushTabIndex: function(tabindex) {
		if (this._prevTabIndex === null || this._prevTabIndex === undefined) {
			this._prevTabIndex = this.hasAttribute('tabindex') ?  this.getAttribute('tabindex') : null;
		}
		this.setAttribute('tabindex', tabindex);
	},

	_popTabIndex: function() {
		this.setAttribute('tabindex', this._prevTabIndex);
		this._prevTabIndex = null;
	},

	_disabledChanged: function(disabled) {
		var buttonList = this;

		this._setButtonProperties();
		if (disabled && buttonList.getAttribute('tabindex') === '-1'
			|| !disabled && buttonList.getAttribute('tabindex') === '0'
		) {
			return;
		}

		if (disabled) {
			this._pushTabIndex('-1');
		} else if (this._prevTabIndex !== null && this._prevTabIndex !== '-1') {
			this._popTabIndex();
		} else {
			buttonList.setAttribute('tabindex', '0');
		}
	}
});
