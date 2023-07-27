import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import { PubSub } from './pubsub';
import * as gcp from '@pulumi/gcp';

export interface RobustPubSubArgs {
	project?: Input<string>;
}

export class RobustPubSub extends ComponentResource {
	public readonly deadLetterSubscription: Output<string>;
	public readonly subscription: Output<string>;
	private readonly pubSub: PubSub;
	private readonly deadLetterPubSub: PubSub;

	public constructor(name: string, { project }: RobustPubSubArgs, opts?: ComponentResourceOptions) {
		super('pulumi:gcpx:robust-pubsub', name, {}, opts);

		this.deadLetterPubSub = new PubSub(
			`${name}-dead-letter`,
			{ project },
			{ parent: this, provider: opts?.provider },
		);
		this.deadLetterSubscription = this.deadLetterPubSub.subscription;

		this.pubSub = new PubSub(
			name,
			{ project, deadLetterPolicy: { deadLetterTopic: this.deadLetterPubSub } },
			{ parent: this, provider: opts?.provider, dependsOn: [this.deadLetterPubSub] },
		);
		this.subscription = this.pubSub.subscription;
	}

	public addSubscriber(name: string, serviceAccount: gcp.serviceaccount.Account) {
		this.pubSub.addSubscriber(name, { serviceAccount });
	}

	public addPublisher(name: string, serviceAccount: gcp.serviceaccount.Account) {
		this.pubSub.addPublisher(name, { serviceAccount });
	}
}
