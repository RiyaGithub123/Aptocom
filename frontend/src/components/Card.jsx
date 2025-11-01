import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  neonBorder = false,
  hover = false,
  padding = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const cardClass = `
    card 
    card-${variant} 
    card-padding-${padding}
    ${neonBorder ? 'card-neon-border' : ''} 
    ${hover ? 'card-hover' : ''}
    ${onClick ? 'card-clickable' : ''}
    ${className}
  `.trim();

  return (
    <div className={cardClass} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;
