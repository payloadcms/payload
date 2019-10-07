import React from 'react';

import './index.scss';

const Section = props => {
  return (
    <section className={`section${props.className ? ` ${props.className}` : ''}`}>
      {props.heading &&
        <header>
          <h2>{props.heading}</h2>
        </header>
      }
      <div className="content">
        {props.children}
      </div>
    </section>
  )
}

export default Section;
