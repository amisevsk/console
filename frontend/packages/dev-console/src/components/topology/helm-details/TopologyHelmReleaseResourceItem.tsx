import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

type TopologyHelmReleaseResourceItemProps = {
  item: K8sResourceKind;
};

const TopologyHelmReleaseResourceItem: React.FC<TopologyHelmReleaseResourceItemProps> = ({
  item,
}) => {
  const {
    kind,
    metadata: { name, namespace },
  } = item;

  return (
    <li className="list-group-item container-fluid">
      <div className="row">
        <span className="col-xs-12">
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </span>
      </div>
    </li>
  );
};

export default TopologyHelmReleaseResourceItem;
