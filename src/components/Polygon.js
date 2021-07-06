import React from 'react';
import PropTypes from 'prop-types';
var isEqual = require('lodash/isEqual');
import { arePathsEqual } from '../lib/arePathsEqual';
import { camelize } from '../lib/String';
const evtNames = ['click', 'rightclick', 'mouseout', 'mouseover', 'mousemove'];
const evtPathNames = ['set_at', 'insert_at', 'remove_at'];

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

export class Polygon extends React.Component {
  componentDidMount() {
    this.polygonPromise = wrappedPromise();
    this.renderPolygon();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps, this.props) || this.props.map !== prevProps.map || !arePathsEqual(this.props.paths, prevProps.paths)) {
      if (
          this.props.map !== prevProps.map ||
          !arePathsEqual(this.props.paths, prevProps.paths)
      ) {
        if (this.polygon) {
          this.polygon.setPaths(this.props.paths)
          evtPathNames.forEach((e) => {
            this.polygon.getPaths().forEach(path => {
              path.addListener(e, this.handleEvent(e));
            })
          });
        } else {
          this.renderPolygon();
        }
      } else {
        if (this.polygon) {
          this.polygon.setMap(null);
        }
        this.renderPolygon();
      }
    }
  }

  componentWillUnmount() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }
  }

  renderPolygon() {
    const {
      map,
      google,
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      ...props
    } = this.props;

    if (!google) {
        return null;
    }

    const params = {
      map,
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      ...props
    };

    this.polygon = new google.maps.Polygon(params);

    evtNames.forEach(e => {
      this.polygon.addListener(e, this.handleEvent(e));
    });

    evtPathNames.forEach(e => {
      this.polygon.getPaths().forEach(path=>{
        path.addListener(e, this.handleEvent(e));
      })
    });

    this.polygonPromise.resolve(this.polygon);
  }

  getPolygon() {
    return this.polygonPromise;
  }

  handleEvent(evt) {
    return (e) => {
      const evtName = `on${camelize(evt)}`
      if (this.props[evtName]) {
        this.props[evtName](this.props, this.polygon, e);
      }
    }
  }

  render() {
    return null;
  }
}

Polygon.propTypes = {
  paths: PropTypes.array,
  strokeColor: PropTypes.string,
  strokeOpacity: PropTypes.number,
  strokeWeight: PropTypes.number,
  fillColor: PropTypes.string,
  fillOpacity: PropTypes.number
}

evtNames.forEach(e => Polygon.propTypes[e] = PropTypes.func)

Polygon.defaultProps = {
  name: 'Polygon'
}

export default Polygon
