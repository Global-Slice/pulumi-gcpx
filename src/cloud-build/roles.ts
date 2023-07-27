export enum CloudBuildRoles {
	CLOUD_BUILD_APPROVER = 'roles/cloudbuild.builds.approver',
	CLOUD_BUILD_SERVICE_ACCOUNT = 'roles/cloudbuild.builds.builder',
	CLOUD_BUILD_EDITOR = 'roles/cloudbuild.builds.editor',
	CLOUD_BUILD_VIEWER = 'roles/cloudbuild.builds.viewer',
	CLOUD_BUILD_CONNECTION_ADMIN = 'roles/cloudbuild.builds.connectionAdmin',
	CLOUD_BUILD_CONNECTION_VIEWER = 'roles/cloudbuild.builds.connectionViewer',
	CLOUD_BUILD_INTEGRATIONS_EDITOR = 'roles/cloudbuild.builds.integrationsEditor',
	CLOUD_BUILD_INTEGRATIONS_OWNER = 'roles/cloudbuild.builds.integrationsOwner',
	CLOUD_BUILD_INTEGRATIONS_VIEWER = 'roles/cloudbuild.builds.integrationsViewer',
	CLOUD_BUILD_READ_ONLY_TOKEN_ACCESSOR = 'roles/cloudbuild.builds.readTokenAccessor',
	CLOUD_BUILD_TOKEN_ACCESSOR = 'roles/cloudbuild.builds.tokenAccessor',
}
