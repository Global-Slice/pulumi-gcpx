import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { PubSubRoles } from './roles';
import { IAMBindingCreator } from '../iam-binding-creator';

export interface PubSubArgs {
	project?: Input<string>;
	deadLetterPolicy?: {
		deadLetterTopic: Input<string> | PubSub;
	};
}

export interface PubSubGrantRoleArgs {
	serviceAccount: Input<gcp.serviceaccount.Account>;
	role: PubSubRoles;
}

export type PubSubKnownGrantRoleArgs = Omit<PubSubGrantRoleArgs, 'role'>;

export class PubSub extends ComponentResource {
	public readonly topic: string;
	public readonly subscription: string;
	private readonly bindingCreator: IAMBindingCreator<
		gcp.pubsub.SubscriptionIAMBindingArgs,
		gcp.pubsub.SubscriptionIAMBinding
	>;

	public constructor(name: string, { project, deadLetterPolicy }: PubSubArgs, opts?: ComponentResourceOptions) {
		super('pulumi:gcpx:pubsub', name, {}, opts);

		this.topic = `${name}-topic`;
		const topic = new gcp.pubsub.Topic(this.topic, { project }, { parent: this, provider: opts?.provider });

		const subscriptionArgs: gcp.pubsub.SubscriptionArgs = { topic: topic.name, project };
		if (deadLetterPolicy) {
			subscriptionArgs.deadLetterPolicy = {
				deadLetterTopic:
					deadLetterPolicy.deadLetterTopic instanceof PubSub
						? deadLetterPolicy.deadLetterTopic.topic
						: deadLetterPolicy.deadLetterTopic,
			};
		}
		this.subscription = `${name}-subscription`;
		new gcp.pubsub.Subscription(this.subscription, subscriptionArgs, {
			parent: this,
			provider: opts?.provider,
		});

		this.bindingCreator = new IAMBindingCreator(
			{ subscription: this.subscription },
			gcp.pubsub.SubscriptionIAMBinding,
		);
	}

	public addSubscriber(name: string, args: PubSubKnownGrantRoleArgs, opts?: ComponentResourceOptions) {
		this.grantRole(`${name}-subscribe`, { ...args, role: PubSubRoles.PUB_SUB_SUBSCRIBER }, opts);
	}

	public addPublisher(name: string, args: PubSubKnownGrantRoleArgs, opts?: ComponentResourceOptions) {
		this.grantRole(`${name}-publish`, { ...args, role: PubSubRoles.PUB_SUB_PUBLISHER }, opts);
	}

	public grantRole(name: string, { serviceAccount, role }: PubSubGrantRoleArgs, opts?: ComponentResourceOptions) {
		this.bindingCreator.bind(`${name}-${this.subscription}`, { role, serviceAccounts: [serviceAccount] }, opts);
	}
}
