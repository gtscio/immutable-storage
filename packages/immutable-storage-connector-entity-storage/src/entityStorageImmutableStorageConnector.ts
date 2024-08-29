// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, GeneralError, Guards, Is, NotFoundError, RandomHelper, Urn } from "@gtsc/core";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import type { IImmutableStorageConnector } from "@gtsc/immutable-storage-models";
import { nameof } from "@gtsc/nameof";
import type { ImmutableItem } from "./entities/immutableItem";

/**
 * Class for performing immutable storage operations on entity storage.
 */
export class EntityStorageImmutableStorageConnector implements IImmutableStorageConnector {
	/**
	 * The namespace supported by the immutable storage connector.
	 */
	public static NAMESPACE: string = "entity-storage";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<EntityStorageImmutableStorageConnector>();

	/**
	 * The entity storage for immutable items.
	 * @internal
	 */
	private readonly _immutableStorageEntityStorage: IEntityStorageConnector<ImmutableItem>;

	/**
	 * Create a new instance of EntityStorageImmutableStorageConnector.
	 * @param options The dependencies for the class.
	 * @param options.immutableStorageEntityStorageType The entity storage for immutable storage items, defaults to "immutable-item".
	 */
	constructor(options?: { immutableStorageEntityStorageType?: string }) {
		this._immutableStorageEntityStorage = EntityStorageConnectorFactory.get(
			options?.immutableStorageEntityStorageType ?? "immutable-item"
		);
	}

	/**
	 * Store an item in immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param data The data to store.
	 * @returns The id of the stored immutable item in urn format.
	 */
	public async store(controller: string, data: Uint8Array): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.uint8Array(this.CLASS_NAME, nameof(data), data);

		try {
			const immutableItemId = Converter.bytesToHex(RandomHelper.generate(32));

			const immutableItem: ImmutableItem = {
				id: immutableItemId,
				controller,
				data: Converter.bytesToBase64(data)
			};

			await this._immutableStorageEntityStorage.set(immutableItem);

			return `immutable:${new Urn(EntityStorageImmutableStorageConnector.NAMESPACE, immutableItemId).toString()}`;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "storingFailed", undefined, error);
		}
	}

	/**
	 * Get an immutable item.
	 * @param id The id of the item to get.
	 * @returns The data for the item.
	 */
	public async get(id: string): Promise<Uint8Array> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== EntityStorageImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const immutableItemId = urnParsed.namespaceSpecific(1);
			const immutableItem = await this._immutableStorageEntityStorage.get(immutableItemId);

			if (Is.empty(immutableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "immutableStorageNotFound");
			}

			return Converter.base64ToBytes(immutableItem.data);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "gettingFailed", undefined, error);
		}
	}

	/**
	 * Remove the item from immutable storage.
	 * @param controller The identity of the user to access the vault keys.
	 * @param id The id of the immutable item to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== EntityStorageImmutableStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageImmutableStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const immutableItemId = urnParsed.namespaceSpecific(1);
			const immutableItem = await this._immutableStorageEntityStorage.get(immutableItemId);

			if (Is.empty(immutableItem)) {
				throw new NotFoundError(this.CLASS_NAME, "immutableStorageNotFound");
			}

			if (immutableItem.controller !== controller) {
				throw new GeneralError(this.CLASS_NAME, "notControllerRemove");
			}

			await this._immutableStorageEntityStorage.remove(immutableItemId);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removingFailed", undefined, error);
		}
	}
}
