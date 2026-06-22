import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { Tables } from "./tables";
import { generateId } from "../utils/id";
import type {
  ShippingZone,
  ShippingRate,
  CreateShippingZoneInput,
} from "../../types/shipping";

export async function createZone(
  input: CreateShippingZoneInput
): Promise<ShippingZone> {
  const now = new Date().toISOString();
  const zone: ShippingZone = {
    zoneId: generateId(),
    name: input.name,
    states: input.states,
    rates: input.rates,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.SHIPPING_ZONES,
      Item: zone,
    })
  );

  return zone;
}

export async function getZone(zoneId: string): Promise<ShippingZone | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.SHIPPING_ZONES,
      Key: { zoneId },
    })
  );
  return (result.Item as ShippingZone) || null;
}

export async function listZones(): Promise<ShippingZone[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: Tables.SHIPPING_ZONES,
    })
  );
  return (result.Items as ShippingZone[]) || [];
}

export async function updateZone(
  zoneId: string,
  updates: Partial<Pick<ShippingZone, "name" | "states" | "rates">>
): Promise<ShippingZone | null> {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      expressions.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = value;
    }
  });

  if (expressions.length === 0) return getZone(zoneId);

  expressions.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: Tables.SHIPPING_ZONES,
      Key: { zoneId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return (result.Attributes as ShippingZone) || null;
}

export async function deleteZone(zoneId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.SHIPPING_ZONES,
      Key: { zoneId },
    })
  );
}

export async function calculateShippingRate(
  state: string,
  totalWeight: number
): Promise<{ zone: ShippingZone; rate: ShippingRate } | null> {
  const zones = await listZones();
  const matchingZone = zones.find((z) =>
    z.states.map((s) => s.toUpperCase()).includes(state.toUpperCase())
  );

  if (!matchingZone) return null;

  // Sort rates by minWeight ascending and find the matching tier
  const sortedRates = [...matchingZone.rates].sort(
    (a, b) => a.minWeight - b.minWeight
  );
  const matchingRate = sortedRates.find(
    (r) => totalWeight >= r.minWeight && totalWeight <= r.maxWeight
  );

  if (!matchingRate) return null;

  return { zone: matchingZone, rate: matchingRate };
}
