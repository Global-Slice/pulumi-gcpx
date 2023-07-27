import * as pulumi from '@pulumi/pulumi';
import { ComponentResourceOptions, Input, Resource } from '@pulumi/pulumi';
import { Account } from '@pulumi/gcp/serviceaccount';

export interface IAMBindingArgs {
	serviceAccounts: Input<Input<Account>[]>;
	role: Input<string>;
}

export interface GCPIAMBindingArgs {
	members: Input<Input<string>[]>;
	role: Input<string>;
}

function isArray(maybeArray: Input<Resource> | Input<Input<Resource>[]>): maybeArray is Input<Resource>[] {
	return Array.isArray(maybeArray);
}

export class IAMBindingCreator<A extends GCPIAMBindingArgs, T> {
	public constructor(
		private readonly resourceToBind: Omit<A, keyof GCPIAMBindingArgs>,
		private readonly clazz: new (name: string, args: A, opts?: ComponentResourceOptions) => T,
	) {}

	public bind(
		name: string,
		{ role, serviceAccounts: serviceAccountsInput }: IAMBindingArgs,
		{ dependsOn: externalDependsOnInput = [], ...extraOpts }: ComponentResourceOptions = {},
	): T {
		const members: Input<Input<string>[]> = pulumi
			.all([serviceAccountsInput, externalDependsOnInput])
			.apply(([serviceAccounts]) =>
				serviceAccounts.map((serviceAccount) => pulumi.interpolate`serviceAccount:${serviceAccount.email}`),
			);

		const dependsOn = pulumi
			.all([serviceAccountsInput, externalDependsOnInput])
			.apply(([serviceAccounts, externalDependsOn]) => {
				if (isArray(externalDependsOn)) {
					return [...externalDependsOn, this, ...serviceAccounts] as Input<Resource>[];
				} else {
					return [externalDependsOn, this, ...serviceAccounts] as Input<Resource>[];
				}
			});
		return new this.clazz(name, { role, members, ...this.resourceToBind } as A, { dependsOn, ...extraOpts });
	}
}
