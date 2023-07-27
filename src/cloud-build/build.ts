import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { ServiceAccount } from '../service-account';
import { Enabler, ServiceName } from '../services/enabler';

export interface BuildArgs {
	description?: Input<string>;
	location?: Input<string>;
	project?: Input<string>;
	serviceAccountDisplayName?: Input<string>;
}

export class Build extends ComponentResource {
	public constructor(
		name: string,
		{ description, location, project, serviceAccountDisplayName }: BuildArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:build', name, {}, opts);
		const serviceAccount = new ServiceAccount(
			`${name}-build`,
			{ project, displayName: serviceAccountDisplayName },
			{ parent: this, provider: opts?.provider },
		);

		new gcp.cloudbuild.Trigger(
			name,
			{
				tags: ['pulumi'],
				description,
				name,
				serviceAccount: serviceAccount.email,
				location,
				disabled: false,
				project,
			},
			{
				parent: this,
				dependsOn: [serviceAccount, Enabler.enableService(ServiceName.CLOUD_BUILD)],
				provider: opts?.provider,
			},
		);
	}
}
