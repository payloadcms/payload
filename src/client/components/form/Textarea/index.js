import React, { Component } from 'react';
import Tooltip from '../Tooltip';

import './Textarea.css';

class Textarea extends Component {

	errors = {
		text: 'Please fill in the field'
	}

	validate = () => {
		switch (this.props.type) {
			case 'honeypot':
				return this.el.value.length === 0 ? true : false;
			default:
				return this.el.value.length > 0 ? true : false;
		}
	}

	render() {

		const Required = this.props.required
			? () => <span className="required">*</span>
			: () => { return null };

		let Error = !this.props.valid
			? () => <Tooltip className="error-message">{this.errors.text}</Tooltip>
			: () => { return null };

		let className = `interact textarea`;
		className = this.props.valid ? className : className + ' error';

		let style = this.props.style
			? this.props.style
			: null;

		if (this.props.type === 'honeypot') {
			style = { position: 'fixed', left: '10000px', top: '-100px' };
			Error = () => null;
			className = 'interact';
		}

		return (
			<div className={className} style={style}>
				<label htmlFor={this.props.id}>
					{this.props.label}
					<Required />
					<Error />
				</label>
				<textarea
				ref={el => this.el = el}
				onBlur={this.validate}
				onFocus={this.props.onFocus}
				onChange={this.props.change}
				id={this.props.id}
				name={this.props.id}
				rows={this.props.rows ? this.props.rows : '5'}
				value={this.props.value}>
				</textarea>
			</div>
		)
	}
}

export default Textarea;
