import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Repository, RepositoryArgs, Build, BuildArgs } from './cloud-build';
import { Run, RunArgs } from './cloud-run';

export interface DockerServiceArgs {
	repository: Omit<RepositoryArgs, 'project'>;
	project?: Input<string>;
	location?: Input<string>;
	build: Omit<BuildArgs, 'project' | 'location'>;
	run: Omit<RunArgs, 'project' | 'location'>;
}

export class DockerService extends ComponentResource {
	public constructor(
		name: string,
		{ repository: repositoryArgs, project, location, build: buildArgs, run: runArgs }: DockerServiceArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:docker-service', name, {}, opts);

		const repository = new Repository(
			name,
			{ ...repositoryArgs, project },
			{ parent: this, provider: opts?.provider },
		);
		const build = new Build(
			name,
			{ ...buildArgs, project, location },
			{ parent: this, provider: opts?.provider, dependsOn: [repository] },
		);
		new Run(
			name,
			{ ...runArgs, project, location },
			{ parent: this, provider: opts?.provider, dependsOn: [build] },
		);
	}
}
