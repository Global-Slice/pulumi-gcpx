import * as gcp from '@pulumi/gcp';
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import { RepositoryConnection } from './repository-connection';

export interface RepositoryArgs {
	connection: RepositoryConnection;
	uri: Input<string>;
	project?: Input<string>;
}

export class Repository extends ComponentResource {
	public readonly uri: Output<string>;
	public constructor(
		name: string,
		{ connection, project, uri: remoteUri }: RepositoryArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:repository', name, {}, opts);

		const repository = new gcp.cloudbuildv2.Repository(
			name,
			{ project, parentConnection: connection.connectionId, remoteUri },
			{ parent: this, dependsOn: [connection], provider: opts?.provider },
		);
		this.uri = repository.remoteUri;
	}
}
