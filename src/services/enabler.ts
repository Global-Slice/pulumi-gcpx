import { ComponentResource } from '@pulumi/pulumi';
import { Service } from '@pulumi/gcp/projects';

export enum ServiceName {
	CLOUD_BUILD = 'cloudbuild.googleapis.com',
	COMPUTE_ENGINE = 'compute.googleapis.com',
	VPC_ACCESS = 'vpcaccess.googleapis.com',
	SECRET_MANAGER = 'secretmanager.googleapis.com',
	SERVICE_NETWORKING = 'servicenetworking.googleapis.com',
	CLOUD_RUN = 'run.googleapis.com',
	CLOUD_FUNCTION = 'cloudfunctions.googleapis.com',
	API_GATEWAY = 'apigateway.googleapis.com',
	SERVICE_CONTROL = 'servicecontrol.googleapis.com',
	SERVICE_MANAGEMENT = 'servicemanagement.googleapis.com',
	CLOUD_STORAGE = 'storage-component.googleapis.com',
	WEB_SECURITY_SCANNER = 'websecurityscanner.googleapis.com',
	SQL = 'sqladmin.googleapis.com',
	IAM = 'iamcredentials.googleapis.com',
}

export class Enabler extends ComponentResource {
	private static singleton: undefined | Enabler = undefined;

	private enabledServices: Map<ServiceName, Service>;
	private constructor() {
		super('pulumi:gcpx:services-enabler', 'singleton');
		this.enabledServices = new Map();
	}

	public static enableService(serviceName: ServiceName): Service {
		if (Enabler.singleton === undefined) {
			Enabler.singleton = new Enabler();
		}

		return Enabler.singleton.enableService(serviceName);
	}

	private enableService(serviceName: ServiceName): Service {
		const maybeService = this.enabledServices.get(serviceName);
		if (maybeService !== undefined) {
			return maybeService;
		}

		const service = new Service(
			serviceName.split('.')[0],
			{
				disableDependentServices: true,
				service: serviceName,
			},
			{ parent: this },
		);
		this.enabledServices.set(serviceName, service);
		return service;
	}
}
