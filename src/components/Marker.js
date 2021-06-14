import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
var isEqual = require('lodash/isEqual');

import { camelize } from '../lib/String'

const evtNames = [
  'click',
  'rightclick',
  'dblclick',
  'dragend',
  'mousedown',
  'mouseout',
  'mouseover',
  'mouseup',
  'recenter',
];

const wrappedPromise = function() {
    var wrappedPromise = {},
        promise = new Promise(function (resolve, reject) {
            wrappedPromise.resolve = resolve;
            wrappedPromise.reject = reject;
        });
    wrappedPromise.then = promise.then.bind(promise);
    wrappedPromise.catch = promise.catch.bind(promise);
    wrappedPromise.promise = promise;

    return wrappedPromise;
}

export class Marker extends React.Component {

  componentDidMount() {
    this.markerPromise = wrappedPromise();
    this.renderMarker();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual({...this.props, mapCenter:null}, {...prevProps, mapCenter:null})) {
      if (!isEqual(this.props.position, prevProps.position)) {
        if (prevProps.position !== undefined) {
          let result = [this.props.position.lat, this.props.position.lng];
          let PrevResult = [prevProps.position.lat,  prevProps.position.lng];
          let latlng = new google.maps.LatLng(result[0], result[1]);
          if (this.marker) this.marker.setPosition(latlng);
          if (!isEqual(this.props.icon, prevProps.icon)) {
            this.marker && this.marker.setIcon(this.props.icon);
          }
        }
      } else {
        if (this.marker) {
          if (!isEqual(this.props.icon, prevProps.icon)) {
            this.marker.setIcon(this.props.icon);
          } else {
            if (!isEqual(this.props.title, prevProps.title)) {
              if (this.marker) {
                this.marker.setTitle(this.props.title);
              }
            } else {
              if (this.props.draggable !== prevProps.draggable) {
                this.marker.setDraggable(this.props.draggable);
              } else {
                if (this.marker) {
                  this.marker.setMap(null);
                }
                this.renderMarker();
              }
            }
          }
        }

      }
    }
  }

  componentWillUnmount() {
    if (this.marker) {
      this.marker.setMap(null);
    }
  }

  renderMarker() {
    const {
      map,
      google,
      position,
      mapCenter,
      icon,
      label,
      draggable,
      title,
      ...props
    } = this.props;
    if (!google) {
      return null
    }

    let pos = position || mapCenter;
    if (!(pos instanceof google.maps.LatLng)) {
      pos = new google.maps.LatLng(pos.lat, pos.lng);
    }

    const pref = {
      map,
      position: pos,
      icon,
      label,
      title,
      draggable,
      ...props
    };
    this.marker = new google.maps.Marker(pref);

    evtNames.forEach(e => {
      this.marker.addListener(e, this.handleEvent(e));
    });

    this.markerPromise.resolve(this.marker);
  }

  getMarker() {
    return this.markerPromise;
  }

  handleEvent(evt) {
    return (e) => {
      const evtName = `on${camelize(evt)}`
      if (this.props[evtName]) {
        this.props[evtName](this.props, this.marker, e);
      }
    }
  }

  render() {
    return (
      <Fragment>
        {this.props.children && this.marker ?
          React.Children.only(
            React.cloneElement(
              this.props.children,
              { marker: this.marker,
                google: this.props.google,
                map: this.props.map}
            )
          ) : null
        }
      </Fragment>
    )
  }
}

Marker.propTypes = {
  position: PropTypes.object,
  map: PropTypes.object
}

evtNames.forEach(e => Marker.propTypes[e] = PropTypes.func)

Marker.defaultProps = {
  name: 'Marker'
}

export default Marker
