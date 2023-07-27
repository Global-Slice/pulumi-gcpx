import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { Enabler, ServiceName } from '../services/enabler';
// import { IAMBindingCreator } from '../iam-binding-creator';

export interface RunArgs {
	location?: Input<string>;
	project?: Input<string>;
}

export class Run extends ComponentResource {
	public constructor(name: string, { location, project }: RunArgs, opts?: ComponentResourceOptions) {
		super('pulumi:gcpx:run', name, {}, opts);
		new gcp.cloudrunv2.Service(
			name,
			{
				location,
				project,
				template: {},
			},
			{ parent: this, provider: opts?.provider, dependsOn: [Enabler.enableService(ServiceName.CLOUD_RUN)] },
		);
		// new IAMBindingCreator({}, gcp.cloudrunv2.ServiceIamBinding);
	}
}
