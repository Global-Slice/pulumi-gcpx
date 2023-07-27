import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { Enabler, ServiceName } from '../services/enabler';

export interface SecretArgs {
	project: Input<string>;
	value: Input<string>;
}

export class Secret extends ComponentResource {
	public readonly secretId: Output<string>;

	public constructor(name: string, { project, value }: SecretArgs, opts?: ComponentResourceOptions) {
		super('pulumi:gcpx:secret', name, {}, opts);

		const secret = new gcp.secretmanager.Secret(
			`${name}-secret`,
			{
				project: project,
				replication: {},
				secretId: name,
			},
			{ parent: this, provider: opts?.provider, dependsOn: [Enabler.enableService(ServiceName.SECRET_MANAGER)] },
		);
		this.secretId = secret.secretId;

		new gcp.secretmanager.SecretVersion(
			`${name}-secret-version`,
			{
				enabled: true,
				secret: secret.id,
				secretData: value,
			},
			{
				parent: this,
				provider: opts?.provider,
				dependsOn: [secret, Enabler.enableService(ServiceName.SECRET_MANAGER)],
			},
		);
	}
}
