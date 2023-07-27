import * as gcp from '@pulumi/gcp';
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import { Repository } from './repository';

enum RepositoryConnectionType {
	GitHubRepositoryConnectionType,
}

interface RepositoryConnectionArgsBase<T extends RepositoryConnectionType> {
	location: Input<string>;
	project?: Input<string>;
	name: Input<string>;
	repositoryType: T;
}

export interface GitHubRepositoryConnectionArgs
	extends RepositoryConnectionArgsBase<RepositoryConnectionType.GitHubRepositoryConnectionType> {
	appInstallationId: Input<number>;
	oauthTokenSecret: Input<string>;
}

export type RepositoryConnectionArgs = GitHubRepositoryConnectionArgs;

function isGitHubRepositoryConnectionArgs(args: RepositoryConnectionArgs): args is GitHubRepositoryConnectionArgs {
	switch (args.repositoryType) {
		case RepositoryConnectionType.GitHubRepositoryConnectionType:
			return true;
		default:
			return false;
	}
}

function creatConnectionArgs(args: RepositoryConnectionArgs): gcp.cloudbuildv2.ConnectionArgs {
	if (isGitHubRepositoryConnectionArgs(args)) {
		return {
			disabled: false,
			githubConfig: {
				appInstallationId: args.appInstallationId,
				authorizerCredential: {
					oauthTokenSecretVersion: args.oauthTokenSecret,
				},
			},
			location: args.location,
			name: args.name,
			project: args.project,
		};
	}
	throw new Error('Unsupported repository');
}

export class RepositoryConnection extends ComponentResource {
	public readonly connectionId: Output<string>;

	public constructor(
		private readonly name: string,
		private readonly args: RepositoryConnectionArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:repository-connection', name, {}, opts);

		const connection = new gcp.cloudbuildv2.Connection(name, creatConnectionArgs(args), {
			parent: this,
			provider: opts?.provider,
		});
		this.connectionId = connection.id;
	}

	public addRepository(name: string): Repository {
		return new Repository(
			`${this.name}/${name}`,
			{ project: this.args.project, connection: this, uri: 'https://github.com/' },
			{ dependsOn: [this] },
		);
	}
}
