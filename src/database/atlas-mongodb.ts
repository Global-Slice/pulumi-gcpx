import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import * as mongodbatlas from '@pulumi/mongodbatlas';
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

export interface AtlasMongoDBArgs {
	atlasProjectId: Input<string>;
	cidrBlock: Input<string>;
	peeredNetwork: {
		name: Input<string>;
		selfLink: Input<string>;
	};
	gcp?: {
		region?: Input<string>;
		projectId: Input<string>;
	};
}

export interface AtlasMongoDBDatabaseArgs {
	databaseName: Input<string>;
	password: Input<string>;
	username: Input<string>;
}

export class AtlasMongodb extends ComponentResource {
	private readonly clusterString: Output<string>;
	private readonly cluster: mongodbatlas.Cluster;

	constructor(
		private readonly name: string,
		private readonly args: AtlasMongoDBArgs,
		opts?: ComponentResourceOptions,
	) {
		super('pulumi:gcpx:atlas-mongodb', name, {}, opts);

		const networkContainer = new mongodbatlas.NetworkContainer(
			`${name}-atlas-mongodb-network-container`,
			{
				projectId: args.atlasProjectId,
				atlasCidrBlock: args.cidrBlock,
				providerName: 'GCP',
			},
			{ parent: this, provider: opts?.provider },
		);

		const accessList = new mongodbatlas.ProjectIpAccessList(
			`${name}-atlas-mongodb-access-list`,
			{
				comment: 'GCP VPC connector',
				cidrBlock: args.cidrBlock,
				projectId: args.atlasProjectId,
			},
			{ parent: this, provider: opts?.provider },
		);

		// Create the peering connection request
		const networkPeering = new mongodbatlas.NetworkPeering(
			`${name}-atlas-mongodb-network-peering`,
			{
				projectId: args.atlasProjectId,
				containerId: networkContainer.containerId,
				providerName: 'GCP',
				gcpProjectId: args.atlasProjectId,
				networkName: args.peeredNetwork.name,
			},
			{ parent: this, provider: opts?.provider, dependsOn: [networkContainer] },
		);

		// Create the GCP peer
		const peering = new gcp.compute.NetworkPeering(
			`${name}-gcp-network-peering`,
			{
				name: `${name}-gcp-network-peering`,
				network: args.peeredNetwork.selfLink,
				peerNetwork: pulumi.interpolate`https://www.googleapis.com/compute/v1/projects/${networkPeering.atlasGcpProjectId}/global/networks/${networkPeering.atlasVpcName}`,
			},
			{ parent: this, provider: opts?.provider, dependsOn: [networkPeering] },
		);

		this.cluster = new mongodbatlas.Cluster(
			`${name}-atlas-mongodb-cluster`,
			{
				advancedConfiguration: {
					javascriptEnabled: true,
					minimumEnabledTlsProtocol: 'TLS1_2',
				},
				autoScalingComputeEnabled: true,
				autoScalingComputeScaleDownEnabled: true,
				biConnectorConfig: {
					readPreference: 'secondary',
				},
				cloudBackup: true,
				clusterType: 'REPLICASET',
				diskSizeGb: 10,
				encryptionAtRestProvider: 'NONE',
				mongoDbMajorVersion: '6.0',
				name: `${name}-atlas-mongodb-cluster`,
				pitEnabled: true,
				projectId: args.atlasProjectId,
				providerAutoScalingComputeMaxInstanceSize: 'M20',
				providerAutoScalingComputeMinInstanceSize: 'M10',
				providerInstanceSizeName: 'M10',
				providerName: 'GCP',
				providerRegionName: 'CENTRAL_US',
				replicationFactor: 3,
				replicationSpecs: [
					{
						numShards: 1,
						regionsConfigs: [
							{
								electableNodes: 3,
								priority: 7,
								regionName: 'CENTRAL_US',
							},
						],
						zoneName: 'Zone 1',
					},
				],
			},
			{
				protect: true,
				provider: opts?.provider,
				dependsOn: [peering, accessList],
				parent: this,
			},
		);

		// Calculate connection string
		const privateString = pulumi.interpolate`${this.cluster.connectionStrings[0].private}`;
		const clusterId = privateString.apply((privateStr) => privateStr.split('pri.')[1].split('.')[0]);
		this.clusterString = pulumi.interpolate`${this.cluster.name}-pri.${clusterId}.mongodb.net`;
	}

	public addDatabase(args: AtlasMongoDBDatabaseArgs): Output<string> {
		return pulumi
			.all([args.databaseName, args.username, args.password])
			.apply(
				([databaseName, username, password]) =>
					pulumi.interpolate`mongodb+srv://${username}:${encodeURI(password)}@${
						this.clusterString
					}/${databaseName}?retryWrites=true&w=majority`,
			);
	}
}
