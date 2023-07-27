import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

function toCapital(s: string) {
	return s[0].toUpperCase() + s.substring(1);
}

export interface ServiceAccountArgs {
	displayName?: Input<string>;
	project?: Input<string>;
}

export class ServiceAccount extends ComponentResource {
	public readonly email: pulumi.Output<string>;

	public constructor(
		name: string,
		{ displayName: displayNameInput, project }: ServiceAccountArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:service-account', name, {}, opts);
		const displayName = pulumi.all([displayNameInput]).apply(([maybeDisplayName]) => {
			if (maybeDisplayName) {
				return maybeDisplayName;
			}
			return name.split('-').map(toCapital).join(' ');
		});
		const serviceAccount = new gcp.serviceaccount.Account(
			`${name}-sa-build`,
			{
				displayName,
				project,
				disabled: false,
				accountId: `${name}-sa-build`,
				description: `service account to build ${name}`,
			},
			{ parent: this, provider: opts?.provider },
		);
		this.email = serviceAccount.email;
	}
}
