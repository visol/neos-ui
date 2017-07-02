import SelectBox from '@neos-project/react-ui-components/src/SelectBox/';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$get, $transform} from 'plow-js';

import {selectors} from '@neos-project/neos-ui-redux-store';
import {neos} from '@neos-project/neos-ui-decorators';
import {getGuestFrameWindow} from '@neos-project/neos-ui-guest-frame/src/dom';

import {hideDisallowedToolbarComponents} from './Helpers';

//
// Predicate matching all "element.id"s starting with "prefix".
//
const startsWith = prefix => element => element.id.startsWith(prefix);

/**
 * The Actual StyleSelect component
 */
@connect($transform({
    focusedNode: selectors.CR.Nodes.focusedSelector,
    currentlyEditedPropertyName: selectors.UI.ContentCanvas.currentlyEditedPropertyName,
    formattingUnderCursor: selectors.UI.ContentCanvas.formattingUnderCursor
}))
@neos(globalRegistry => ({
    toolbarRegistry: globalRegistry.get('ckEditor').get('richtextToolbar'),
    globalRegistry
}))
export default class StyleSelect extends PureComponent {

    static propTypes = {
        // the Registry ID/Key of the Style-Select component itself.
        id: PropTypes.string.isRequired,

        focusedNode: PropTypes.object,
        currentlyEditedPropertyName: PropTypes.string,
        formattingUnderCursor: PropTypes.objectOf(PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.bool,
            PropTypes.object
        ])),

        toolbarRegistry: PropTypes.object.isRequired,
        globalRegistry: PropTypes.object.isRequired
    };

    constructor(...args) {
        super(...args);
        this.handleOnSelect = this.handleOnSelect.bind(this);
    }

    handleOnSelect(selectedStyleId) {
        const {toolbarRegistry} = this.props;
        const style = toolbarRegistry.get(selectedStyleId);
        if (style && style.formattingRule) {
            getGuestFrameWindow().NeosCKEditorApi.toggleFormat(style.formattingRule);
        } else {
            console.warn('Style formatting not set: ', selectedStyleId, style);
        }
    }

    render() {
        const {toolbarRegistry, currentlyEditedPropertyName, focusedNode} = this.props;
        const nodeTypeName = $get('nodeType', focusedNode);

        const enabledFormattingRuleIds = toolbarRegistry
            .getEnabledFormattingRulesForNodeTypeAndProperty(nodeTypeName)(currentlyEditedPropertyName);
        const nestedStyles = toolbarRegistry.getAllAsList()
            .filter(startsWith(`${this.props.id}/`))
            .filter(hideDisallowedToolbarComponents(enabledFormattingRuleIds[currentlyEditedPropertyName] || []));

        const options = nestedStyles.map(style => ({
            label: style.label,
            value: style.id
        }));

        if (options.length === 0) {
            return null;
        }

        const selectedStyle = nestedStyles.find(style =>
            $get(style.formattingRule, this.props.formattingUnderCursor)
        );

        return (
            <SelectBox
                options={options}
                value={selectedStyle ? selectedStyle.id : null}
                onSelect={this.handleOnSelect}
                />
        );
    }

}
