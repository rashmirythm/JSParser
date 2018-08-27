
function(
		parentRequire,
		ResourceService,
		FilterOperator,
		LumiraFacet,
		// FacetItem,
		//UI5DateNumberConversionUtils,
		EditableTokenizer,
		//ComboBoxUtils,
		DataType,
		FilterCapabilityManager,
		LikePatternHelper,
		HashArray,
		MobileScrollingHelper,
		BrowserSupport)
		{
	"use strict";
	var UI5DateNumberConversionUtils=sap.bi.va.widgets.DateNumberConversionUtils;
	var messageBundle = ResourceService.getResource(parentRequire);

	jQuery.sap.declare({modName: "sap.bi.va.widgets.filter.FilterDialogView", type: "view"});
	jQuery.sap.require("sap.ui.core.mvc.JSView");

	var STYLE_SHOWING_LOV = "sapBiVaWidgetsFilterDialogSelectionAreaShowingLOV";
	var STYLE_SHOWING_NUMERIC_RANGE = "sapBiVaWidgetsFilterDialogSelectionAreaShowingNumericRange";
	var STYLE_SHOWING_DATE_RANGE = "sapBiVaWidgetsFilterDialogSelectionAreaShowingDateRange";
	var STYLE_SHOWING_TIME_RANGE = "sapBiVaWidgetsFilterDialogSelectionAreaShowingTimeRange";
	var STYLE_SHOWING_DATETIME_RANGE = "sapBiVaWidgetsFilterDialogSelectionAreaShowingDateTimeRange";
	var STYLE_SHOWING_LIKE = "sapBiVaWidgetsFilterDialogSelectionAreaShowingLike";
	var STYLE_SHOWING_SINGLE_INPUT = "sapBiVaWidgetsFilterDialogSelectionAreaShowingSingleInput";
	var STYLE_SHOWING_DATE_INPUT = "sapBiVaWidgetsFilterDialogSelectionAreaShowingDateInput";
	var STYLE_SHOWING_TIME_INPUT = "sapBiVaWidgetsFilterDialogSelectionAreaShowingTimeInput";
	var STYLE_SHOWING_DATETIME_INPUT = "sapBiVaWidgetsFilterDialogSelectionAreaShowingDateTimeInput";
	var STYLE_SHOWING_IS_NULL_INPUT = "sapBiVaWidgetsFilterDialogSelectionAreaShowingIsNullInput";

	var STYLE_SHOWING_MODES = [STYLE_SHOWING_LOV,
		STYLE_SHOWING_NUMERIC_RANGE,
		STYLE_SHOWING_DATE_RANGE,
		STYLE_SHOWING_TIME_RANGE,
		STYLE_SHOWING_DATETIME_RANGE,
		STYLE_SHOWING_LIKE,
		STYLE_SHOWING_SINGLE_INPUT,
		STYLE_SHOWING_DATE_INPUT,
		STYLE_SHOWING_TIME_INPUT,
		STYLE_SHOWING_DATETIME_INPUT,
		STYLE_SHOWING_IS_NULL_INPUT];

	var STYLE_CONTROL_NEEDS_VALUE = "sapBiVaWidgetsFilterDialogControlNeedsValue";
	var STYLE_CONTROL_HAS_INVALID_VALUE = "sapBiVaWidgetsFilterDialogControlHasInvalidValue";
	var STYLE_DISABLED_FACET = "exp-facet-area-transparent-overlay";

	var DEFAULT_TIME = "00:00:00.0";

	function getValueForItem(item) {
		// the value used for filtering should be the key if it is defined.
		return (item && item.key !== undefined) ? item.key : item;
	}

	sap.bi.va.widgets.filter.FilterDialogView = function(sId, mSettings) {
		this._validateSingleInput = this._validateSingleInput.bind(this);
		this._validateRangeInput = this._validateRangeInput.bind(this);
		this._validateLikePatternInput = this._validateLikePatternInput.bind(this);

		var settings = (typeof(sId) === "object") ? sId : mSettings;
		this._lovItemsProvider = settings && settings.lovItemsProvider;
		this._options = settings && settings.options;
		this._onFilterTypeChanged = settings && settings.onFilterTypeChanged;
		this._onFilterOperatorChanged = settings && settings.onFilterOperatorChanged;
		this._onFilterMinMaxChanged = settings && settings.onFilterMinMaxChanged;
		this._onFilterValuesChanged = settings && settings.onFilterValuesChanged;
		this._onFilterValueChanged = settings && settings.onFilterValueChanged;
		this._valueParser = settings && settings.valueParser;
		this._initialIsGlobal = settings && settings.isGlobal;
		this._enableOkButton = settings && settings.enableOkButton;
		var info = this._lovItemsProvider.getInfo();
		this._type = info.type;
		this._allowTextEditing = (this._isString() || this._isInteger()) && !info.isHierarchy();
		this._isTimeHierarchy = info.isHierarchy() && info.semanticType && info.semanticType.indexOf("time") === 0;
		this._isGeoEnrichment = !!info.geoEnrichment;
		this._numberRange = settings && settings.bounds;
		this._locale = UI5DateNumberConversionUtils.getDefaultFormatLocale();

		this._hasTargetFilterLinks = settings && settings.hasTargetFilterLinks;
		this._filterSource = settings && settings.filterSource;
		this._filterSourcePage = settings && settings.filterSourcePage;

		this._numberFormatter = function(value) {
			if (typeof value !== 'number') {
				return "";
			}
			return UI5DateNumberConversionUtils.formatNumberValue(value, this._locale);
		}.bind(this);

		this._numberParser = function(value) {
			if (typeof value !== 'string') {
				return undefined;
			}
			return UI5DateNumberConversionUtils.parseNumberValue(value, this._locale);
		};

		this._updateSupportedOperators();

		sap.ui.core.mvc.JSView.apply(this, arguments);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype = jQuery.sap.newObject(sap.ui.core.mvc.JSView.prototype);

	sap.bi.va.widgets.filter.FilterDialogView.prototype._getRangeStyle = function() {
		if (this._isNumeric()) {
			return STYLE_SHOWING_NUMERIC_RANGE;
		}
		if (this._isDate()) {
			return STYLE_SHOWING_DATE_RANGE;
		}
		if (this._isTime()) {
			return STYLE_SHOWING_TIME_RANGE;
		}
		if (this._isDateTime()) {
			return STYLE_SHOWING_DATETIME_RANGE;
		}
		return "";
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._getSingleInputStyle = function() {
		if (this._isString() || this._isNumeric()) {
			return STYLE_SHOWING_SINGLE_INPUT;
		}
		if (this._isDate()) {
			return STYLE_SHOWING_DATE_INPUT;
		}
		if (this._isTime()) {
			return STYLE_SHOWING_TIME_INPUT;
		}
		if (this._isDateTime()) {
			return STYLE_SHOWING_DATETIME_INPUT;
		}
		return "";
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._getSingleInputPlaceholderString = function() {
		if (this._isString()) {
			return messageBundle.getText("STRING_INITIAL_PLACEHOLDER");
		}
		if (this._isInteger()) {
			return messageBundle.getText("INTEGER_INITIAL_PLACEHOLDER");
		}
		if (this._isNumeric()) {
			return messageBundle.getText("NUMBER_INITIAL_PLACEHOLDER");
		}
		if (this._isTime() || this._isDateTime()) {
			return messageBundle.getText("TIME_INITIAL_PLACEHOLDER");
		}
		return "";
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._updateSupportedOperators = function() {
		this._supportedOperatorInfo = this._getSupportedOperators();
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._getSupportedOperators = function() {

		var allowRange = (this._isDateOrTime() || this._isNumeric());
		// We disable the range operator for time hierarchies since Nett doesn't support it properly
		var allowBetween = allowRange && (!this._isTimeHierarchy || this._isGlobalSelected());
		var allowLikeOperator = FilterCapabilityManager.isLikeOperatorSupported(this._type, this._isGeoEnrichment);
		var allowNewOperators = FilterCapabilityManager.newOperatorsAreSupported(this._isGeoEnrichment);

		var operatorInfo = new HashArray();

		operatorInfo.addElement(FilterOperator.IN, {operator: FilterOperator.IN, text: messageBundle.getText("OPERATOR_IS_IN_LIST"), style: STYLE_SHOWING_LOV});
		operatorInfo.addElement(FilterOperator.NOT_IN, {operator: FilterOperator.NOT_IN, text: messageBundle.getText("OPERATOR_NOT_IN_LIST"), style: STYLE_SHOWING_LOV});

		if (allowBetween) {
			operatorInfo.addElement(FilterOperator.BETWEEN, {operator: FilterOperator.BETWEEN, text: messageBundle.getText("OPERATOR_BETWEEN"), style: this._getRangeStyle(), validator: this._validateRangeInput});
		}

		if (allowNewOperators) {
			var singleInputStyle = this._getSingleInputStyle();

			// we disable equal and not equal for boolean types because it's not required functionality
			// and the use case is already covered by IN and NOT_IN for boolean.
			if (!this._isBoolean()) {
				operatorInfo.addElement(FilterOperator.EQUAL, {operator: FilterOperator.EQUAL, text: messageBundle.getText("OPERATOR_EQUAL"), style: singleInputStyle, validator: this._validateSingleInput});
				operatorInfo.addElement(FilterOperator.NOT_EQUAL, {operator: FilterOperator.NOT_EQUAL, text: messageBundle.getText("OPERATOR_NOT_EQUAL"), style: singleInputStyle, validator: this._validateSingleInput});
			}

			if (allowRange) {
				operatorInfo.addElement(FilterOperator.GREATER, {operator: FilterOperator.GREATER, text: messageBundle.getText("OPERATOR_GREATER"), style: singleInputStyle, validator: this._validateSingleInput});
				operatorInfo.addElement(FilterOperator.GREATER_EQUAL, {operator: FilterOperator.GREATER_EQUAL, text: messageBundle.getText("OPERATOR_GREATER_EQUAL"), style: singleInputStyle, validator: this._validateSingleInput});
				operatorInfo.addElement(FilterOperator.LESS, {operator: FilterOperator.LESS, text: messageBundle.getText("OPERATOR_LESS"), style: singleInputStyle, validator: this._validateSingleInput});
				operatorInfo.addElement(FilterOperator.LESS_EQUAL, {operator: FilterOperator.LESS_EQUAL, text: messageBundle.getText("OPERATOR_LESS_EQUAL"), style: singleInputStyle, validator: this._validateSingleInput});
			}

			// IS_NULL and IS_NOT_NULL were disabled because a lot of bugs existed
			// for these two operators, and we already have equivalent functionality with IN and NOT_IN.
			// If testing resources can handle it, we could potentially re-enable them in the future.
			//operatorInfo.addElement(FilterOperator.IS_NULL, {operator: FilterOperator.IS_NULL, text: messageBundle.getText("OPERATOR_IS_NULL"), style: STYLE_SHOWING_IS_NULL_INPUT});
			//operatorInfo.addElement(FilterOperator.IS_NOT_NULL, {operator: FilterOperator.IS_NOT_NULL, text: messageBundle.getText("OPERATOR_IS_NOT_NULL"), style: STYLE_SHOWING_IS_NULL_INPUT});

			if (this._isString()) {
				operatorInfo.addElement(FilterOperator.CONTAINS, {operator: FilterOperator.CONTAINS, text: messageBundle.getText("OPERATOR_CONTAINS"), style: singleInputStyle, validator: this._validateSingleInput});
			}
		}

		if (allowLikeOperator) {
			operatorInfo.addElement(FilterOperator.LIKE, {operator: FilterOperator.LIKE, text: messageBundle.getText("OPERATOR_LIKE"), style: STYLE_SHOWING_LIKE, validator: this._validateLikePatternInput});

			// We have this check below since NOT_LIKE is a new operator that is not supported in Hadoop yet.
			if (allowNewOperators) {
				operatorInfo.addElement(FilterOperator.NOT_LIKE, {operator: FilterOperator.NOT_LIKE, text: messageBundle.getText("OPERATOR_NOT_LIKE"), style: STYLE_SHOWING_LIKE, validator: this._validateLikePatternInput});
			}
		}

		return operatorInfo;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._updateComboBoxItems = function() {
		var oldKey = this._operatorDropdown.getSelectedKey();
		this._operatorDropdown.removeAllItems();

		var item;
		var item_in;

		var operatorInfoArray = this._supportedOperatorInfo.getArray();
		operatorInfoArray.forEach(function(operatorInfo) {
			item = new sap.ui.core.ListItem({});
			item.setText(operatorInfo.text);
			item.setKey(operatorInfo.operator);
			this._operatorDropdown.addItem(item);

			if (operatorInfo.operator === FilterOperator.IN) {
				item_in = item;
			}
		}.bind(this));

		// if the old operator is not longer in the list, then switch back to IN as default
		if (!this._supportedOperatorInfo.getElement(oldKey)) {
			this._operatorDropdown.setSelectedKey(FilterOperator.IN);
			this._operatorDropdown.fireChange({selectedItem: item_in});
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.createContent = function(oController) {
		this.oController = oController;
		this.addStyleClass("sapBiVaWidgetsFilterDialogView filterDialogSection");
		var verticalLayout = new sap.ui.layout.VerticalLayout({});
		verticalLayout.addStyleClass("sapBiVaWidgetsFilterDialogContentArea filterDialogLayout");

		var likeOperatorSupported = FilterCapabilityManager.isLikeOperatorSupported(this._type, this._isGeoEnrichment);
		var likeOperatorHelpIcon;

		this._facet = new sap.bi.va.widgets.ui5.LumiraFacetUI5({}); //LumiraFacet({});
		var facetOptions = $.extend({}, this._options);
		facetOptions.onSelect = function(itemIndex, event) {
			if (this._options.onSelect && this._facetEnabled) {
				this._options.onSelect(itemIndex, event);
			}
		}.bind(this);
		this._facet.setup(this._lovItemsProvider, facetOptions);

		// turn off the selectstart event (will apply to IE only)
		// to disable weird selection effects on shift clicking
		this._facet.getFacet().getWidgetDom().on('selectstart', false);

		// add a touchmove event to allow scrolling on iPad
		this._facet.getFacet().getWidgetDom().find(".exp-scrollwindow").on('touchmove',
				MobileScrollingHelper.getTouchMoveHandlerForScrollable(".exp-scrollwindow-sizer"));

		this._selectionAreaHorizLayout = new sap.ui.layout.HorizontalLayout({});
		this._selectionAreaHorizLayout.addStyleClass("sapBiVaWidgetsFilterDialogSelectionArea");
		this._selectionAreaHorizLayout.addStyleClass("filterdialogstyle");
		this._selectionAreaHorizLayout.addStyleClass(STYLE_SHOWING_LOV);

		this._operatorDropdown = new sap.m.ComboBox();
		this._operatorDropdown.addStyleClass("sapBiVaWidgetsFilterDialogOperatorDropdown filterDialogComboBox");
		//ComboBoxUtils.applyComboBoxFixes(this._operatorDropdown);
		this._updateComboBoxItems();

		this._operatorDropdown.attachSelectionChange(this._handleOperatorDropdownChange.bind(this));

		// Discrete Values

		this._editableTokenizer = new EditableTokenizer({});
		this._editableTokenizer.setEditable(this._allowTextEditing);
		this._editableTokenizer.addStyleClass("sapBiVaWidgetsFilterDialogSelectionTextArea");
		this._editableTokenizer.attachChange(this._handleEditableTokenizerChange.bind(this));
		if (this._isInteger()) {
			if (this._valueParser && this._valueParser.parse) {
				var oldParse = this._valueParser.parse.bind(this._valueParser);
				var nullText = this._valueParser.nullText;
				this._valueParser.parse = function(text) {
					if (text === nullText) { // <<null>>
					return oldParse(text);
					}
					// try to parse to be a valid integer
					var number = this._numberParser(text);
					if (this._type.isValidValue(number)) {
						return oldParse(number);
					} else {
						return {
							key: text,
							invalid: true,
							tooltip: messageBundle.getText("FILTER_DIALOG_INVALID_INTEGER_TOOLTIP", [text])
						};
					}
				}.bind(this);
			}
		}
		this._editableTokenizer.setValueParser(this._valueParser);

		// When operator is hidden, extend the editableTokenizer
		if (this._options.displayOptions && this._options.displayOptions.hideOperatorDropdown) {
			this._operatorDropdown.setVisible(false);
			this._editableTokenizer.addStyleClass("sapBiVaWidgetsFilterDialogSelectionTextAreaExtended");
		}

		// Numeric Range

		this._numericRangeStartText = new sap.m.TextArea({});
		this._numericRangeStartText.addStyleClass("sapBiVaWidgetsFilterDialogNumericRangeStartText");
		this._numericRangeStartText.setPlaceholder(messageBundle.getText(
				this._isInteger() ? "INTEGER_RANGE_START_INITIAL_PLACEHOLDER" : "NUMERIC_RANGE_START_INITIAL_PLACEHOLDER"));
		this._numericRangeStartText.attachChange(this._validateNumericRangeInput.bind(this));

		this._numericRangeLabel = new sap.m.Label({});
		this._numericRangeLabel.addStyleClass("sapBiVaWidgetsFilterDialogNumericRangeLabel");
		this._numericRangeLabel.setText(messageBundle.getText("NUMERIC_RANGE_SEPARATOR_LABEL"));

		this._numericRangeEndText = new sap.m.TextArea({});
		this._numericRangeEndText.addStyleClass("sapBiVaWidgetsFilterDialogNumericRangeEndText");
		this._numericRangeEndText.setPlaceholder(messageBundle.getText(
				this._isInteger() ? "INTEGER_RANGE_END_INITIAL_PLACEHOLDER" : "NUMERIC_RANGE_END_INITIAL_PLACEHOLDER"));
		this._numericRangeEndText.attachChange(this._validateNumericRangeInput.bind(this));

		// Date and time range
		this._oDateModel = new sap.ui.model.json.JSONModel();
		this._oDateModel.setData({
			startDate: null,
			endDate: null,
			singleDate: null
		});

		var dateType = new sap.ui.model.type.Date({
			pattern: UI5DateNumberConversionUtils.getDatePattern(this._locale),
			strictParsing: false
		});

		this._dateRangeStartPicker = new sap.m.DatePicker({
			value: {
				path: "/startDate",
				type: dateType
			}
		});
		this._dateRangeStartPicker.setModel(this._oDateModel);
		this._dateRangeStartPicker.addStyleClass("sapBiVaWidgetsFilterDialogDateRangeStartControl");
		this._dateRangeStartPicker.setPlaceholder(messageBundle.getText("DATE_RANGE_START_INITIAL_PLACEHOLDER"));
		this._dateRangeStartPicker.attachChange(this._validateDateTimeRangeInput.bind(this));
		//this._dateRangeStartPicker.setLocale(this._locale);

		this._timeRangeStartText = new sap.m.TextArea({});
		this._timeRangeStartText.addStyleClass("sapBiVaWidgetsFilterDialogTimeRangeStartText");
		this._timeRangeStartText.setPlaceholder(messageBundle.getText("TIME_RANGE_START_INITIAL_PLACEHOLDER"));
		this._timeRangeStartText.attachChange(this._validateDateTimeRangeInput.bind(this));

		this._dateRangeLabel = new sap.m.Label({});
		this._dateRangeLabel.addStyleClass("sapBiVaWidgetsFilterDialogDateRangeLabel");
		this._dateRangeLabel.setText(messageBundle.getText("DATE_RANGE_SEPARATOR_LABEL"));

		this._dateRangeEndPicker = new sap.m.DatePicker({
			value: {
				path: "/endDate",
				type: dateType
			}
		});
		this._dateRangeEndPicker.setModel(this._oDateModel);
		this._dateRangeEndPicker.addStyleClass("sapBiVaWidgetsFilterDialogDateRangeEndControl");
		this._dateRangeEndPicker.setPlaceholder(messageBundle.getText("DATE_RANGE_END_INITIAL_PLACEHOLDER"));
		this._dateRangeEndPicker.attachChange(this._validateDateTimeRangeInput.bind(this));
		//this._dateRangeEndPicker.setLocale(this._locale);

		this._timeRangeEndText = new sap.m.TextArea({});
		this._timeRangeEndText.addStyleClass("sapBiVaWidgetsFilterDialogTimeRangeEndText");
		this._timeRangeEndText.setPlaceholder(messageBundle.getText("TIME_RANGE_END_INITIAL_PLACEHOLDER"));
		this._timeRangeEndText.attachChange(this._validateDateTimeRangeInput.bind(this));

		this._singleDatePicker = new sap.m.DatePicker({
			value: {
				path: "/singleDate",
				type: dateType
			}
		});
		this._singleDatePicker.setModel(this._oDateModel);
		this._singleDatePicker.addStyleClass("sapBiVaWidgetsFilterDialogSingleDateControl");
		this._singleDatePicker.setPlaceholder(messageBundle.getText("DATE_SINGLE_VALUE_INITIAL_PLACEHOLDER"));
		this._singleDatePicker.attachChange(this._validateDateTimeSingleInput.bind(this));
		//this._singleDatePicker.setLocale(this._locale);

		this._singleInputText = new  sap.m.Input({});
		this._singleInputText.addStyleClass("sapBiVaWidgetsFilterDialogSingleInputText   filterDialogInputField");
		this._singleInputText.setPlaceholder(this._getSingleInputPlaceholderString());
		this._singleInputText.attachChange(this._validateSingleInput.bind(this));

		if (likeOperatorSupported) {
			this._likeText = new  sap.m.Input({});
			this._likeText.addStyleClass("sapBiVaWidgetsFilterDialogLikeText filterDialogLikeField");
			this._likeText.setPlaceholder(messageBundle.getText("LIKE_INITIAL_PLACEHOLDER"));
			this._likeText.attachChange(this._validateLikePatternInput.bind(this));

			jQuery.sap.require("sap.ui.core.IconPool");
			sap.ui.core.IconPool.addIcon("help", "filterDialog", "lumira-icon-fonts", "e043", true);
			likeOperatorHelpIcon = new sap.ui.core.Icon({
				src: sap.ui.core.IconPool.getIconURI("help", "filterDialog")
			});
			likeOperatorHelpIcon.addStyleClass("sapBiVaWidgetsFilterDialogLikeHelpIcon");

			var helpPopup = new sap.ui.core.Popup({
				opener : likeOperatorHelpIcon,
			});
			helpPopup.setContent(this._getLikeOperatorTooltipContent());
			helpPopup.setAutoClose(true);
			likeOperatorHelpIcon.attachPress(function () {
				if (helpPopup.isOpen()) {
					helpPopup.close();
				} else {
					helpPopup.open(sap.ui.core.Popup.Dock.BeginCenter, sap.ui.core.Popup.Dock.CenterCenter);
				}
			});
		}

		this._clearSelectedButton = new sap.m.Button({
			icon: sap.ui.core.IconPool.getIconURI("cancel", "fpa"),
			press : function() {
				this._numericRangeStartText.setValue("");
				this._numericRangeEndText.setValue("");

				if (BrowserSupport.isAppleMobile()) {
					this._dateRangeStartPicker.setPlaceholder("");
					this._dateRangeEndPicker.setPlaceholder("");
					this._singleDatePicker.setPlaceholder("");
				}
				else {
					/*this._dateRangeStartPicker.setYyyymmdd("");
                    this._dateRangeEndPicker.setYyyymmdd("");
                    this._singleDatePicker.setYyyymmdd("");*/
					this._dateRangeStartPicker.setDateValue(new Date(""))
					this._dateRangeEndPicker.setDateValue(new Date(""));
					this._singleDatePicker.setDateValue(new Date(""));
				}

				this._timeRangeStartText.setValue("");
				this._timeRangeEndText.setValue("");

				this._singleInputText.setValue("");

				if (this._likeText) {
					this._likeText.setValue("");
				}

				if (this._options.onClearSelectedValues) {
					this._options.onClearSelectedValues();
				}
				this._setValidated(true);
			}.bind(this)
		});
		//this._clearSelectedButton.addStyleClass("icon-close");
		this._clearSelectedButton.addStyleClass("sapBiVaWidgetsFilterDialogClearSelectedButton filterDialogCloseBtn");
		this._clearSelectedButton.setTooltip(messageBundle.getText("CLEAR_SELECTED_VALUES_TOOLTIP"));

		this._selectionAreaHorizLayout.addContent(this._operatorDropdown);
		this._selectionAreaHorizLayout.addContent(this._editableTokenizer);
		this._selectionAreaHorizLayout.addContent(this._numericRangeStartText);
		this._selectionAreaHorizLayout.addContent(this._numericRangeLabel);
		this._selectionAreaHorizLayout.addContent(this._numericRangeEndText);
		this._selectionAreaHorizLayout.addContent(this._dateRangeStartPicker);
		this._selectionAreaHorizLayout.addContent(this._timeRangeStartText);
		this._selectionAreaHorizLayout.addContent(this._dateRangeLabel);
		this._selectionAreaHorizLayout.addContent(this._dateRangeEndPicker);
		this._selectionAreaHorizLayout.addContent(this._timeRangeEndText);
		this._selectionAreaHorizLayout.addContent(this._singleDatePicker);
		this._selectionAreaHorizLayout.addContent(this._singleInputText);
		if (likeOperatorSupported) {
			this._selectionAreaHorizLayout.addContent(this._likeText);
			this._selectionAreaHorizLayout.addContent(likeOperatorHelpIcon);
		}
		this._selectionAreaHorizLayout.addContent(this._clearSelectedButton);

		var radioLayout = new sap.ui.layout.BlockLayout({});
		/*radioLayout.setLayoutFixed(false);
        radioLayout.setColumns(2);*/
        radioLayout.addStyleClass("sapBiVaWidgetsFilterDialogConvertFilterTypeArea");

        var radioButtonGroupName = "ConvertFilterTypeGroup";
        this._radioLocalFilter = new sap.m.RadioButton({
        	groupName : radioButtonGroupName,
        	select : function() {
        		this._updateSupportedOperators();
        		this._updateComboBoxItems();
        		var isGlobal = false;
        		this._onFilterTypeChanged(isGlobal);
        	}.bind(this)
        });
        this._radioLocalFilter.setText(messageBundle.getText("APPLY_TO_CURRENT_VIS"));
        this._radioLocalFilter.setSelected(! this._initialIsGlobal);
        this._radioLocalFilter.setEnabled(!!this._options.allowTypeChange);

        this._radioGlobalFilter = new sap.m.RadioButton({
        	groupName : radioButtonGroupName,
        	select : function() {
        		this._updateSupportedOperators();
        		this._updateComboBoxItems();
        		var isGlobal = true;
        		this._onFilterTypeChanged(isGlobal);
        	}.bind(this)
        });
        this._radioGlobalFilter.setText(messageBundle.getText("APPLY_TO_ENTIRE_DATASET"));
        this._radioGlobalFilter.addStyleClass("sapBiVaWidgetsFilterDialogRadioGlobalFilter");
        this._radioGlobalFilter.setSelected(!! this._initialIsGlobal);
        this._radioGlobalFilter.setEnabled(!!this._options.allowTypeChange);

        var radioLayoutCell = new sap.ui.layout.BlockLayoutCell({
        	content:[this._radioLocalFilter, this._radioGlobalFilter]
        });
        var radioLayoutRow = new sap.ui.layout.BlockLayoutRow({
        	content:[radioLayoutCell]
        });

        radioLayout.addContent(radioLayoutRow);
        //radioLayout.createRow(this._radioLocalFilter, this._radioGlobalFilter);

        this._validationMessageLabel = new sap.m.Label({});
        this._validationMessageLabel.addStyleClass("sapBiVaWidgetsFilterDialogValidationMessageLabel");
        if(this._hasTargetFilterLinks){
        	this._warningLayout = new sap.ui.layout.HorizontalLayout();
        	this._warningLayout.addStyleClass("warningFilterDialogLink");

        	var oWarningIcon = new sap.ui.core.Icon();
        	oWarningIcon.setSrc(sap.lumira.story.util.IconUtil.getIconSrc("warning"));
        	oWarningIcon.addStyleClass("warningFilterDialogLinkIcon");
        	oWarningIcon.setTooltip(null);
        	oWarningIcon.setVisible(true);
        	this._warningLayout.addContent(oWarningIcon);

        	var oWarningTextView = new sap.m.TextArea({
        		text: sap.lumira.story.settings.desktop.MessageHelper.getText("STORY_SETTINGS_DESKTOP_STS_FILTER_DIALOG_WARNING_DESCRIPTION"),
        		width: "100%"
        	});

        	this._warningLayout.addContent(oWarningTextView);
        	this._warningLayout.setVisible(false);
        }

        verticalLayout.addContent(this._facet);
        if(this._hasTargetFilterLinks){
        	verticalLayout.addContent(this._warningLayout);
        }
        verticalLayout.addContent(this._selectionAreaHorizLayout);
        verticalLayout.addContent(this._validationMessageLabel);

        if (!(this._options.displayOptions && this._options.displayOptions.hideTypeChangeOptions)) {
        	verticalLayout.addContent(radioLayout);
        }

        if (this._options.displayOptions && this._options.displayOptions.showStoryPageFilterRadios) {
        	var isStoryFilterSelected = this._options.displayOptions.isStoryFilterSelected;
        	var onChangeStoryPageFilter = this._options.displayOptions.onChangeStoryPageFilter || $.noop;

        	var matrixLayout = new sap.ui.layout.BlockLayout({});
        	/* matrixLayout.setLayoutFixed(false);
            matrixLayout.setColumns(2);*/
        	matrixLayout.addStyleClass("sapBiVaWidgetsFilterDialogConvertFilterTypeArea");

        	var radioButtonStoryPage = "StoryPageConverterGroup";
        	this._radioStoryFilter = new sap.m.RadioButton({
        		groupName : radioButtonStoryPage,
        		text: messageBundle.getText("APPLY_TO_STORY"),
        		selected: isStoryFilterSelected,
        		select: function() {
        			onChangeStoryPageFilter(true);
        		}
        	});

        	this._radioPageFilter = new sap.m.RadioButton({
        		groupName : radioButtonStoryPage,
        		text: messageBundle.getText("APPLY_TO_PAGE"),
        		selected: ! isStoryFilterSelected,
        		select: function() {
        			onChangeStoryPageFilter(false);
        		}
        	});

        	// Using globalFilter radioButton's style
        	this._radioPageFilter.addStyleClass("sapBiVaWidgetsFilterDialogRadioGlobalFilter");

        	var matrixLayoutCell = new sap.ui.layout.BlockLayoutCell({
        		content:[this._radioStoryFilter, this._radioPageFilter]
        	});

        	var matrixLayoutRow = new sap.ui.layout.BlockLayoutRow({
        		content:[matrixLayoutCell]
        	});

        	matrixLayout.addContent(matrixLayoutRow);
        	//matrixLayout.createRow(this._radioStoryFilter, this._radioPageFilter);
        	verticalLayout.addContent(matrixLayout);
        }

        verticalLayout.addStyleClass("sapBiVaWidgetsFilterDialogLayout");

        return verticalLayout;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isGlobalSelected = function() {
		if (!this._radioGlobalFilter) {
			return this._initialIsGlobal;
		}
		return !! this._radioGlobalFilter.getSelected();
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._getLikeOperatorTooltipContent = function() {
		var helpText = messageBundle.getText("LIKE_OPERATOR_TOOLTIP"),
		textView = new sap.m.TextArea();
		textView.setValue(helpText);
		textView.addStyleClass("sapBiVaWidgetsFilterDialogLikeTooltipText");

		return textView;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.setAllowTypeChange = function(allowTypeChange) {
		this._options.allowTypeChange = allowTypeChange;
		if (this._radioLocalFilter) {
			this._radioLocalFilter.setEnabled(allowTypeChange);
		}
		if (this._radioGlobalFilter) {
			this._radioGlobalFilter.setEnabled(allowTypeChange);
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isBoolean = function() {
		return this._type && this._type === DataType.boolean;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isString = function() {
		return this._type && this._type === DataType.string;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isDateOrTime = function() {
		// the isDate helper method on the DataType object returns true
		// if the type is a Date, Time, or DateTime.
		return this._type && this._type.isDate();
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isDate = function() {
		return this._type && this._type === DataType.date;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isTime = function() {
		return this._type && this._type === DataType.time;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isDateTime = function() {
		return this._type && this._type === DataType.datetime;
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isNumeric = function() {
		return this._type && this._type.isNumeric();
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._isInteger = function() {
		return this._type && (this._type === DataType.integer || this._type === DataType.biginteger);
	};

	/**
	 * Converts a string in the form yyyymmdd to a string in the form yyyy-mm-dd
	 * @param oDateVal
	 * @returns {String}
	 */
	sap.bi.va.widgets.filter.FilterDialogView.prototype._convertDateToFilterString = function(oDateVal) {
		if (oDateVal === null || oDateVal === undefined)
		{
			oDateVal = "";
		} else {
			var formattedDate = "yyyy-MM-dd";
			var formattedDateMap = formattedDate.split(/[-.\/]/);
			var month = oDateVal.getMonth()+1;
			var date = oDateVal.getDate();

			formattedDate = formattedDate.replace(formattedDateMap[0], oDateVal.getFullYear());
			formattedDate = formattedDate.replace(formattedDateMap[1], month < 10  ? "0" + month : month);
			formattedDate = formattedDate.replace(formattedDateMap[2], date < 10 ? "0" + date : date);
			return formattedDate;
		}
		/*var year = oDateVal.substring(0,4);
        var month = oDateVal.substring(4,6);
        var day = oDateVal.substring(6,8);
        return year + "-" + month + "-" + day;*/
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._toDatePickerString = function(dStr) {
		if (dStr === null || dStr === undefined) {
			return "";
		}
		return dStr;
		//return "" + dStr.substring(0,4) + dStr.substring(5,7)+ dStr.substring(8,10);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._setValidated = function(ok, highlightControl, message) {

		function hasEmptyValue(control) {
			if (!control) {
				return false;
			}
			var controlValue;
			if (control.getValue !== undefined) {
				controlValue = control.getValue();
				if (controlValue && controlValue.trim) {
					controlValue = controlValue.trim();
				}
			} else if (control.getValue !== undefined) {
				controlValue = control.getValue;
			}
			return controlValue === undefined || controlValue === null || controlValue === "";
		}

		// update highlighting on controls
		var oldControl = this._previousHighlightControl;
		if (oldControl) {
			oldControl.removeStyleClass(STYLE_CONTROL_HAS_INVALID_VALUE);
			oldControl.removeStyleClass(STYLE_CONTROL_NEEDS_VALUE);
		}

		var hasError = !ok && !hasEmptyValue(highlightControl);
		if (highlightControl) {
			if (hasError) {
				highlightControl.addStyleClass(STYLE_CONTROL_HAS_INVALID_VALUE);
			} else {
				highlightControl.addStyleClass(STYLE_CONTROL_NEEDS_VALUE);
			}
			highlightControl.focus();
		}
		this._previousHighlightControl = highlightControl;

		// show the validation message to the user, only if there is an error
		if (message && hasError) {
			this._validationMessageLabel.setText(message);
		} else {
			this._validationMessageLabel.setText("");
		}

		// enable the ok button
		if (this._enableOkButton) {
			this._enableOkButton(ok);
		}
	};

	// NOTE: This method is already very long and complex. If additional features are needed, consider refactoring.
	sap.bi.va.widgets.filter.FilterDialogView.prototype._validateDateTimeRangeInput = function(event, doNotFireUpdate) {
		var source;
		if (event) {
			source = event.getSource();
		}

		var hasDate = this._isDateTime() || this._isDate();
		var hasTime = this._isTime() || this._isDateTime();
		var hasTimestamp = this._isDateTime();

		var startDateFilter, endDateFilter, startTimeFilter, endTimeFilter;

		// start date
		if (hasDate) {
			var startDate = this._dateRangeStartPicker.getDateValue();
			if (!startDate) {
				this._setValidated(false, this._dateRangeStartPicker, messageBundle.getText("FILTER_DIALOG_INVALID_DATE_MESSAGE"));
				return;
			}
			startDateFilter = this._convertDateToFilterString(startDate);
		}

		// start time
		if (hasTime) {
			var startTimeValue = this._timeRangeStartText.getValue().trim();
			if (startTimeValue === "") {
				this._setValidated(false, this._timeRangeStartText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}

			startTimeFilter = UI5DateNumberConversionUtils.parseUserTimeString(startTimeValue, this._locale, hasTimestamp);

			if (startTimeFilter === "" || startTimeFilter === undefined) {
				this._setValidated(false, this._timeRangeStartText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}
		} else {
			startTimeFilter = DEFAULT_TIME;
			endTimeFilter = DEFAULT_TIME;
		}

		// end date
		if (hasDate) {
			var endDate = this._dateRangeEndPicker.getDateValue();
			if (!endDate) {
				this._setValidated(false, this._dateRangeEndPicker, messageBundle.getText("FILTER_DIALOG_INVALID_DATE_MESSAGE"));
				return;
			}
			endDateFilter = this._convertDateToFilterString(endDate);
		}

		// end time
		if (hasTime) {
			var endTimeValue = this._timeRangeEndText.getValue().trim();
			if (endTimeValue === "") {
				this._setValidated(false, this._timeRangeEndText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}
			endTimeFilter = UI5DateNumberConversionUtils.parseUserTimeString(endTimeValue, this._locale, hasTimestamp);

			if (endTimeFilter === "" || endTimeFilter === undefined) {
				this._setValidated(false, this._timeRangeEndText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}
		}

		var startFilter, endFilter, startMs, endMs;

		if (hasDate) {
			startFilter = startDateFilter;
			endFilter = endDateFilter;
			if (hasTime) {
				startFilter += " " + startTimeFilter;
				endFilter += " " + endTimeFilter;
			}

			startMs = UI5DateNumberConversionUtils.convertDateTimeStringToMilliseconds(startFilter);
			endMs = UI5DateNumberConversionUtils.convertDateTimeStringToMilliseconds(endFilter);
		} else {
			startFilter = startTimeFilter;
			endFilter = endTimeFilter;

			// for times, we compare them on a particular fixed day to be consistent
			var calculationDay = "2000-01-01";
			var calculationStart = calculationDay + " " + startTimeFilter;
			var calculationEnd = calculationDay + " " + endTimeFilter;
			startMs = UI5DateNumberConversionUtils.convertDateTimeStringToMilliseconds(calculationStart);
			endMs = UI5DateNumberConversionUtils.convertDateTimeStringToMilliseconds(calculationEnd);
		}

		if (startMs > endMs) {
			var messageText;
			var pickerToFocus;
			if (hasDate) {
				messageText = messageBundle.getText("FILTER_DIALOG_INVALID_DATE_START_GREATER_THAN_END");
				pickerToFocus = this._dateRangeStartPicker;
			} else {
				messageText = messageBundle.getText("FILTER_DIALOG_INVALID_TIME_START_GREATER_THAN_END");
				pickerToFocus = this._timeRangeStartText;
			}
			this._setValidated(false, source || pickerToFocus, messageText);
			return;
		}

		if (!doNotFireUpdate && this._onFilterMinMaxChanged) {
			this._onFilterMinMaxChanged({key:startFilter}, {key:endFilter});
		}
		this._setValidated(true);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._validateDateTimeSingleInput = function(event, doNotFireUpdate) {
		var hasDate = this._isDateTime() || this._isDate();
		var hasTime = this._isTime() || this._isDateTime();
		var hasTimestamp = this._isDateTime();

		var dateFilter, timeFilter;

		if (hasDate) {
			var date = this._singleDatePicker.getDateValue();
			var hasInvalidValue = event && event.getParameter("invalidValue");
			var isValid = !!date && !hasInvalidValue;
			if (!isValid) {
				this._setValidated(false, this._singleDatePicker, messageBundle.getText("FILTER_DIALOG_INVALID_DATE_MESSAGE"));
				return;
			}
			dateFilter = this._convertDateToFilterString(date);
		}

		if (hasTime) {
			var timeValue = this._singleInputText.getValue().trim();
			if (timeValue === "") {
				this._setValidated(false, this._singleInputText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}

			timeFilter = UI5DateNumberConversionUtils.parseUserTimeString(timeValue, this._locale, hasTimestamp);

			if (timeFilter === "" || timeFilter === undefined) {
				this._setValidated(false, this._singleInputText, messageBundle.getText("FILTER_DIALOG_INVALID_TIME_MESSAGE"));
				return;
			}
		} else {
			timeFilter = DEFAULT_TIME;
		}

		var filterValue;
		if (hasDate) {
			filterValue = dateFilter;
			if (hasTime) {
				filterValue += " " + timeFilter;
			}
		} else {
			filterValue = timeFilter;
		}

		if (!doNotFireUpdate && this._onFilterValueChanged) {
			this._onFilterValueChanged(filterValue);
		}
		this._setValidated(true);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._toggleStyleShowingMode = function(styleToShow) {
		var otherStyles = STYLE_SHOWING_MODES.filter(function(item){
			return item !== styleToShow;
		});
		otherStyles.forEach(function(style) {
			this._selectionAreaHorizLayout.removeStyleClass(style);
		}.bind(this));

		this._selectionAreaHorizLayout.addStyleClass(styleToShow);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._validateRangeInput = function() {
		if (this._isNumeric()) {
			this._validateNumericRangeInput();
		} else if (this._isDateOrTime()) {
			this._validateDateTimeRangeInput();
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._enableControlsForFilterOperator = function(operator) {
		if (this._currentFilterOperator === operator) {
			return;
		}
		this._currentFilterOperator = operator;

		this._operatorDropdown.setSelectedKey(operator);

		var operatorInfo = this._supportedOperatorInfo.getElement(operator);
		if (!operatorInfo) {
			// this shouldn't happen. trying to set an operator which is not supported.
			return;
		}
		var newStyle = operatorInfo.style;
		var validator = operatorInfo.validator;

		this._toggleStyleShowingMode(newStyle);
		if (validator) {
			var doNotFireUpdate = true;
			validator.call(this, undefined, doNotFireUpdate);
		} else {
			this._setValidated(true);
		}

		// toggle exclude style on facet
		var exclude = (operator === FilterOperator.NOT_IN);
		this._facet.getFacet().toggleClass("exp-facet-excluded", exclude);

		// enable facet when operator is "in" or "not in"
		this._facetEnabled = operator === FilterOperator.IN || operator === FilterOperator.NOT_IN;
		if (this._facetEnabled) {
			this._facet.getFacet().enable();
			this._facet.removeStyleClass(STYLE_DISABLED_FACET);
		} else {
			this._facet.getFacet().disable();
			this._facet.addStyleClass(STYLE_DISABLED_FACET);
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._handleOperatorDropdownChange = function(event) {

		var selectedItem = event.getParameter("selectedItem");
		if (selectedItem) {
			var newOperator = selectedItem.getKey();
			this._enableControlsForFilterOperator(newOperator);

			if(this._hasTargetFilterLinks){
				if (newOperator !== "IN"){
					this._warningLayout.setVisible(true);
				} else {
					this._warningLayout.setVisible(false);
				}
			}

			if (this._onFilterOperatorChanged) {
				this._onFilterOperatorChanged(FilterOperator[newOperator]);
			}
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._handleEditableTokenizerChange = function(event) {
		if (this._onFilterValuesChanged) {
			var values = this._editableTokenizer.getValues();
			this._onFilterValuesChanged(values, event.getParameter("edited"));
		}

		if (this._enableOkButton) {
			var ok = !this._editableTokenizer.hasInvalidValues();
			this._enableOkButton(ok);
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype._validateLikePatternInput = function(event, doNotFireUpdate) {
		var likePattern = this._likeText.getValue();
		if (likePattern === "") {
			this._setValidated(false, this._likeText, messageBundle.getText("FILTER_DIALOG_INVALID_LIKE_PATTERN_EMPTY"));
			return;
		}

		if (!LikePatternHelper.isLikePatternValid(likePattern)) {
			this._setValidated(false, this._likeText, messageBundle.getText(
					"FILTER_DIALOG_INVALID_LIKE_PATTERN_HAS_RESERVED_CHARACTER"));
			return;
		}

		if (!doNotFireUpdate && this._onFilterValueChanged) {
			this._onFilterValueChanged(likePattern);
		}
		this._setValidated(true);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.updateOperatorInDialog = function(newOperator) {
		this._enableControlsForFilterOperator(newOperator);
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.updateLOVFacet = function(displayInfo) {
		if (displayInfo && displayInfo.message) {
			this._facet.getFacet().maskMessage(displayInfo.message);
		} else {
			this._facet.getFacet().unmaskMessage();
			this._facet.getFacet().setTitle(this._lovItemsProvider.getInfo().title);
			this._facet.getFacet().setSubTitle(displayInfo && displayInfo.subTitle);
			this._facet.getFacet().setBubbleText(this._lovItemsProvider.getBubbleText());
			this._facet.getFacet().resetScrollWindows();
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.getControllerName = function() {
		return "sap.bi.va.widgets.filter.FilterDialogController";
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.setLovTextAreaContents = function(values) {
		if (this._editableTokenizer) {
			this._editableTokenizer.setValues(values);
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.setLikeOperatorValue = function(pattern) {
		if (this._likeText) {
			this._likeText.setValue(pattern);
			this._validateLikePatternInput(undefined, true);
		}
	};

	sap.bi.va.widgets.filter.FilterDialogView.prototype.setSingleOperatorValue = function(valueToSet) {
		var value = getValueForItem(valueToSet);

		if (this._isString()) {
			this._singleInputText.setValue(value);
			this._setValidated(true);
			return;
		}

		if (this._isNumeric()) {
			if (value !== undefined) {
				this._singleInputText.setValue(this._numberFormatter(value));
			}
			this._validateSingleInput(undefined, true);
			return;
		}

		var hasDate = this._isDate() || this._isDateTime();
		var hasTime = this._isTime() || this._isDateTime();

		if (hasDate) {
			if (value !== undefined) {
				this._singleDatePicker.setValue(this._toDatePickerString(value));
			}
		}
		if (hasTime) {
			if (value !== undefined) {
				this._singleInputText.setValue(this._formatTimeValue(value));
			}
		}
		if (this._isDateOrTime()) {
			this._validateDateTimeSingleInput(undefined, true);
		}
	};

	/**
	 * Given a time value coming from the database, format it in the current locale
	 * to show to the user.
	 * @param timeValue
	 * @returns {String}
	 */
	 sap.bi.va.widgets.filter.FilterDialogView.prototype._formatTimeValue = function(timeValue) {
		 if (typeof timeValue !== 'string') {
			 return "";
		 }
		 var timeString;

		 // extract just the time portion of the string.
		 if (this._isDateTime()) {
			 // skips over the yyyy-mm-dd and the space that separates it from the time portion
			 timeString = timeValue.substring(11);
		 } else {
			 timeString = timeValue;
		 }

		 var hasTimestamp = this._isDateTime();
		 return UI5DateNumberConversionUtils.formatUserTimeString(timeString, this._locale, hasTimestamp);
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype.updateMinMaxInDialog = function(min, max) {
		 if (this._isNumeric()) {
			 if (min !== undefined) {
				 this._numericRangeStartText.setValue(this._numberFormatter(getValueForItem(min)));
			 }

			 if (max !== undefined) {
				 this._numericRangeEndText.setValue(this._numberFormatter(getValueForItem(max)));
			 }

			 this._validateNumericRangeInput(undefined, true);
			 return;
		 }

		 var hasDate = this._isDate() || this._isDateTime();
		 var hasTime = this._isTime() || this._isDateTime();

		 if (hasDate) {
			 if (min !== undefined) {
				 this._dateRangeStartPicker.setValue(this._toDatePickerString(getValueForItem(min)));
			 }

			 if (max !== undefined) {
				 this._dateRangeEndPicker.setValue(this._toDatePickerString(getValueForItem(max)));
			 }
		 }
		 if (hasTime) {
			 if (min !== undefined) {
				 this._timeRangeStartText.setValue(this._formatTimeValue(getValueForItem(min)));
			 }

			 if (max !== undefined) {
				 this._timeRangeEndText.setValue(this._formatTimeValue(getValueForItem(max)));
			 }
		 }
		 if (this._isDateOrTime()) {
			 this._validateDateTimeRangeInput(undefined, true);
		 }
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype._validateNumericRangeInput = function(event, doNotFireUpdate) {
		 var source;
		 if (event) {
			 source = event.getSource();
		 }

		 var min = this._numericRangeStartText.getValue().trim();
		 var max = this._numericRangeEndText.getValue().trim();

		 if (min === "") {
			 this._setValidated(false, this._numericRangeStartText, messageBundle.getText("FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
			 return;
		 }

		 min = this._numberParser(min);

		 if (!this._type.isValidValue(min)) {
			 this._setValidated(false, this._numericRangeStartText, messageBundle.getText(
					 this._isInteger() ? "FILTER_DIALOG_INVALID_INTEGER_MESSAGE" : "FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
			 return;
		 }

		 if (this._numberRange && min < this._numberRange.min) {
			 this._setValidated(false, this._numericRangeStartText, messageBundle.getText("FILTER_DIALOG_INVALID_START_LESS_THAN_MIN", [this._numberRange.min]));
			 return;
		 }

		 if (max === "") {
			 this._setValidated(false, this._numericRangeEndText, messageBundle.getText("FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
			 return;
		 }

		 max = this._numberParser(max);

		 if (!this._type.isValidValue(max)) {
			 this._setValidated(false, this._numericRangeEndText, messageBundle.getText(
					 this._isInteger() ? "FILTER_DIALOG_INVALID_INTEGER_MESSAGE" : "FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
			 return;
		 }

		 if (this._numberRange && max > this._numberRange.max) {
			 this._setValidated(false, this._numericRangeEndText, messageBundle.getText("FILTER_DIALOG_INVALID_END_GREATER_THAN_MAX", [this._numberRange.max]));
			 return;
		 }

		 if (min > max) {
			 this._setValidated(false, source || this._numericRangeStartText,
					 messageBundle.getText("FILTER_DIALOG_INVALID_NUMBER_START_GREATER_THAN_END"));
			 return;
		 }

		 if (!doNotFireUpdate && this._onFilterMinMaxChanged) {
			 this._onFilterMinMaxChanged({key:min}, {key:max});
		 }
		 this._setValidated(true);
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype._validateSingleInput = function(event, doNotFireUpdate) {

		 if (this._isDateOrTime()) {
			 return this._validateDateTimeSingleInput(event, doNotFireUpdate);
		 }

		 var source;
		 if (event) {
			 source = event.getSource();
		 }

		 var value = this._singleInputText.getValue();
		 if (this._isNumeric()) {
			 value = value.trim();

			 if (value === "") {
				 this._setValidated(false, this._singleInputText, messageBundle.getText("FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
				 return;
			 }

			 value = this._numberParser(value);

			 if (!this._type.isValidValue(value)) {
				 this._setValidated(false, this._singleInputText, messageBundle.getText(
						 this._isInteger() ? "FILTER_DIALOG_INVALID_INTEGER_MESSAGE" : "FILTER_DIALOG_INVALID_NUMBER_MESSAGE"));
				 return;
			 }

			 if (this._numberRange && value < this._numberRange.min) {
				 this._setValidated(false, this._singleInputText, messageBundle.getText("FILTER_DIALOG_INVALID_VALUE_LESS_THAN_MIN", [this._numberRange.min]));
				 return;
			 }

			 if (this._numberRange && value > this._numberRange.max) {
				 this._setValidated(false, this._singleInputText, messageBundle.getText("FILTER_DIALOG_INVALID_VALUE_GREATER_THAN_MAX", [this._numberRange.max]));
				 return;
			 }
		 }

		 if (!doNotFireUpdate && this._onFilterValueChanged) {
			 this._onFilterValueChanged(value);
		 }
		 this._setValidated(true);
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype.setFacetMenu = function(menu) {
		 if (!this._facet) {
			 return;
		 }
		 this._facet.getFacet().setMenu(menu);
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype.toggleSearchBox = function(showSearchBox) {
		 if (!this._facet) {
			 return;
		 }
		 var facet = this._facet.getFacet();

		 if (showSearchBox || showSearchBox === undefined) {
			 facet.toggleSearchBox(true);
			 facet.focusSearchBox();
		 } else {
			 facet.toggleSearchBox(false);
		 }
	 };

	 sap.bi.va.widgets.filter.FilterDialogView.prototype.showLoadingAnimation = function(showAnimation) {
		 if (!this._facet) {
			 return;
		 }

		 if (showAnimation || showAnimation === undefined) {
			 this._facet.getFacet().startLoading();
		 } else {
			 this._facet.getFacet().cancelLoading();
		 }
	 };

	 return sap.bi.va.widgets.filter.FilterDialogView;
		};