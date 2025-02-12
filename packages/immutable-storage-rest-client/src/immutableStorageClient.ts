// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig } from "@twin.org/api-models";
import { Guards, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type {
	IImmutableStorageRemoveRequest,
	IImmutableStorageComponent,
	IImmutableStorageStoreRequest,
	IImmutableStorageStoreResponse,
	IImmutableStorageGetRequest,
	IImmutableStorageGetResponse
} from "@twin.org/immutable-storage-models";
import { nameof } from "@twin.org/nameof";

/**
 * Client for performing Immutable Storage through to REST endpoints.
 */
export class ImmutableStorageClient extends BaseRestClient implements IImmutableStorageComponent {
	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<ImmutableStorageClient>();

	/**
	 * Create a new instance of ImmutableStorageClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<ImmutableStorageClient>(), config, "immutable");
	}

	/**
	 * Store an Immutable Storage.
	 * @param data The data of the Immutable Storage.
	 * @returns The id of the created Immutable Storage in urn format.
	 */
	public async store(data: string): Promise<{
		id: string;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(data), data);

		const response = await this.fetch<
			IImmutableStorageStoreRequest,
			IImmutableStorageStoreResponse
		>("/", "POST", {
			body: {
				data
			}
		});

		return response.body as {
			id: string;
			receipt: IJsonLdNodeObject;
		};
	}

	/**
	 * Get an Immutable Storage.
	 * @param id The id of the Immutable Storage to get.
	 * @param options Additional options for getting the Immutable Storage.
	 * @param options.includeData Should the data be included in the response, defaults to true.
	 * @returns The data for the Immutable Storage.
	 */
	public async get(
		id: string,
		options?: { includeData: boolean }
	): Promise<{
		data?: Uint8Array;
		receipt: IJsonLdNodeObject;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IImmutableStorageGetRequest, IImmutableStorageGetResponse>(
			"/:id",
			"GET",
			{
				pathParams: {
					id
				},
				body: options
			}
		);

		return response.body as {
			data?: Uint8Array;
			receipt: IJsonLdNodeObject;
		};
	}

	/**
	 * Remove an Immutable Storage.
	 * @param id The id of the Immutable Storage to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IImmutableStorageRemoveRequest, never>("/:id", "DELETE", {
			pathParams: {
				id
			}
		});
	}
}
