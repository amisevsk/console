package terminal

import (
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

const (
	webhookName = "workspace.che.eclipse.org"
)

func workspaceOperatorIsRunning() (bool, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return false, err
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return false, err
	}

	_, err = client.AdmissionregistrationV1().MutatingWebhookConfigurations().Get(webhookName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}

	_, err = client.AdmissionregistrationV1().ValidatingWebhookConfigurations().Get(webhookName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}