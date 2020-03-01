﻿import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import './MobileClient.css';

class MobileClient extends React.PureComponent {

  render() {
    
    return (
      <div className='MobileClient'>
        <span className='MobileClientBalance'>{this.props.info.balance}</span>
        <NavLink to={"/client/"+this.props.info.id} className="MobileClientFIO">{this.props.info.fio}</NavLink>
      </div>
    );

  }

}

MobileClient.propTypes = {
  info:PropTypes.shape({
    id: PropTypes.number.isRequired,
    fio: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
  }),
};

export default MobileClient;
