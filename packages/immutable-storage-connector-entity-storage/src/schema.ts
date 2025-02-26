// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";
import { ImmutableItem } from "./entities/immutableItem";

/**
 * Initialize the schema for the immutable storage entity storage connector.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<ImmutableItem>(), () =>
		EntitySchemaHelper.getSchema(ImmutableItem)
	);
}
