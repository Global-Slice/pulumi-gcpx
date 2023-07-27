import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import { BucketRoles } from './roles';
import { IAMBindingCreator } from '../iam-binding-creator';

export interface BucketArgs {
	project: Input<string>;
	location: Input<string>;
	name: Input<string>;
}

export class Bucket extends ComponentResource {
	public readonly bucketName: Output<string>;
	private readonly bindingCreator: IAMBindingCreator<gcp.storage.BucketIAMBindingArgs, gcp.storage.BucketIAMBinding>;

	public constructor(
		private readonly name: string,
		{ location, project }: BucketArgs,
		opts?: ComponentResourceOptions,
	) {
		super(`pulumi:gcpx:bucket`, name, {}, opts);

		const bucket = new gcp.storage.Bucket(
			name,
			{
				location,
				project,
				name: `${name}-${pulumi.getStack()}`,
			},
			{ dependsOn: [], parent: this, provider: opts?.provider },
		);

		this.bucketName = bucket.name;
		this.bindingCreator = new IAMBindingCreator({ bucket: this.bucketName }, gcp.storage.BucketIAMBinding);
	}

	public grantRole(role: BucketRoles, ...serviceAccounts: gcp.serviceaccount.Account[]) {
		this.bindingCreator.bind(`${this.name}-${role}`, { role, serviceAccounts });
	}
}
