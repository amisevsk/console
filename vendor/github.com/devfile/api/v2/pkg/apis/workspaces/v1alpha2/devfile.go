package v1alpha2

import (
	"github.com/devfile/api/v2/pkg/devfile"
)

// Devfile describes the structure of a cloud-native workspace and development environment.
// +k8s:deepcopy-gen=false
// +devfile:jsonschema:generate:omitCustomUnionMembers=true
type Devfile struct {
	devfile.DevfileHeader `json:",inline"`

	DevWorkspaceTemplateSpec `json:",inline"`
}
