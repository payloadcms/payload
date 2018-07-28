import React, { Component } from 'react';

import './Button.css';

class Button extends Component {
    render() {

        var classes = this.props.className ? `btn ${this.props.className}` : 'btn';

        if (this.props.type) {
            classes += ` btn-${this.props.type}`;
        }

        if (this.props.size) {
            classes += ` btn-${this.props.size}`;
        }
    
        if (this.props.icon) {
            classes += ` btn-icon`;
        }

        return (
            <button className={classes} onClick={this.props.onClick}>
                {this.props.children}
            </button>
        )
    }
}

export default Button;