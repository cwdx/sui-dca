import { bcs } from "@mysten/sui/bcs";
import type { SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromBase64 } from "@mysten/sui/utils";
import { getTypeOrigin } from "../../../_envs";
import {
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  type PhantomReified,
  phantom,
  type Reified,
  type StructClass,
  type ToField,
  type ToTypeStr,
} from "../../../_framework/reified";
import {
  composeSuiType,
  compressSuiType,
  type FieldsWithTypes,
  fetchObjectBcs,
  type SupportedSuiClient,
} from "../../../_framework/util";

/* ============================== Result =============================== */

export function isResult(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("flowx-amm", "comparator::Result")}::comparator::Result`
  );
}

export interface ResultFields {
  inner: ToField<"u8">;
}

export type ResultReified = Reified<Result, ResultFields>;

export type ResultJSONField = {
  inner: number;
};

export type ResultJSON = {
  $typeName: typeof Result.$typeName;
  $typeArgs: [];
} & ResultJSONField;

export class Result implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::comparator::Result` = `${getTypeOrigin(
    "flowx-amm",
    "comparator::Result",
  )}::comparator::Result` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof Result.$typeName = Result.$typeName;
  readonly $fullTypeName: `${string}::comparator::Result`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof Result.$isPhantom = Result.$isPhantom;

  readonly inner: ToField<"u8">;

  private constructor(typeArgs: [], fields: ResultFields) {
    this.$fullTypeName = composeSuiType(
      Result.$typeName,
      ...typeArgs,
    ) as `${string}::comparator::Result`;
    this.$typeArgs = typeArgs;

    this.inner = fields.inner;
  }

  static reified(): ResultReified {
    const reifiedBcs = Result.bcs;
    return {
      typeName: Result.$typeName,
      fullTypeName: composeSuiType(
        Result.$typeName,
        ...[],
      ) as `${string}::comparator::Result`,
      typeArgs: [] as [],
      isPhantom: Result.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Result.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        Result.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Result.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => Result.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Result.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        Result.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        Result.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        Result.fetch(client, id),
      new: (fields: ResultFields) => {
        return new Result([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ResultReified {
    return Result.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<Result>> {
    return phantom(Result.reified());
  }

  static get p(): PhantomReified<ToTypeStr<Result>> {
    return Result.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("Result", {
      inner: bcs.u8(),
    });
  }

  private static cachedBcs: ReturnType<typeof Result.instantiateBcs> | null =
    null;

  static get bcs(): ReturnType<typeof Result.instantiateBcs> {
    if (!Result.cachedBcs) {
      Result.cachedBcs = Result.instantiateBcs();
    }
    return Result.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): Result {
    return Result.reified().new({
      inner: decodeFromFields("u8", fields.inner),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Result {
    if (!isResult(item.type)) {
      throw new Error("not a Result type");
    }

    return Result.reified().new({
      inner: decodeFromFieldsWithTypes("u8", item.fields.inner),
    });
  }

  static fromBcs(data: Uint8Array): Result {
    return Result.fromFields(Result.bcs.parse(data));
  }

  toJSONField(): ResultJSONField {
    return {
      inner: this.inner,
    };
  }

  toJSON(): ResultJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): Result {
    return Result.reified().new({
      inner: decodeFromJSONField("u8", field.inner),
    });
  }

  static fromJSON(json: Record<string, any>): Result {
    if (json.$typeName !== Result.$typeName) {
      throw new Error(
        `not a Result json object: expected '${Result.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return Result.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): Result {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isResult(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a Result object`,
      );
    }
    return Result.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): Result {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isResult(data.bcs.type)) {
        throw new Error(`object at is not a Result object`);
      }

      return Result.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return Result.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SupportedSuiClient, id: string): Promise<Result> {
    const res = await fetchObjectBcs(client, id);
    if (!isResult(res.type)) {
      throw new Error(`object at id ${id} is not a Result object`);
    }

    return Result.fromBcs(res.bcsBytes);
  }
}
