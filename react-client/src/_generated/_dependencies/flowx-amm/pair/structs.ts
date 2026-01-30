import { bcs } from "@mysten/sui/bcs";
import type { SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromBase64, fromHex, toHex } from "@mysten/sui/utils";
import { getTypeOrigin } from "../../../_envs";
import {
  assertFieldsWithTypesArgsMatch,
  assertReifiedTypeArgsMatch,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  extractType,
  type PhantomReified,
  type PhantomToTypeStr,
  type PhantomTypeArgument,
  phantom,
  type Reified,
  type StructClass,
  type ToField,
  type ToJSON,
  type ToTypeStr as ToPhantom,
  type ToPhantomTypeArgument,
  type ToTypeStr,
} from "../../../_framework/reified";
import {
  composeSuiType,
  compressSuiType,
  type FieldsWithTypes,
  fetchObjectBcs,
  parseTypeName,
  type SupportedSuiClient,
} from "../../../_framework/util";
import { String } from "../../std/string/structs";
import { Supply } from "../../sui/balance/structs";
import { Coin } from "../../sui/coin/structs";
import { UID } from "../../sui/object/structs";

/* ============================== LP =============================== */

export function isLP(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(
    `${getTypeOrigin("flowx-amm", "pair::LP")}::pair::LP<`,
  );
}

export interface LPFields<
  _BASE extends PhantomTypeArgument,
  _QUOTE extends PhantomTypeArgument,
> {
  dummyField: ToField<"bool">;
}

export type LPReified<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> = Reified<LP<BASE, QUOTE>, LPFields<BASE, QUOTE>>;

export type LPJSONField<
  _BASE extends PhantomTypeArgument,
  _QUOTE extends PhantomTypeArgument,
> = {
  dummyField: boolean;
};

export type LPJSON<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> = {
  $typeName: typeof LP.$typeName;
  $typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>];
} & LPJSONField<BASE, QUOTE>;

export class LP<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName: `${string}::pair::LP` = `${getTypeOrigin(
    "flowx-amm",
    "pair::LP",
  )}::pair::LP` as const;
  static readonly $numTypeParams = 2;
  static readonly $isPhantom = [true, true] as const;

  readonly $typeName: typeof LP.$typeName = LP.$typeName;
  readonly $fullTypeName: `${string}::pair::LP<${PhantomToTypeStr<BASE>}, ${PhantomToTypeStr<QUOTE>}>`;
  readonly $typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>];
  readonly $isPhantom: typeof LP.$isPhantom = LP.$isPhantom;

  readonly dummyField: ToField<"bool">;

  private constructor(
    typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>],
    fields: LPFields<BASE, QUOTE>,
  ) {
    this.$fullTypeName = composeSuiType(
      LP.$typeName,
      ...typeArgs,
    ) as `${string}::pair::LP<${PhantomToTypeStr<BASE>}, ${PhantomToTypeStr<QUOTE>}>`;
    this.$typeArgs = typeArgs;

    this.dummyField = fields.dummyField;
  }

  static reified<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    BASE: BASE,
    QUOTE: QUOTE,
  ): LPReified<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    const reifiedBcs = LP.bcs;
    return {
      typeName: LP.$typeName,
      fullTypeName: composeSuiType(
        LP.$typeName,
        ...[extractType(BASE), extractType(QUOTE)],
      ) as `${string}::pair::LP<${PhantomToTypeStr<
        ToPhantomTypeArgument<BASE>
      >}, ${PhantomToTypeStr<ToPhantomTypeArgument<QUOTE>>}>`,
      typeArgs: [extractType(BASE), extractType(QUOTE)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<BASE>>,
        PhantomToTypeStr<ToPhantomTypeArgument<QUOTE>>,
      ],
      isPhantom: LP.$isPhantom,
      reifiedTypeArgs: [BASE, QUOTE],
      fromFields: (fields: Record<string, any>) =>
        LP.fromFields([BASE, QUOTE], fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        LP.fromFieldsWithTypes([BASE, QUOTE], item),
      fromBcs: (data: Uint8Array) =>
        LP.fromFields([BASE, QUOTE], reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => LP.fromJSONField([BASE, QUOTE], field),
      fromJSON: (json: Record<string, any>) => LP.fromJSON([BASE, QUOTE], json),
      fromSuiParsedData: (content: SuiParsedData) =>
        LP.fromSuiParsedData([BASE, QUOTE], content),
      fromSuiObjectData: (content: SuiObjectData) =>
        LP.fromSuiObjectData([BASE, QUOTE], content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        LP.fetch(client, [BASE, QUOTE], id),
      new: (
        fields: LPFields<
          ToPhantomTypeArgument<BASE>,
          ToPhantomTypeArgument<QUOTE>
        >,
      ) => {
        return new LP([extractType(BASE), extractType(QUOTE)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): typeof LP.reified {
    return LP.reified;
  }

  static phantom<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    BASE: BASE,
    QUOTE: QUOTE,
  ): PhantomReified<
    ToTypeStr<LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>>>
  > {
    return phantom(LP.reified(BASE, QUOTE));
  }

  static get p(): typeof LP.phantom {
    return LP.phantom;
  }

  private static instantiateBcs() {
    return bcs.struct("LP", {
      dummy_field: bcs.bool(),
    });
  }

  private static cachedBcs: ReturnType<typeof LP.instantiateBcs> | null = null;

  static get bcs(): ReturnType<typeof LP.instantiateBcs> {
    if (!LP.cachedBcs) {
      LP.cachedBcs = LP.instantiateBcs();
    }
    return LP.cachedBcs;
  }

  static fromFields<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    fields: Record<string, any>,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return LP.reified(typeArgs[0], typeArgs[1]).new({
      dummyField: decodeFromFields("bool", fields.dummy_field),
    });
  }

  static fromFieldsWithTypes<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    item: FieldsWithTypes,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (!isLP(item.type)) {
      throw new Error("not a LP type");
    }
    assertFieldsWithTypesArgsMatch(item, typeArgs);

    return LP.reified(typeArgs[0], typeArgs[1]).new({
      dummyField: decodeFromFieldsWithTypes("bool", item.fields.dummy_field),
    });
  }

  static fromBcs<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    data: Uint8Array,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return LP.fromFields(typeArgs, LP.bcs.parse(data));
  }

  toJSONField(): LPJSONField<BASE, QUOTE> {
    return {
      dummyField: this.dummyField,
    };
  }

  toJSON(): LPJSON<BASE, QUOTE> {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    field: any,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return LP.reified(typeArgs[0], typeArgs[1]).new({
      dummyField: decodeFromJSONField("bool", field.dummyField),
    });
  }

  static fromJSON<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    json: Record<string, any>,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (json.$typeName !== LP.$typeName) {
      throw new Error(
        `not a LP json object: expected '${LP.$typeName}' but got '${json.$typeName}'`,
      );
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(LP.$typeName, ...typeArgs.map(extractType)),
      json.$typeArgs,
      typeArgs,
    );

    return LP.fromJSONField(typeArgs, json);
  }

  static fromSuiParsedData<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    content: SuiParsedData,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isLP(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a LP object`,
      );
    }
    return LP.fromFieldsWithTypes(typeArgs, content);
  }

  static fromSuiObjectData<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    data: SuiObjectData,
  ): LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isLP(data.bcs.type)) {
        throw new Error(`object at is not a LP object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 2) {
        throw new Error(
          `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
        );
      }
      for (let i = 0; i < 2; i++) {
        const gotTypeArg = compressSuiType(gotTypeArgs[i]);
        const expectedTypeArg = compressSuiType(extractType(typeArgs[i]));
        if (gotTypeArg !== expectedTypeArg) {
          throw new Error(
            `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
          );
        }
      }

      return LP.fromBcs(typeArgs, fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return LP.fromSuiParsedData(typeArgs, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    client: SupportedSuiClient,
    typeArgs: [BASE, QUOTE],
    id: string,
  ): Promise<LP<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>>> {
    const res = await fetchObjectBcs(client, id);
    if (!isLP(res.type)) {
      throw new Error(`object at id ${id} is not a LP object`);
    }

    const gotTypeArgs = parseTypeName(res.type).typeArgs;
    if (gotTypeArgs.length !== 2) {
      throw new Error(
        `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
      );
    }
    for (let i = 0; i < 2; i++) {
      const gotTypeArg = compressSuiType(gotTypeArgs[i]);
      const expectedTypeArg = compressSuiType(extractType(typeArgs[i]));
      if (gotTypeArg !== expectedTypeArg) {
        throw new Error(
          `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }
    }

    return LP.fromBcs(typeArgs, res.bcsBytes);
  }
}

/* ============================== PairMetadata =============================== */

export function isPairMetadata(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(
    `${getTypeOrigin("flowx-amm", "pair::PairMetadata")}::pair::PairMetadata<`,
  );
}

export interface PairMetadataFields<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> {
  id: ToField<UID>;
  reserveX: ToField<Coin<BASE>>;
  reserveY: ToField<Coin<QUOTE>>;
  kLast: ToField<"u128">;
  lpSupply: ToField<Supply<ToPhantom<LP<BASE, QUOTE>>>>;
  feeRate: ToField<"u64">;
}

export type PairMetadataReified<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> = Reified<PairMetadata<BASE, QUOTE>, PairMetadataFields<BASE, QUOTE>>;

export type PairMetadataJSONField<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> = {
  id: string;
  reserveX: ToJSON<Coin<BASE>>;
  reserveY: ToJSON<Coin<QUOTE>>;
  kLast: string;
  lpSupply: ToJSON<Supply<ToPhantom<LP<BASE, QUOTE>>>>;
  feeRate: string;
};

export type PairMetadataJSON<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> = {
  $typeName: typeof PairMetadata.$typeName;
  $typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>];
} & PairMetadataJSONField<BASE, QUOTE>;

export class PairMetadata<
  BASE extends PhantomTypeArgument,
  QUOTE extends PhantomTypeArgument,
> implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName: `${string}::pair::PairMetadata` = `${getTypeOrigin(
    "flowx-amm",
    "pair::PairMetadata",
  )}::pair::PairMetadata` as const;
  static readonly $numTypeParams = 2;
  static readonly $isPhantom = [true, true] as const;

  readonly $typeName: typeof PairMetadata.$typeName = PairMetadata.$typeName;
  readonly $fullTypeName: `${string}::pair::PairMetadata<${PhantomToTypeStr<BASE>}, ${PhantomToTypeStr<QUOTE>}>`;
  readonly $typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>];
  readonly $isPhantom: typeof PairMetadata.$isPhantom = PairMetadata.$isPhantom;

  readonly id: ToField<UID>;
  readonly reserveX: ToField<Coin<BASE>>;
  readonly reserveY: ToField<Coin<QUOTE>>;
  readonly kLast: ToField<"u128">;
  readonly lpSupply: ToField<Supply<ToPhantom<LP<BASE, QUOTE>>>>;
  readonly feeRate: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<BASE>, PhantomToTypeStr<QUOTE>],
    fields: PairMetadataFields<BASE, QUOTE>,
  ) {
    this.$fullTypeName = composeSuiType(
      PairMetadata.$typeName,
      ...typeArgs,
    ) as `${string}::pair::PairMetadata<${PhantomToTypeStr<BASE>}, ${PhantomToTypeStr<QUOTE>}>`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.reserveX = fields.reserveX;
    this.reserveY = fields.reserveY;
    this.kLast = fields.kLast;
    this.lpSupply = fields.lpSupply;
    this.feeRate = fields.feeRate;
  }

  static reified<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    BASE: BASE,
    QUOTE: QUOTE,
  ): PairMetadataReified<
    ToPhantomTypeArgument<BASE>,
    ToPhantomTypeArgument<QUOTE>
  > {
    const reifiedBcs = PairMetadata.bcs;
    return {
      typeName: PairMetadata.$typeName,
      fullTypeName: composeSuiType(
        PairMetadata.$typeName,
        ...[extractType(BASE), extractType(QUOTE)],
      ) as `${string}::pair::PairMetadata<${PhantomToTypeStr<
        ToPhantomTypeArgument<BASE>
      >}, ${PhantomToTypeStr<ToPhantomTypeArgument<QUOTE>>}>`,
      typeArgs: [extractType(BASE), extractType(QUOTE)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<BASE>>,
        PhantomToTypeStr<ToPhantomTypeArgument<QUOTE>>,
      ],
      isPhantom: PairMetadata.$isPhantom,
      reifiedTypeArgs: [BASE, QUOTE],
      fromFields: (fields: Record<string, any>) =>
        PairMetadata.fromFields([BASE, QUOTE], fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PairMetadata.fromFieldsWithTypes([BASE, QUOTE], item),
      fromBcs: (data: Uint8Array) =>
        PairMetadata.fromFields([BASE, QUOTE], reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) =>
        PairMetadata.fromJSONField([BASE, QUOTE], field),
      fromJSON: (json: Record<string, any>) =>
        PairMetadata.fromJSON([BASE, QUOTE], json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PairMetadata.fromSuiParsedData([BASE, QUOTE], content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PairMetadata.fromSuiObjectData([BASE, QUOTE], content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PairMetadata.fetch(client, [BASE, QUOTE], id),
      new: (
        fields: PairMetadataFields<
          ToPhantomTypeArgument<BASE>,
          ToPhantomTypeArgument<QUOTE>
        >,
      ) => {
        return new PairMetadata(
          [extractType(BASE), extractType(QUOTE)],
          fields,
        );
      },
      kind: "StructClassReified",
    };
  }

  static get r(): typeof PairMetadata.reified {
    return PairMetadata.reified;
  }

  static phantom<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    BASE: BASE,
    QUOTE: QUOTE,
  ): PhantomReified<
    ToTypeStr<
      PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>>
    >
  > {
    return phantom(PairMetadata.reified(BASE, QUOTE));
  }

  static get p(): typeof PairMetadata.phantom {
    return PairMetadata.phantom;
  }

  private static instantiateBcs() {
    return bcs.struct("PairMetadata", {
      id: UID.bcs,
      reserve_x: Coin.bcs,
      reserve_y: Coin.bcs,
      k_last: bcs.u128(),
      lp_supply: Supply.bcs,
      fee_rate: bcs.u64(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof PairMetadata.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof PairMetadata.instantiateBcs> {
    if (!PairMetadata.cachedBcs) {
      PairMetadata.cachedBcs = PairMetadata.instantiateBcs();
    }
    return PairMetadata.cachedBcs;
  }

  static fromFields<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    fields: Record<string, any>,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return PairMetadata.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromFields(UID.reified(), fields.id),
      reserveX: decodeFromFields(Coin.reified(typeArgs[0]), fields.reserve_x),
      reserveY: decodeFromFields(Coin.reified(typeArgs[1]), fields.reserve_y),
      kLast: decodeFromFields("u128", fields.k_last),
      lpSupply: decodeFromFields(
        Supply.reified(phantom(LP.reified(typeArgs[0], typeArgs[1]))),
        fields.lp_supply,
      ),
      feeRate: decodeFromFields("u64", fields.fee_rate),
    });
  }

  static fromFieldsWithTypes<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    item: FieldsWithTypes,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (!isPairMetadata(item.type)) {
      throw new Error("not a PairMetadata type");
    }
    assertFieldsWithTypesArgsMatch(item, typeArgs);

    return PairMetadata.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      reserveX: decodeFromFieldsWithTypes(
        Coin.reified(typeArgs[0]),
        item.fields.reserve_x,
      ),
      reserveY: decodeFromFieldsWithTypes(
        Coin.reified(typeArgs[1]),
        item.fields.reserve_y,
      ),
      kLast: decodeFromFieldsWithTypes("u128", item.fields.k_last),
      lpSupply: decodeFromFieldsWithTypes(
        Supply.reified(phantom(LP.reified(typeArgs[0], typeArgs[1]))),
        item.fields.lp_supply,
      ),
      feeRate: decodeFromFieldsWithTypes("u64", item.fields.fee_rate),
    });
  }

  static fromBcs<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    data: Uint8Array,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return PairMetadata.fromFields(typeArgs, PairMetadata.bcs.parse(data));
  }

  toJSONField(): PairMetadataJSONField<BASE, QUOTE> {
    return {
      id: this.id,
      reserveX: this.reserveX.toJSONField(),
      reserveY: this.reserveY.toJSONField(),
      kLast: this.kLast.toString(),
      lpSupply: this.lpSupply.toJSONField(),
      feeRate: this.feeRate.toString(),
    };
  }

  toJSON(): PairMetadataJSON<BASE, QUOTE> {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    field: any,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    return PairMetadata.reified(typeArgs[0], typeArgs[1]).new({
      id: decodeFromJSONField(UID.reified(), field.id),
      reserveX: decodeFromJSONField(Coin.reified(typeArgs[0]), field.reserveX),
      reserveY: decodeFromJSONField(Coin.reified(typeArgs[1]), field.reserveY),
      kLast: decodeFromJSONField("u128", field.kLast),
      lpSupply: decodeFromJSONField(
        Supply.reified(phantom(LP.reified(typeArgs[0], typeArgs[1]))),
        field.lpSupply,
      ),
      feeRate: decodeFromJSONField("u64", field.feeRate),
    });
  }

  static fromJSON<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    json: Record<string, any>,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (json.$typeName !== PairMetadata.$typeName) {
      throw new Error(
        `not a PairMetadata json object: expected '${PairMetadata.$typeName}' but got '${json.$typeName}'`,
      );
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(PairMetadata.$typeName, ...typeArgs.map(extractType)),
      json.$typeArgs,
      typeArgs,
    );

    return PairMetadata.fromJSONField(typeArgs, json);
  }

  static fromSuiParsedData<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    content: SuiParsedData,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPairMetadata(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PairMetadata object`,
      );
    }
    return PairMetadata.fromFieldsWithTypes(typeArgs, content);
  }

  static fromSuiObjectData<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    typeArgs: [BASE, QUOTE],
    data: SuiObjectData,
  ): PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isPairMetadata(data.bcs.type)
      ) {
        throw new Error(`object at is not a PairMetadata object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 2) {
        throw new Error(
          `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
        );
      }
      for (let i = 0; i < 2; i++) {
        const gotTypeArg = compressSuiType(gotTypeArgs[i]);
        const expectedTypeArg = compressSuiType(extractType(typeArgs[i]));
        if (gotTypeArg !== expectedTypeArg) {
          throw new Error(
            `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
          );
        }
      }

      return PairMetadata.fromBcs(typeArgs, fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return PairMetadata.fromSuiParsedData(typeArgs, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<
    BASE extends PhantomReified<PhantomTypeArgument>,
    QUOTE extends PhantomReified<PhantomTypeArgument>,
  >(
    client: SupportedSuiClient,
    typeArgs: [BASE, QUOTE],
    id: string,
  ): Promise<
    PairMetadata<ToPhantomTypeArgument<BASE>, ToPhantomTypeArgument<QUOTE>>
  > {
    const res = await fetchObjectBcs(client, id);
    if (!isPairMetadata(res.type)) {
      throw new Error(`object at id ${id} is not a PairMetadata object`);
    }

    const gotTypeArgs = parseTypeName(res.type).typeArgs;
    if (gotTypeArgs.length !== 2) {
      throw new Error(
        `type argument mismatch: expected 2 type arguments but got '${gotTypeArgs.length}'`,
      );
    }
    for (let i = 0; i < 2; i++) {
      const gotTypeArg = compressSuiType(gotTypeArgs[i]);
      const expectedTypeArg = compressSuiType(extractType(typeArgs[i]));
      if (gotTypeArg !== expectedTypeArg) {
        throw new Error(
          `type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }
    }

    return PairMetadata.fromBcs(typeArgs, res.bcsBytes);
  }
}

/* ============================== LiquidityAdded =============================== */

export function isLiquidityAdded(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("flowx-amm", "pair::LiquidityAdded")}::pair::LiquidityAdded`
  );
}

export interface LiquidityAddedFields {
  user: ToField<"address">;
  coinX: ToField<String>;
  coinY: ToField<String>;
  amountX: ToField<"u64">;
  amountY: ToField<"u64">;
  liquidity: ToField<"u64">;
  fee: ToField<"u64">;
}

export type LiquidityAddedReified = Reified<
  LiquidityAdded,
  LiquidityAddedFields
>;

export type LiquidityAddedJSONField = {
  user: string;
  coinX: string;
  coinY: string;
  amountX: string;
  amountY: string;
  liquidity: string;
  fee: string;
};

export type LiquidityAddedJSON = {
  $typeName: typeof LiquidityAdded.$typeName;
  $typeArgs: [];
} & LiquidityAddedJSONField;

export class LiquidityAdded implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::pair::LiquidityAdded` =
    `${getTypeOrigin(
      "flowx-amm",
      "pair::LiquidityAdded",
    )}::pair::LiquidityAdded` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof LiquidityAdded.$typeName =
    LiquidityAdded.$typeName;
  readonly $fullTypeName: `${string}::pair::LiquidityAdded`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof LiquidityAdded.$isPhantom =
    LiquidityAdded.$isPhantom;

  readonly user: ToField<"address">;
  readonly coinX: ToField<String>;
  readonly coinY: ToField<String>;
  readonly amountX: ToField<"u64">;
  readonly amountY: ToField<"u64">;
  readonly liquidity: ToField<"u64">;
  readonly fee: ToField<"u64">;

  private constructor(typeArgs: [], fields: LiquidityAddedFields) {
    this.$fullTypeName = composeSuiType(
      LiquidityAdded.$typeName,
      ...typeArgs,
    ) as `${string}::pair::LiquidityAdded`;
    this.$typeArgs = typeArgs;

    this.user = fields.user;
    this.coinX = fields.coinX;
    this.coinY = fields.coinY;
    this.amountX = fields.amountX;
    this.amountY = fields.amountY;
    this.liquidity = fields.liquidity;
    this.fee = fields.fee;
  }

  static reified(): LiquidityAddedReified {
    const reifiedBcs = LiquidityAdded.bcs;
    return {
      typeName: LiquidityAdded.$typeName,
      fullTypeName: composeSuiType(
        LiquidityAdded.$typeName,
        ...[],
      ) as `${string}::pair::LiquidityAdded`,
      typeArgs: [] as [],
      isPhantom: LiquidityAdded.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        LiquidityAdded.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        LiquidityAdded.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        LiquidityAdded.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => LiquidityAdded.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => LiquidityAdded.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        LiquidityAdded.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        LiquidityAdded.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        LiquidityAdded.fetch(client, id),
      new: (fields: LiquidityAddedFields) => {
        return new LiquidityAdded([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): LiquidityAddedReified {
    return LiquidityAdded.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<LiquidityAdded>> {
    return phantom(LiquidityAdded.reified());
  }

  static get p(): PhantomReified<ToTypeStr<LiquidityAdded>> {
    return LiquidityAdded.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("LiquidityAdded", {
      user: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      coin_x: String.bcs,
      coin_y: String.bcs,
      amount_x: bcs.u64(),
      amount_y: bcs.u64(),
      liquidity: bcs.u64(),
      fee: bcs.u64(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof LiquidityAdded.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof LiquidityAdded.instantiateBcs> {
    if (!LiquidityAdded.cachedBcs) {
      LiquidityAdded.cachedBcs = LiquidityAdded.instantiateBcs();
    }
    return LiquidityAdded.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): LiquidityAdded {
    return LiquidityAdded.reified().new({
      user: decodeFromFields("address", fields.user),
      coinX: decodeFromFields(String.reified(), fields.coin_x),
      coinY: decodeFromFields(String.reified(), fields.coin_y),
      amountX: decodeFromFields("u64", fields.amount_x),
      amountY: decodeFromFields("u64", fields.amount_y),
      liquidity: decodeFromFields("u64", fields.liquidity),
      fee: decodeFromFields("u64", fields.fee),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): LiquidityAdded {
    if (!isLiquidityAdded(item.type)) {
      throw new Error("not a LiquidityAdded type");
    }

    return LiquidityAdded.reified().new({
      user: decodeFromFieldsWithTypes("address", item.fields.user),
      coinX: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_x),
      coinY: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_y),
      amountX: decodeFromFieldsWithTypes("u64", item.fields.amount_x),
      amountY: decodeFromFieldsWithTypes("u64", item.fields.amount_y),
      liquidity: decodeFromFieldsWithTypes("u64", item.fields.liquidity),
      fee: decodeFromFieldsWithTypes("u64", item.fields.fee),
    });
  }

  static fromBcs(data: Uint8Array): LiquidityAdded {
    return LiquidityAdded.fromFields(LiquidityAdded.bcs.parse(data));
  }

  toJSONField(): LiquidityAddedJSONField {
    return {
      user: this.user,
      coinX: this.coinX,
      coinY: this.coinY,
      amountX: this.amountX.toString(),
      amountY: this.amountY.toString(),
      liquidity: this.liquidity.toString(),
      fee: this.fee.toString(),
    };
  }

  toJSON(): LiquidityAddedJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): LiquidityAdded {
    return LiquidityAdded.reified().new({
      user: decodeFromJSONField("address", field.user),
      coinX: decodeFromJSONField(String.reified(), field.coinX),
      coinY: decodeFromJSONField(String.reified(), field.coinY),
      amountX: decodeFromJSONField("u64", field.amountX),
      amountY: decodeFromJSONField("u64", field.amountY),
      liquidity: decodeFromJSONField("u64", field.liquidity),
      fee: decodeFromJSONField("u64", field.fee),
    });
  }

  static fromJSON(json: Record<string, any>): LiquidityAdded {
    if (json.$typeName !== LiquidityAdded.$typeName) {
      throw new Error(
        `not a LiquidityAdded json object: expected '${LiquidityAdded.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return LiquidityAdded.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): LiquidityAdded {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isLiquidityAdded(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a LiquidityAdded object`,
      );
    }
    return LiquidityAdded.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): LiquidityAdded {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isLiquidityAdded(data.bcs.type)
      ) {
        throw new Error(`object at is not a LiquidityAdded object`);
      }

      return LiquidityAdded.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return LiquidityAdded.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<LiquidityAdded> {
    const res = await fetchObjectBcs(client, id);
    if (!isLiquidityAdded(res.type)) {
      throw new Error(`object at id ${id} is not a LiquidityAdded object`);
    }

    return LiquidityAdded.fromBcs(res.bcsBytes);
  }
}

/* ============================== LiquidityRemoved =============================== */

export function isLiquidityRemoved(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("flowx-amm", "pair::LiquidityRemoved")}::pair::LiquidityRemoved`
  );
}

export interface LiquidityRemovedFields {
  user: ToField<"address">;
  coinX: ToField<String>;
  coinY: ToField<String>;
  amountX: ToField<"u64">;
  amountY: ToField<"u64">;
  liquidity: ToField<"u64">;
  fee: ToField<"u64">;
}

export type LiquidityRemovedReified = Reified<
  LiquidityRemoved,
  LiquidityRemovedFields
>;

export type LiquidityRemovedJSONField = {
  user: string;
  coinX: string;
  coinY: string;
  amountX: string;
  amountY: string;
  liquidity: string;
  fee: string;
};

export type LiquidityRemovedJSON = {
  $typeName: typeof LiquidityRemoved.$typeName;
  $typeArgs: [];
} & LiquidityRemovedJSONField;

export class LiquidityRemoved implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::pair::LiquidityRemoved` =
    `${getTypeOrigin(
      "flowx-amm",
      "pair::LiquidityRemoved",
    )}::pair::LiquidityRemoved` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof LiquidityRemoved.$typeName =
    LiquidityRemoved.$typeName;
  readonly $fullTypeName: `${string}::pair::LiquidityRemoved`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof LiquidityRemoved.$isPhantom =
    LiquidityRemoved.$isPhantom;

  readonly user: ToField<"address">;
  readonly coinX: ToField<String>;
  readonly coinY: ToField<String>;
  readonly amountX: ToField<"u64">;
  readonly amountY: ToField<"u64">;
  readonly liquidity: ToField<"u64">;
  readonly fee: ToField<"u64">;

  private constructor(typeArgs: [], fields: LiquidityRemovedFields) {
    this.$fullTypeName = composeSuiType(
      LiquidityRemoved.$typeName,
      ...typeArgs,
    ) as `${string}::pair::LiquidityRemoved`;
    this.$typeArgs = typeArgs;

    this.user = fields.user;
    this.coinX = fields.coinX;
    this.coinY = fields.coinY;
    this.amountX = fields.amountX;
    this.amountY = fields.amountY;
    this.liquidity = fields.liquidity;
    this.fee = fields.fee;
  }

  static reified(): LiquidityRemovedReified {
    const reifiedBcs = LiquidityRemoved.bcs;
    return {
      typeName: LiquidityRemoved.$typeName,
      fullTypeName: composeSuiType(
        LiquidityRemoved.$typeName,
        ...[],
      ) as `${string}::pair::LiquidityRemoved`,
      typeArgs: [] as [],
      isPhantom: LiquidityRemoved.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        LiquidityRemoved.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        LiquidityRemoved.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        LiquidityRemoved.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => LiquidityRemoved.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => LiquidityRemoved.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        LiquidityRemoved.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        LiquidityRemoved.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        LiquidityRemoved.fetch(client, id),
      new: (fields: LiquidityRemovedFields) => {
        return new LiquidityRemoved([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): LiquidityRemovedReified {
    return LiquidityRemoved.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<LiquidityRemoved>> {
    return phantom(LiquidityRemoved.reified());
  }

  static get p(): PhantomReified<ToTypeStr<LiquidityRemoved>> {
    return LiquidityRemoved.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("LiquidityRemoved", {
      user: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      coin_x: String.bcs,
      coin_y: String.bcs,
      amount_x: bcs.u64(),
      amount_y: bcs.u64(),
      liquidity: bcs.u64(),
      fee: bcs.u64(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof LiquidityRemoved.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof LiquidityRemoved.instantiateBcs> {
    if (!LiquidityRemoved.cachedBcs) {
      LiquidityRemoved.cachedBcs = LiquidityRemoved.instantiateBcs();
    }
    return LiquidityRemoved.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): LiquidityRemoved {
    return LiquidityRemoved.reified().new({
      user: decodeFromFields("address", fields.user),
      coinX: decodeFromFields(String.reified(), fields.coin_x),
      coinY: decodeFromFields(String.reified(), fields.coin_y),
      amountX: decodeFromFields("u64", fields.amount_x),
      amountY: decodeFromFields("u64", fields.amount_y),
      liquidity: decodeFromFields("u64", fields.liquidity),
      fee: decodeFromFields("u64", fields.fee),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): LiquidityRemoved {
    if (!isLiquidityRemoved(item.type)) {
      throw new Error("not a LiquidityRemoved type");
    }

    return LiquidityRemoved.reified().new({
      user: decodeFromFieldsWithTypes("address", item.fields.user),
      coinX: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_x),
      coinY: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_y),
      amountX: decodeFromFieldsWithTypes("u64", item.fields.amount_x),
      amountY: decodeFromFieldsWithTypes("u64", item.fields.amount_y),
      liquidity: decodeFromFieldsWithTypes("u64", item.fields.liquidity),
      fee: decodeFromFieldsWithTypes("u64", item.fields.fee),
    });
  }

  static fromBcs(data: Uint8Array): LiquidityRemoved {
    return LiquidityRemoved.fromFields(LiquidityRemoved.bcs.parse(data));
  }

  toJSONField(): LiquidityRemovedJSONField {
    return {
      user: this.user,
      coinX: this.coinX,
      coinY: this.coinY,
      amountX: this.amountX.toString(),
      amountY: this.amountY.toString(),
      liquidity: this.liquidity.toString(),
      fee: this.fee.toString(),
    };
  }

  toJSON(): LiquidityRemovedJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): LiquidityRemoved {
    return LiquidityRemoved.reified().new({
      user: decodeFromJSONField("address", field.user),
      coinX: decodeFromJSONField(String.reified(), field.coinX),
      coinY: decodeFromJSONField(String.reified(), field.coinY),
      amountX: decodeFromJSONField("u64", field.amountX),
      amountY: decodeFromJSONField("u64", field.amountY),
      liquidity: decodeFromJSONField("u64", field.liquidity),
      fee: decodeFromJSONField("u64", field.fee),
    });
  }

  static fromJSON(json: Record<string, any>): LiquidityRemoved {
    if (json.$typeName !== LiquidityRemoved.$typeName) {
      throw new Error(
        `not a LiquidityRemoved json object: expected '${LiquidityRemoved.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return LiquidityRemoved.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): LiquidityRemoved {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isLiquidityRemoved(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a LiquidityRemoved object`,
      );
    }
    return LiquidityRemoved.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): LiquidityRemoved {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isLiquidityRemoved(data.bcs.type)
      ) {
        throw new Error(`object at is not a LiquidityRemoved object`);
      }

      return LiquidityRemoved.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return LiquidityRemoved.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<LiquidityRemoved> {
    const res = await fetchObjectBcs(client, id);
    if (!isLiquidityRemoved(res.type)) {
      throw new Error(`object at id ${id} is not a LiquidityRemoved object`);
    }

    return LiquidityRemoved.fromBcs(res.bcsBytes);
  }
}

/* ============================== Swapped =============================== */

export function isSwapped(type: string): boolean {
  type = compressSuiType(type);
  return (
    type === `${getTypeOrigin("flowx-amm", "pair::Swapped")}::pair::Swapped`
  );
}

export interface SwappedFields {
  user: ToField<"address">;
  coinX: ToField<String>;
  coinY: ToField<String>;
  amountXIn: ToField<"u64">;
  amountYIn: ToField<"u64">;
  amountXOut: ToField<"u64">;
  amountYOut: ToField<"u64">;
}

export type SwappedReified = Reified<Swapped, SwappedFields>;

export type SwappedJSONField = {
  user: string;
  coinX: string;
  coinY: string;
  amountXIn: string;
  amountYIn: string;
  amountXOut: string;
  amountYOut: string;
};

export type SwappedJSON = {
  $typeName: typeof Swapped.$typeName;
  $typeArgs: [];
} & SwappedJSONField;

export class Swapped implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::pair::Swapped` = `${getTypeOrigin(
    "flowx-amm",
    "pair::Swapped",
  )}::pair::Swapped` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof Swapped.$typeName = Swapped.$typeName;
  readonly $fullTypeName: `${string}::pair::Swapped`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof Swapped.$isPhantom = Swapped.$isPhantom;

  readonly user: ToField<"address">;
  readonly coinX: ToField<String>;
  readonly coinY: ToField<String>;
  readonly amountXIn: ToField<"u64">;
  readonly amountYIn: ToField<"u64">;
  readonly amountXOut: ToField<"u64">;
  readonly amountYOut: ToField<"u64">;

  private constructor(typeArgs: [], fields: SwappedFields) {
    this.$fullTypeName = composeSuiType(
      Swapped.$typeName,
      ...typeArgs,
    ) as `${string}::pair::Swapped`;
    this.$typeArgs = typeArgs;

    this.user = fields.user;
    this.coinX = fields.coinX;
    this.coinY = fields.coinY;
    this.amountXIn = fields.amountXIn;
    this.amountYIn = fields.amountYIn;
    this.amountXOut = fields.amountXOut;
    this.amountYOut = fields.amountYOut;
  }

  static reified(): SwappedReified {
    const reifiedBcs = Swapped.bcs;
    return {
      typeName: Swapped.$typeName,
      fullTypeName: composeSuiType(
        Swapped.$typeName,
        ...[],
      ) as `${string}::pair::Swapped`,
      typeArgs: [] as [],
      isPhantom: Swapped.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Swapped.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        Swapped.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Swapped.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Swapped.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Swapped.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        Swapped.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        Swapped.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        Swapped.fetch(client, id),
      new: (fields: SwappedFields) => {
        return new Swapped([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): SwappedReified {
    return Swapped.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<Swapped>> {
    return phantom(Swapped.reified());
  }

  static get p(): PhantomReified<ToTypeStr<Swapped>> {
    return Swapped.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("Swapped", {
      user: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      coin_x: String.bcs,
      coin_y: String.bcs,
      amount_x_in: bcs.u64(),
      amount_y_in: bcs.u64(),
      amount_x_out: bcs.u64(),
      amount_y_out: bcs.u64(),
    });
  }

  private static cachedBcs: ReturnType<typeof Swapped.instantiateBcs> | null =
    null;

  static get bcs(): ReturnType<typeof Swapped.instantiateBcs> {
    if (!Swapped.cachedBcs) {
      Swapped.cachedBcs = Swapped.instantiateBcs();
    }
    return Swapped.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): Swapped {
    return Swapped.reified().new({
      user: decodeFromFields("address", fields.user),
      coinX: decodeFromFields(String.reified(), fields.coin_x),
      coinY: decodeFromFields(String.reified(), fields.coin_y),
      amountXIn: decodeFromFields("u64", fields.amount_x_in),
      amountYIn: decodeFromFields("u64", fields.amount_y_in),
      amountXOut: decodeFromFields("u64", fields.amount_x_out),
      amountYOut: decodeFromFields("u64", fields.amount_y_out),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Swapped {
    if (!isSwapped(item.type)) {
      throw new Error("not a Swapped type");
    }

    return Swapped.reified().new({
      user: decodeFromFieldsWithTypes("address", item.fields.user),
      coinX: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_x),
      coinY: decodeFromFieldsWithTypes(String.reified(), item.fields.coin_y),
      amountXIn: decodeFromFieldsWithTypes("u64", item.fields.amount_x_in),
      amountYIn: decodeFromFieldsWithTypes("u64", item.fields.amount_y_in),
      amountXOut: decodeFromFieldsWithTypes("u64", item.fields.amount_x_out),
      amountYOut: decodeFromFieldsWithTypes("u64", item.fields.amount_y_out),
    });
  }

  static fromBcs(data: Uint8Array): Swapped {
    return Swapped.fromFields(Swapped.bcs.parse(data));
  }

  toJSONField(): SwappedJSONField {
    return {
      user: this.user,
      coinX: this.coinX,
      coinY: this.coinY,
      amountXIn: this.amountXIn.toString(),
      amountYIn: this.amountYIn.toString(),
      amountXOut: this.amountXOut.toString(),
      amountYOut: this.amountYOut.toString(),
    };
  }

  toJSON(): SwappedJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): Swapped {
    return Swapped.reified().new({
      user: decodeFromJSONField("address", field.user),
      coinX: decodeFromJSONField(String.reified(), field.coinX),
      coinY: decodeFromJSONField(String.reified(), field.coinY),
      amountXIn: decodeFromJSONField("u64", field.amountXIn),
      amountYIn: decodeFromJSONField("u64", field.amountYIn),
      amountXOut: decodeFromJSONField("u64", field.amountXOut),
      amountYOut: decodeFromJSONField("u64", field.amountYOut),
    });
  }

  static fromJSON(json: Record<string, any>): Swapped {
    if (json.$typeName !== Swapped.$typeName) {
      throw new Error(
        `not a Swapped json object: expected '${Swapped.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return Swapped.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): Swapped {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isSwapped(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a Swapped object`,
      );
    }
    return Swapped.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): Swapped {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isSwapped(data.bcs.type)) {
        throw new Error(`object at is not a Swapped object`);
      }

      return Swapped.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return Swapped.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<Swapped> {
    const res = await fetchObjectBcs(client, id);
    if (!isSwapped(res.type)) {
      throw new Error(`object at id ${id} is not a Swapped object`);
    }

    return Swapped.fromBcs(res.bcsBytes);
  }
}
