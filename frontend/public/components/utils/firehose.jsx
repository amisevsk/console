import * as React from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { kindObj, inject } from './index';
import actions from '../../module/k8s/k8s-actions';

const { stopK8sWatch, watchK8sObject, watchK8sList } = actions;

export const makeReduxID = (k8sKind, query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${k8sKind.plural}${qs}`;
};

export const makeQuery = (namespace, labelSelector, fieldSelector, name) => {
  const query = {};

  if (!_.isEmpty(labelSelector)) {
    query.labelSelector = labelSelector;
  }

  if (!_.isEmpty(namespace)) {
    query.ns = namespace;
  }

  if (!_.isEmpty(name)) {
    query.name = name;
  }

  if (fieldSelector) {
    query.fieldSelector = fieldSelector;
  }
  return query;
};

const processReduxId = ({k8s}, props) => {
  const {reduxID, isList, filters} = props;

  if (!reduxID) {
    return {};
  }

  if (!isList) {
    const stuff = k8s.get(reduxID);
    return stuff ? stuff.toJS() : {};
  }

  const data = k8s.getIn([reduxID, 'data']);
  const _filters = k8s.getIn([reduxID, 'filters']);
  const selected = k8s.getIn([reduxID, 'selected']);

  return {
    data: data && data.toArray().map(p => p.toJSON()),
    // This is a hack to allow filters passed down from props to make it to
    // the injected component. Ideally filters should all come from redux.
    filters: _.extend({}, _filters && _filters.toJS(), filters),
    kind: props.kind,
    loadError: k8s.getIn([reduxID, 'loadError']),
    loaded: k8s.getIn([reduxID, 'loaded']),
    selected,
  };
};

// A wrapper Component that takes data out of redux for a list or object at some reduxID ...
// passing it to children
const ConnectToState = connect(({k8s}, {reduxes}) => {
  const resources = {};

  reduxes.forEach(redux => {
    resources[redux.prop] = processReduxId({k8s}, redux);
  });

  const required = _.filter(resources, r => !r.optional);
  const loaded = _.every(required, 'loaded');
  const loadError = _.map(required, 'loadError').filter(Boolean).join(', ');

  return Object.assign({}, resources, {
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loaded,
    loadError,
    reduxIDs: _.map(reduxes, 'reduxID'),
    resources,
  });
})(props => <div className={props.className}>
  {inject(props.children, _.omit(props, ['children', 'className', 'reduxes']))}
</div>);


/** @type {React.StatelessComponent<{resources: any[] }>} */
export const Firehose = connect(null, {stopK8sWatch, watchK8sObject, watchK8sList})(
  class Firehose extends React.PureComponent {
    componentWillMount (props=this.props) {
      const { watchK8sList, watchK8sObject, resources } = props;

      this.firehoses = resources.map(resource => {
        const query = makeQuery(resource.namespace, resource.selector, resource.fieldSelector, resource.name);
        const k8sKind = kindObj(resource.kind);
        const id = makeReduxID(k8sKind, query);
        return _.extend({}, resource, {query, id, k8sKind});
      });

      this.firehoses.forEach(({ id, query, k8sKind, isList, name, namespace }) => isList
        ? watchK8sList(id, query, k8sKind)
        : watchK8sObject(id, name, namespace, query, k8sKind)
      );
    }

    componentWillUnmount () {
      const { stopK8sWatch } = this.props;

      this.firehoses.forEach(({id}) => stopK8sWatch(id));
      this.firehoses = [];
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
      const currentResources = this.props.resources;

      const { resources, expand } = nextProps;

      if (_.intersectionWith(resources, currentResources, _.isEqual).length === resources.length) {
        if (_.get(nextContext, 'router.route.location.pathname') !== _.get(this.context, 'router.route.location.pathname')) {
          return true;
        }
        if (expand !== this.props.expand) {
          return true;
        }
        return false;
      }
      this.componentWillUnmount();
      this.componentWillMount(nextProps);
      return true;
    }

    render () {
      const reduxes = this.firehoses.map(({id, prop, isList, filters}) => ({reduxID: id, prop, isList, filters}));
      const children = inject(this.props.children, _.omit(this.props, [
        'children',
        'className',
      ]));

      return <ConnectToState reduxes={reduxes}> {children} </ConnectToState>;
    }
  }
);
Firehose.WrappedComponent.contextTypes = {
  router: PropTypes.object,
};

Firehose.contextTypes = {
  store: PropTypes.object,
};

Firehose.propTypes = {
  children: PropTypes.node,
  expand: PropTypes.bool,
  resources: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.string.isRequired,
    name: PropTypes.string,
    namespace: PropTypes.string,
    selector: PropTypes.object,
    fieldSelector: PropTypes.string,
    className: PropTypes.string,
    isList: PropTypes.bool,
  })).isRequired,
};
